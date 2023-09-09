(function () {
	'use strict';

	const PATH_SEPARATOR = '.';
	const TARGET = Symbol('target');
	const UNSUBSCRIBE = Symbol('unsubscribe');

	function isBuiltinWithMutableMethods(value) {
		return value instanceof Date
			|| value instanceof Set
			|| value instanceof Map
			|| value instanceof WeakSet
			|| value instanceof WeakMap
			|| ArrayBuffer.isView(value);
	}

	function isBuiltinWithoutMutableMethods(value) {
		return (typeof value === 'object' ? value === null : typeof value !== 'function') || value instanceof RegExp;
	}

	var isArray = Array.isArray;

	function isSymbol(value) {
		return typeof value === 'symbol';
	}

	const path = {
		after: (path, subPath) => {
			if (isArray(path)) {
				return path.slice(subPath.length);
			}

			if (subPath === '') {
				return path;
			}

			return path.slice(subPath.length + 1);
		},
		concat: (path, key) => {
			if (isArray(path)) {
				path = [...path];

				if (key) {
					path.push(key);
				}

				return path;
			}

			if (key && key.toString !== undefined) {
				if (path !== '') {
					path += PATH_SEPARATOR;
				}

				if (isSymbol(key)) {
					return path + key.toString();
				}

				return path + key;
			}

			return path;
		},
		initial: path => {
			if (isArray(path)) {
				return path.slice(0, -1);
			}

			if (path === '') {
				return path;
			}

			const index = path.lastIndexOf(PATH_SEPARATOR);

			if (index === -1) {
				return '';
			}

			return path.slice(0, index);
		},
		last: path => {
			if (isArray(path)) {
				return path[path.length - 1] || '';
			}

			if (path === '') {
				return path;
			}

			const index = path.lastIndexOf(PATH_SEPARATOR);

			if (index === -1) {
				return path;
			}

			return path.slice(index + 1);
		},
		walk: (path, callback) => {
			if (isArray(path)) {
				for (const key of path) {
					callback(key);
				}
			} else if (path !== '') {
				let position = 0;
				let index = path.indexOf(PATH_SEPARATOR);

				if (index === -1) {
					callback(path);
				} else {
					while (position < path.length) {
						if (index === -1) {
							index = path.length;
						}

						callback(path.slice(position, index));

						position = index + 1;
						index = path.indexOf(PATH_SEPARATOR, position);
					}
				}
			}
		},
		get(object, path) {
			this.walk(path, key => {
				if (object) {
					object = object[key];
				}
			});

			return object;
		},
	};

	function isIterator(value) {
		return typeof value === 'object' && typeof value.next === 'function';
	}

	// eslint-disable-next-line max-params
	function wrapIterator(iterator, target, thisArg, applyPath, prepareValue) {
		const originalNext = iterator.next;

		if (target.name === 'entries') {
			iterator.next = function () {
				const result = originalNext.call(this);

				if (result.done === false) {
					result.value[0] = prepareValue(
						result.value[0],
						target,
						result.value[0],
						applyPath,
					);
					result.value[1] = prepareValue(
						result.value[1],
						target,
						result.value[0],
						applyPath,
					);
				}

				return result;
			};
		} else if (target.name === 'values') {
			const keyIterator = thisArg[TARGET].keys();

			iterator.next = function () {
				const result = originalNext.call(this);

				if (result.done === false) {
					result.value = prepareValue(
						result.value,
						target,
						keyIterator.next().value,
						applyPath,
					);
				}

				return result;
			};
		} else {
			iterator.next = function () {
				const result = originalNext.call(this);

				if (result.done === false) {
					result.value = prepareValue(
						result.value,
						target,
						result.value,
						applyPath,
					);
				}

				return result;
			};
		}

		return iterator;
	}

	function ignoreProperty(cache, options, property) {
		return cache.isUnsubscribed
			|| (options.ignoreSymbols && isSymbol(property))
			|| (options.ignoreUnderscores && property.charAt(0) === '_')
			|| ('ignoreKeys' in options && options.ignoreKeys.includes(property));
	}

	/**
	@class Cache
	@private
	*/
	class Cache {
		constructor(equals) {
			this._equals = equals;
			this._proxyCache = new WeakMap();
			this._pathCache = new WeakMap();
			this.isUnsubscribed = false;
		}

		_getDescriptorCache() {
			if (this._descriptorCache === undefined) {
				this._descriptorCache = new WeakMap();
			}

			return this._descriptorCache;
		}

		_getProperties(target) {
			const descriptorCache = this._getDescriptorCache();
			let properties = descriptorCache.get(target);

			if (properties === undefined) {
				properties = {};
				descriptorCache.set(target, properties);
			}

			return properties;
		}

		_getOwnPropertyDescriptor(target, property) {
			if (this.isUnsubscribed) {
				return Reflect.getOwnPropertyDescriptor(target, property);
			}

			const properties = this._getProperties(target);
			let descriptor = properties[property];

			if (descriptor === undefined) {
				descriptor = Reflect.getOwnPropertyDescriptor(target, property);
				properties[property] = descriptor;
			}

			return descriptor;
		}

		getProxy(target, path, handler, proxyTarget) {
			if (this.isUnsubscribed) {
				return target;
			}

			const reflectTarget = target[proxyTarget];
			const source = reflectTarget || target;

			this._pathCache.set(source, path);

			let proxy = this._proxyCache.get(source);

			if (proxy === undefined) {
				proxy = reflectTarget === undefined
					? new Proxy(target, handler)
					: target;

				this._proxyCache.set(source, proxy);
			}

			return proxy;
		}

		getPath(target) {
			return this.isUnsubscribed ? undefined : this._pathCache.get(target);
		}

		isDetached(target, object) {
			return !Object.is(target, path.get(object, this.getPath(target)));
		}

		defineProperty(target, property, descriptor) {
			if (!Reflect.defineProperty(target, property, descriptor)) {
				return false;
			}

			if (!this.isUnsubscribed) {
				this._getProperties(target)[property] = descriptor;
			}

			return true;
		}

		setProperty(target, property, value, receiver, previous) { // eslint-disable-line max-params
			if (!this._equals(previous, value) || !(property in target)) {
				const descriptor = this._getOwnPropertyDescriptor(target, property);

				if (descriptor !== undefined && 'set' in descriptor) {
					return Reflect.set(target, property, value, receiver);
				}

				return Reflect.set(target, property, value);
			}

			return true;
		}

		deleteProperty(target, property, previous) {
			if (Reflect.deleteProperty(target, property)) {
				if (!this.isUnsubscribed) {
					const properties = this._getDescriptorCache().get(target);

					if (properties) {
						delete properties[property];
						this._pathCache.delete(previous);
					}
				}

				return true;
			}

			return false;
		}

		isSameDescriptor(a, target, property) {
			const b = this._getOwnPropertyDescriptor(target, property);

			return a !== undefined
				&& b !== undefined
				&& Object.is(a.value, b.value)
				&& (a.writable || false) === (b.writable || false)
				&& (a.enumerable || false) === (b.enumerable || false)
				&& (a.configurable || false) === (b.configurable || false)
				&& a.get === b.get
				&& a.set === b.set;
		}

		isGetInvariant(target, property) {
			const descriptor = this._getOwnPropertyDescriptor(target, property);

			return descriptor !== undefined
				&& descriptor.configurable !== true
				&& descriptor.writable !== true;
		}

		unsubscribe() {
			this._descriptorCache = null;
			this._pathCache = null;
			this._proxyCache = null;
			this.isUnsubscribed = true;
		}
	}

	function isObject(value) {
		return toString.call(value) === '[object Object]';
	}

	function isDiffCertain() {
		return true;
	}

	function isDiffArrays(clone, value) {
		return clone.length !== value.length || clone.some((item, index) => value[index] !== item);
	}

	const IMMUTABLE_OBJECT_METHODS = new Set([
		'hasOwnProperty',
		'isPrototypeOf',
		'propertyIsEnumerable',
		'toLocaleString',
		'toString',
		'valueOf',
	]);

	const IMMUTABLE_ARRAY_METHODS = new Set([
		'concat',
		'includes',
		'indexOf',
		'join',
		'keys',
		'lastIndexOf',
	]);

	const MUTABLE_ARRAY_METHODS = {
		push: isDiffCertain,
		pop: isDiffCertain,
		shift: isDiffCertain,
		unshift: isDiffCertain,
		copyWithin: isDiffArrays,
		reverse: isDiffArrays,
		sort: isDiffArrays,
		splice: isDiffArrays,
		flat: isDiffArrays,
		fill: isDiffArrays,
	};

	const HANDLED_ARRAY_METHODS = new Set([
		...IMMUTABLE_OBJECT_METHODS,
		...IMMUTABLE_ARRAY_METHODS,
		...Object.keys(MUTABLE_ARRAY_METHODS),
	]);

	function isDiffSets(clone, value) {
		if (clone.size !== value.size) {
			return true;
		}

		for (const element of clone) {
			if (!value.has(element)) {
				return true;
			}
		}

		return false;
	}

	const COLLECTION_ITERATOR_METHODS = [
		'keys',
		'values',
		'entries',
	];

	const IMMUTABLE_SET_METHODS = new Set([
		'has',
		'toString',
	]);

	const MUTABLE_SET_METHODS = {
		add: isDiffSets,
		clear: isDiffSets,
		delete: isDiffSets,
		forEach: isDiffSets,
	};

	const HANDLED_SET_METHODS = new Set([
		...IMMUTABLE_SET_METHODS,
		...Object.keys(MUTABLE_SET_METHODS),
		...COLLECTION_ITERATOR_METHODS,
	]);

	function isDiffMaps(clone, value) {
		if (clone.size !== value.size) {
			return true;
		}

		let bValue;
		for (const [key, aValue] of clone) {
			bValue = value.get(key);

			if (bValue !== aValue || (bValue === undefined && !value.has(key))) {
				return true;
			}
		}

		return false;
	}

	const IMMUTABLE_MAP_METHODS = new Set([...IMMUTABLE_SET_METHODS, 'get']);

	const MUTABLE_MAP_METHODS = {
		set: isDiffMaps,
		clear: isDiffMaps,
		delete: isDiffMaps,
		forEach: isDiffMaps,
	};

	const HANDLED_MAP_METHODS = new Set([
		...IMMUTABLE_MAP_METHODS,
		...Object.keys(MUTABLE_MAP_METHODS),
		...COLLECTION_ITERATOR_METHODS,
	]);

	class CloneObject {
		constructor(value, path, argumentsList, hasOnValidate) {
			this._path = path;
			this._isChanged = false;
			this._clonedCache = new Set();
			this._hasOnValidate = hasOnValidate;
			this._changes = hasOnValidate ? [] : null;

			this.clone = path === undefined ? value : this._shallowClone(value);
		}

		static isHandledMethod(name) {
			return IMMUTABLE_OBJECT_METHODS.has(name);
		}

		_shallowClone(value) {
			let clone = value;

			if (isObject(value)) {
				clone = {...value};
			} else if (isArray(value) || ArrayBuffer.isView(value)) {
				clone = [...value];
			} else if (value instanceof Date) {
				clone = new Date(value);
			} else if (value instanceof Set) {
				clone = new Set([...value].map(item => this._shallowClone(item)));
			} else if (value instanceof Map) {
				clone = new Map();

				for (const [key, item] of value.entries()) {
					clone.set(key, this._shallowClone(item));
				}
			}

			this._clonedCache.add(clone);

			return clone;
		}

		preferredThisArg(isHandledMethod, name, thisArg, thisProxyTarget) {
			if (isHandledMethod) {
				if (isArray(thisProxyTarget)) {
					this._onIsChanged = MUTABLE_ARRAY_METHODS[name];
				} else if (thisProxyTarget instanceof Set) {
					this._onIsChanged = MUTABLE_SET_METHODS[name];
				} else if (thisProxyTarget instanceof Map) {
					this._onIsChanged = MUTABLE_MAP_METHODS[name];
				}

				return thisProxyTarget;
			}

			return thisArg;
		}

		update(fullPath, property, value) {
			const changePath = path.after(fullPath, this._path);

			if (property !== 'length') {
				let object = this.clone;

				path.walk(changePath, key => {
					if (object && object[key]) {
						if (!this._clonedCache.has(object[key])) {
							object[key] = this._shallowClone(object[key]);
						}

						object = object[key];
					}
				});

				if (this._hasOnValidate) {
					this._changes.push({
						path: changePath,
						property,
						previous: value,
					});
				}

				if (object && object[property]) {
					object[property] = value;
				}
			}

			this._isChanged = true;
		}

		undo(object) {
			let change;

			for (let index = this._changes.length - 1; index !== -1; index--) {
				change = this._changes[index];

				path.get(object, change.path)[change.property] = change.previous;
			}
		}

		isChanged(value) {
			return this._onIsChanged === undefined
				? this._isChanged
				: this._onIsChanged(this.clone, value);
		}
	}

	class CloneArray extends CloneObject {
		static isHandledMethod(name) {
			return HANDLED_ARRAY_METHODS.has(name);
		}
	}

	class CloneDate extends CloneObject {
		undo(object) {
			object.setTime(this.clone.getTime());
		}

		isChanged(value, equals) {
			return !equals(this.clone.valueOf(), value.valueOf());
		}
	}

	class CloneSet extends CloneObject {
		static isHandledMethod(name) {
			return HANDLED_SET_METHODS.has(name);
		}

		undo(object) {
			for (const value of this.clone) {
				object.add(value);
			}

			for (const value of object) {
				if (!this.clone.has(value)) {
					object.delete(value);
				}
			}
		}
	}

	class CloneMap extends CloneObject {
		static isHandledMethod(name) {
			return HANDLED_MAP_METHODS.has(name);
		}

		undo(object) {
			for (const [key, value] of this.clone.entries()) {
				object.set(key, value);
			}

			for (const key of object.keys()) {
				if (!this.clone.has(key)) {
					object.delete(key);
				}
			}
		}
	}

	class CloneWeakSet extends CloneObject {
		constructor(value, path, argumentsList, hasOnValidate) {
			super(undefined, path, argumentsList, hasOnValidate);

			this._arg1 = argumentsList[0];
			this._weakValue = value.has(this._arg1);
		}

		isChanged(value) {
			return this._weakValue !== value.has(this._arg1);
		}

		undo(object) {
			if (this._weakValue && !object.has(this._arg1)) {
				object.add(this._arg1);
			} else {
				object.delete(this._arg1);
			}
		}
	}

	class CloneWeakMap extends CloneObject {
		constructor(value, path, argumentsList, hasOnValidate) {
			super(undefined, path, argumentsList, hasOnValidate);

			this._weakKey = argumentsList[0];
			this._weakHas = value.has(this._weakKey);
			this._weakValue = value.get(this._weakKey);
		}

		isChanged(value) {
			return this._weakValue !== value.get(this._weakKey);
		}

		undo(object) {
			const weakHas = object.has(this._weakKey);

			if (this._weakHas && !weakHas) {
				object.set(this._weakKey, this._weakValue);
			} else if (!this._weakHas && weakHas) {
				object.delete(this._weakKey);
			} else if (this._weakValue !== object.get(this._weakKey)) {
				object.set(this._weakKey, this._weakValue);
			}
		}
	}

	class SmartClone {
		constructor(hasOnValidate) {
			this._stack = [];
			this._hasOnValidate = hasOnValidate;
		}

		static isHandledType(value) {
			return isObject(value)
				|| isArray(value)
				|| isBuiltinWithMutableMethods(value);
		}

		static isHandledMethod(target, name) {
			if (isObject(target)) {
				return CloneObject.isHandledMethod(name);
			}

			if (isArray(target)) {
				return CloneArray.isHandledMethod(name);
			}

			if (target instanceof Set) {
				return CloneSet.isHandledMethod(name);
			}

			if (target instanceof Map) {
				return CloneMap.isHandledMethod(name);
			}

			return isBuiltinWithMutableMethods(target);
		}

		get isCloning() {
			return this._stack.length > 0;
		}

		start(value, path, argumentsList) {
			let CloneClass = CloneObject;

			if (isArray(value)) {
				CloneClass = CloneArray;
			} else if (value instanceof Date) {
				CloneClass = CloneDate;
			} else if (value instanceof Set) {
				CloneClass = CloneSet;
			} else if (value instanceof Map) {
				CloneClass = CloneMap;
			} else if (value instanceof WeakSet) {
				CloneClass = CloneWeakSet;
			} else if (value instanceof WeakMap) {
				CloneClass = CloneWeakMap;
			}

			this._stack.push(new CloneClass(value, path, argumentsList, this._hasOnValidate));
		}

		update(fullPath, property, value) {
			this._stack[this._stack.length - 1].update(fullPath, property, value);
		}

		preferredThisArg(target, thisArg, thisProxyTarget) {
			const {name} = target;
			const isHandledMethod = SmartClone.isHandledMethod(thisProxyTarget, name);

			return this._stack[this._stack.length - 1]
				.preferredThisArg(isHandledMethod, name, thisArg, thisProxyTarget);
		}

		isChanged(isMutable, value, equals) {
			return this._stack[this._stack.length - 1].isChanged(isMutable, value, equals);
		}

		undo(object) {
			if (this._previousClone !== undefined) {
				this._previousClone.undo(object);
			}
		}

		stop() {
			this._previousClone = this._stack.pop();

			return this._previousClone.clone;
		}
	}

	/* eslint-disable unicorn/prefer-spread */

	const defaultOptions = {
		equals: Object.is,
		isShallow: false,
		pathAsArray: false,
		ignoreSymbols: false,
		ignoreUnderscores: false,
		ignoreDetached: false,
		details: false,
	};

	const onChange = (object, onChange, options = {}) => {
		options = {
			...defaultOptions,
			...options,
		};

		const proxyTarget = Symbol('ProxyTarget');
		const {equals, isShallow, ignoreDetached, details} = options;
		const cache = new Cache(equals);
		const hasOnValidate = typeof options.onValidate === 'function';
		const smartClone = new SmartClone(hasOnValidate);

		// eslint-disable-next-line max-params
		const validate = (target, property, value, previous, applyData) => !hasOnValidate
			|| smartClone.isCloning
			|| options.onValidate(path.concat(cache.getPath(target), property), value, previous, applyData) === true;

		const handleChangeOnTarget = (target, property, value, previous) => {
			if (
				!ignoreProperty(cache, options, property)
				&& !(ignoreDetached && cache.isDetached(target, object))
			) {
				handleChange(cache.getPath(target), property, value, previous);
			}
		};

		// eslint-disable-next-line max-params
		const handleChange = (changePath, property, value, previous, applyData) => {
			if (smartClone.isCloning) {
				smartClone.update(changePath, property, previous);
			} else {
				onChange(path.concat(changePath, property), value, previous, applyData);
			}
		};

		const getProxyTarget = value => value
			? (value[proxyTarget] || value)
			: value;

		const prepareValue = (value, target, property, basePath) => {
			if (
				isBuiltinWithoutMutableMethods(value)
				|| property === 'constructor'
				|| (isShallow && !SmartClone.isHandledMethod(target, property))
				|| ignoreProperty(cache, options, property)
				|| cache.isGetInvariant(target, property)
				|| (ignoreDetached && cache.isDetached(target, object))
			) {
				return value;
			}

			if (basePath === undefined) {
				basePath = cache.getPath(target);
			}

			return cache.getProxy(value, path.concat(basePath, property), handler, proxyTarget);
		};

		const handler = {
			get(target, property, receiver) {
				if (isSymbol(property)) {
					if (property === proxyTarget || property === TARGET) {
						return target;
					}

					if (
						property === UNSUBSCRIBE
						&& !cache.isUnsubscribed
						&& cache.getPath(target).length === 0
					) {
						cache.unsubscribe();
						return target;
					}
				}

				const value = isBuiltinWithMutableMethods(target)
					? Reflect.get(target, property)
					: Reflect.get(target, property, receiver);

				return prepareValue(value, target, property);
			},

			set(target, property, value, receiver) {
				value = getProxyTarget(value);

				const reflectTarget = target[proxyTarget] || target;
				const previous = reflectTarget[property];

				if (equals(previous, value) && property in target) {
					return true;
				}

				const isValid = validate(target, property, value, previous);

				if (
					isValid
					&& cache.setProperty(reflectTarget, property, value, receiver, previous)
				) {
					handleChangeOnTarget(target, property, target[property], previous);

					return true;
				}

				return !isValid;
			},

			defineProperty(target, property, descriptor) {
				if (!cache.isSameDescriptor(descriptor, target, property)) {
					const previous = target[property];

					if (
						validate(target, property, descriptor.value, previous)
						&& cache.defineProperty(target, property, descriptor, previous)
					) {
						handleChangeOnTarget(target, property, descriptor.value, previous);
					}
				}

				return true;
			},

			deleteProperty(target, property) {
				if (!Reflect.has(target, property)) {
					return true;
				}

				const previous = Reflect.get(target, property);
				const isValid = validate(target, property, undefined, previous);

				if (
					isValid
					&& cache.deleteProperty(target, property, previous)
				) {
					handleChangeOnTarget(target, property, undefined, previous);

					return true;
				}

				return !isValid;
			},

			apply(target, thisArg, argumentsList) {
				const thisProxyTarget = thisArg[proxyTarget] || thisArg;

				if (cache.isUnsubscribed) {
					return Reflect.apply(target, thisProxyTarget, argumentsList);
				}

				if (
					(details === false
						|| (details !== true && !details.includes(target.name)))
					&& SmartClone.isHandledType(thisProxyTarget)
				) {
					let applyPath = path.initial(cache.getPath(target));
					const isHandledMethod = SmartClone.isHandledMethod(thisProxyTarget, target.name);

					smartClone.start(thisProxyTarget, applyPath, argumentsList);

					let result = Reflect.apply(
						target,
						smartClone.preferredThisArg(target, thisArg, thisProxyTarget),
						isHandledMethod
							? argumentsList.map(argument => getProxyTarget(argument))
							: argumentsList,
					);

					const isChanged = smartClone.isChanged(thisProxyTarget, equals);
					const previous = smartClone.stop();

					if (SmartClone.isHandledType(result) && isHandledMethod) {
						if (thisArg instanceof Map && target.name === 'get') {
							applyPath = path.concat(applyPath, argumentsList[0]);
						}

						result = cache.getProxy(result, applyPath, handler);
					}

					if (isChanged) {
						const applyData = {
							name: target.name,
							args: argumentsList,
							result,
						};
						const changePath = smartClone.isCloning
							? path.initial(applyPath)
							: applyPath;
						const property = smartClone.isCloning
							? path.last(applyPath)
							: '';

						if (validate(path.get(object, changePath), property, thisProxyTarget, previous, applyData)) {
							handleChange(changePath, property, thisProxyTarget, previous, applyData);
						} else {
							smartClone.undo(thisProxyTarget);
						}
					}

					if (
						(thisArg instanceof Map || thisArg instanceof Set)
						&& isIterator(result)
					) {
						return wrapIterator(result, target, thisArg, applyPath, prepareValue);
					}

					return result;
				}

				return Reflect.apply(target, thisArg, argumentsList);
			},
		};

		const proxy = cache.getProxy(object, options.pathAsArray ? [] : '', handler);
		onChange = onChange.bind(proxy);

		if (hasOnValidate) {
			options.onValidate = options.onValidate.bind(proxy);
		}

		return proxy;
	};

	onChange.target = proxy => (proxy && proxy[TARGET]) || proxy;
	onChange.unsubscribe = proxy => proxy[UNSUBSCRIBE] || proxy;

	class AbstractView {
	  constructor() {
	    this.app = document.querySelector('#root');
	  }
	  setTitle(title) {
	    document.title = title;
	  }
	  render() {
	    return;
	  }
	  destroy() {
	    this.app.innerHTML = '';
	  }
	}

	class AbstractNode {
	  constructor(node, nodeClasses) {
	    this.classList = nodeClasses;
	    this.node = document.createElement(node);
	    this.node.classList.add(...this.classList);
	  }

	  create() {
	    return this.node;
	  }
	}

	class FavoritesCounter {
	  constructor(count) {
	    this.count = count;
	    this.node = new AbstractNode("span", ["nav__counter"]).create();
	    this.node.textContent = count;
	  }
	  create() {
	    return this.node;
	  }
	  update(count) {
	    this.node.textContent = count;
	  }
	}

	class HeaderFavorites {
	  constructor(counter) {
	    this.counter = counter;
	    this.element = new AbstractNode("li", ["nav__item"]).create();
	  }
	  create() {
	    this.element.innerHTML = `
      <div class="nav__item-logo">
        <svg width="20" height="20" fill="none"><use xlink:href="#icon-favorites"></use></svg>
      </div>
      <a href="#favorites" class="nav__item-link">Избранное</a>`;
	    this.element.appendChild(this.counter.create());
	    return this.element;
	  }
	}

	class HeaderSearch {
	  create() {
	    const item = new AbstractNode('li', ['nav__item']).create();
	    item.innerHTML = `<div class="nav__item-logo"><svg width="20" height="20" viewBox="0 0 20 20"><use xlink:href="#icon-search"></use></svg></div><a href="#" class="nav__item-link">Поиск книг</a>`;
	    return item;
	  }
	}

	class Logo {
	  create() {
	    const logo = new AbstractNode('div', ['header__logo']).create();
	    logo.innerHTML = `<svg width="40" height="40" fill="none"><use xlink:href="#icon-logo"></use></svg>`;
	    return logo;
	  }
	}

	class Header {
	  constructor(appState) {
	    this.appState = appState;
	    this.counter = new FavoritesCounter(this.appState.favorites.length);
	    this.header = new AbstractNode("header", ["header"]).create();
	    this.headerNav = new AbstractNode("nav", ["header__nav", "nav"]).create();
	    this.headerList = new AbstractNode("ul", ["nav__list"]).create();
	    this.headerLogo = new Logo().create();
	    this.headerSearch = new HeaderSearch().create();
	    this.headerFavourites = new HeaderFavorites(this.counter).create();
	  }

	  create() {
	    this.headerList.appendChild(this.headerSearch);
	    this.headerList.appendChild(this.headerFavourites);
	    this.headerNav.appendChild(this.headerList);
	    this.header.appendChild(this.headerLogo);
	    this.header.appendChild(this.headerNav);
	    return this.header;
	  }
	  updateCounter() {
	    this.counter.update(this.appState.favorites.length);
	  }
	}

	class Tags {
	  constructor(tags) {
	    this.tags = tags;
	    this.wrapper = new AbstractNode("div", ["book__wrapper"]).create();
	    this.title = new AbstractNode("h2", ["book__subtitle"]).create();
	    this.list = new AbstractNode("ul", ["book__tags"]).create();
	  }
	  createTag(tag) {
	    const li = new AbstractNode("li", ["book__tag"]).create();
	    const span = new AbstractNode("span", []).create();
	    span.textContent = tag;
	    li.append(span);
	    return li;
	  }
	  create() {
	    if (this.tags.length <= 0) {
	      return this.wrapper;
	    }
	    this.title.textContent = `Теги`;
	    this.list.append(...this.tags.map(tag => this.createTag(tag)));
	    this.wrapper.prepend(this.title);
	    this.wrapper.append(this.list);
	    return this.wrapper;
	  }
	}

	class Description {
	  constructor(description) {
	    this.description = description;
	    this.wrapper = new AbstractNode("div", ["book__wrapper"]).create();
	    this.title = new AbstractNode("h2", ["book__subtitle"]).create();
	    this.content = new AbstractNode("p", ["book__description"]).create();
	  }
	  create() {
	    this.title.textContent = `Описание`;
	    this.wrapper.prepend(this.title);
	    if (typeof(this.description) === "object" && this.description?.value) {
	      this.content.textContent = this.description.value;
	    } 
	    if (typeof(this.description) === "string" && this.description.length > 0) {
	      this.content.textContent = this.description;
	    } 
	    this.wrapper.append(this.content);
	    return this.wrapper;
	  }
	}

	class BookInfo {
	  dict = {
	    author_name: "Автор",
	    number_of_pages_median: "Количество страниц",
	    first_publish_year: "Первая публикация",
	    subject_facet: "Категория",
	  };
	  constructor(book) {
	    this.book = book;
	    this.wrapper = new AbstractNode("div", ["book__info"]).create();
	    this.list = new AbstractNode("ul", ["book__list"]).create();
	  }
	  createInfoItem(key, value) {
	    const li = new AbstractNode("li", ["book__item"]).create();
	    const keyEl = new AbstractNode("span", ["book__key"]).create();
	    const valueEl = new AbstractNode("span", ["book__value"]).create();
	    keyEl.textContent = this.dict[key];
	    valueEl.textContent = Array.isArray(value) ? value[0] : value;
	    li.append(keyEl, valueEl);
	    return li;
	  }
	  fillList() {
	    for (const key in this.dict) {
	      if (this.book[key]) {
	        this.list.append(this.createInfoItem(key, this.book[key]));
	      }
	    }
	  }
	  create() {
	    this.fillList();
	    this.wrapper.prepend(this.list);
	    return this.wrapper;
	  }
	}

	class BookView extends AbstractView {
	  state = {
	    isLoading: false,
	  };

	  constructor(appState) {
	    super();
	    this.appState = appState;
	    this.header = new Header(this.appState);
	    this.section = new AbstractNode("section", ["book"]).create();
	    this.title = new AbstractNode("h1", ["book__title"]).create();
	    this.base = new AbstractNode("div", ["book__base"]).create();
	    this.cover = new AbstractNode("div", ["book__cover"]).create();
	    this.button = new AbstractNode("button", ["book__favorites"]).create();
	    this.urlParams = new URLSearchParams(location.href.split("?")[1]);
	    this.appState = onChange(this.appState, this.appStateHook.bind(this));
	    this.state = onChange(this.state, this.stateHook.bind(this));
	  }

	  appStateHook(path) {
	    if (path === "favorites") {
	      this.header.updateCounter();
	    }
	  }
	  stateHook(path) {
	    if (path === "isLoading") {
	      this.state.isLoading
	        ? this.app.classList.add("loading")
	        : this.app.classList.remove("loading");
	    }
	  }
	  addListeners() {
	    this.button.addEventListener("click", () => {
	      this.appState.favorites = this.book;
	    });
	  }
	  setTitle() {
	    this.title.textContent = this.book.title;
	    this.section.prepend(this.title);
	  }
	  setBase() {
	    this.button.textContent = "В избранное";
	    this.button.setAttribute("type", "button");
	    this.cover.innerHTML = `<img src="https://covers.openlibrary.org/b/id/${this.book.cover_i}-L.jpg" alt="Превью обложки" />`;
	    const info = new BookInfo(this.book).create();
	    info.append(this.button);
	    this.base.append(this.cover, info);
	    this.section.append(this.base);
	  }
	  setDescription() {
	    if (this.book?.description) {
	      const description = new Description(this.book.description).create();
	      this.section.append(description);
	    }
	  }
	  setTags() {
	    if (this.book?.subject?.length > 0) {
	      const tags = new Tags(this.book.subject).create();
	      this.section.append(tags);
	    }
	  }
	  async render() {
	    this.app.prepend(this.header.create());
	    await this.load();
	    this.setTitle();
	    this.setBase();
	    this.setDescription();
	    this.setTags();
	    this.addListeners();
	    this.app.append(this.section);
	  }
	  async loadDescription() {
	    const res = await fetch(
	      `https://openlibrary.org${this.urlParams.get("key")}.json`
	    );
	    const data = await res.json();
	    return data?.description ? data.description : "";
	  }
	  async loadInfo() {
	    const res = await fetch(
	      `https://openlibrary.org/search.json?q=key:${this.urlParams.get("key")}`
	    );
	    const data = await res.json();
	    return data.docs[0];
	  }
	  async load() {
	    this.state.isLoading = true;
	    const description = await this.loadDescription();
	    const info = await this.loadInfo();
	    this.book = Object.assign(info, { description });
	    this.state.isLoading = false;
	  }
	}

	class BookCard {
	  constructor(book, appState) {
	    this.book = book;
	    this.appState = appState;
	    this.card = new AbstractNode("li", [
	      "books__list-item",
	      "book-card",
	    ]).create();
	    this.title = new AbstractNode("h3", ["book-card__title"]).create();
	    this.genre = new AbstractNode("p", ["book-card__genre"]).create();
	    this.author = new AbstractNode("p", ["book-card__author"]).create();
	    this.button = new AbstractNode("button", ["book-card__favorite"]).create();
	    this.cover = new AbstractNode("img", ["book-card__cover"]).create();
	    this.content = new AbstractNode("div", ["book-card__content"]).create();
	    this.wrapper = new AbstractNode("div", [
	      "book-card__cover-wrapper",
	    ]).create();
	  }

	  titleClickHandler() {
	    window.location.href = `#book?key=${this.book.key}`;
	  }

	  favoritesClickHandler() {
	    this.appState.favorites = this.book;
	    this.card.classList.toggle("book-card--favorite");
	  }

	  setListeners() {
	    this.title.addEventListener("click", this.titleClickHandler.bind(this));
	    this.button.addEventListener(
	      "click",
	      this.favoritesClickHandler.bind(this)
	    );
	  }
	  setCoverSrc() {
	    this.book?.cover_i
	      ? this.cover.setAttribute(
	          "src",
	          `https://covers.openlibrary.org/b/id/${this.book.cover_i}-M.jpg`
	        )
	      : "";
	  }
	  setContent() {
	    this.title.textContent = this.book.title;
	    this.author.textContent = this.book.author_name;
	    this.genre.textContent = this.book?.subject ? this.book.subject[0] : "";
	    this.button.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20"><use xlink:href="#icon-favorites"></use></svg>`;
	  }
	  isFavorite() {
	    if (this.appState.favorites.find((el) => el.key === this.book.key)) {
	      this.card.classList.add("book-card--favorite");
	    }
	  }
	  create() {
	    this.setListeners();
	    this.setCoverSrc();
	    this.setContent();
	    this.isFavorite();
	    this.content.append(this.genre, this.title, this.author, this.button);
	    this.wrapper.append(this.cover);
	    this.card.append(this.wrapper, this.content);
	    return this.card;
	  }
	}

	class Books {
	  constructor(booksList, appState) {
	    this.books = booksList;
	    this.appState = appState;
	    this.section = new AbstractNode("section", ["books"]).create();
	    this.title = new AbstractNode("h2", ["books__title"]).create();
	    this.list = new AbstractNode("ul", ["books__list"]).create();
	  }
	  clear() {
	    this.title.textContent = "";
	    this.list.innerHTML = "";
	  }
	  create() {
	    if (this.books.length <= 0) {
	      this.title.textContent = "Ничего не найдено";
	      this.section.append(this.title);
	      return this.section;
	    }
	    this.title.textContent = `Найдено книг - ${this.books.length}`;
	    this.list.append(...this.books.map(book => new BookCard(book, this.appState).create()));
	    this.section.prepend(this.title);
	    this.section.append(this.list);
	    return this.section;
	  }
	  update(newBooksList) {
	    this.books = newBooksList;
	    this.clear();
	    this.create();
	  }
	}

	class FavoritesView extends AbstractView {
	  constructor(appState) {
	    super();
	    this.appState = appState;
	    this.appState = onChange(this.appState, this.appStateHook.bind(this));
	    this.header = new Header(this.appState);
	    this.books = new Books(this.appState.favorites, this.appState);
	  }

	  appStateHook(path) {
	    if (path === "favorites") {
	      this.header.updateCounter();
	      this.update();
	    }
	  }
	  render() {
	    this.app.prepend(this.header.create());
	    this.app.append(this.books.create());
	  }
	  update() {
	    this.books.update(this.appState.favorites);
	  }
	}

	class Search {
	  constructor(state) {
	    this.state = state;
	    this.form = new AbstractNode("form", ["search"]).create();
	    this.wrapper = new AbstractNode("div", ["search__wrapper"]).create();
	    this.input = new AbstractNode("input", ["search__input"]).create();
	    this.label = new AbstractNode("label", ["search__label"]).create();
	    this.button = new AbstractNode("button", ["search__button"]).create();
	  }

	  create() {
	    this.button.innerHTML =
	      '<svg width="32" height="32" viewBox="0 0 20 20"><use xlink:href="#icon-search"></use></svg>';
	    this.label.innerHTML =
	      '<svg width="24" height="24" viewBox="0 0 20 20"><use xlink:href="#icon-search"></use></svg>';
	    this.label.setAttribute("for", "search");
	    this.button.setAttribute("type", "submit");
	    this.input.setAttribute("type", "text");
	    this.input.setAttribute("name", "user-query");
	    this.input.setAttribute("id", "search");
	    this.input.setAttribute("placeholder", "Найти книгу или автора...");
	    this.wrapper.prepend(this.input);
	    this.wrapper.append(this.button);
	    this.wrapper.append(this.label);
	    this.form.append(this.wrapper);
	    this.form.addEventListener('submit', this.submitHandler.bind(this));
	    return this.form;
	  }
	  submitHandler(event) {
	    event.preventDefault();
	    this.state.searchQuery = this.input.value;
	  }
	}

	class MainView extends AbstractView {
	  state = {
	    list: [],
	    isLoading: false,
	    searchQuery: null,
	    offset: 0,
	  };
	  constructor(appState) {
	    super();
	    this.appState = appState;
	    this.appState = onChange(this.appState, this.appStateHook.bind(this));
	    this.state = onChange(this.state, this.stateHook.bind(this));
	    this.setTitle("Поиск книг");
	    this.header = new Header(this.appState);
	    this.search = new Search(this.state);
	    this.books = new Books(this.state.list, this.appState);
	  }
	  appStateHook(path) {
	    if (path === "favorites") {
	      this.header.updateCounter();
	    }
	  }
	  async stateHook(path) {
	    if (path === "searchQuery") {
	      this.state.isLoading = true;
	      const data = await this.load(this.state.searchQuery, this.state.offset);
	      this.state.list = data.docs;
	      this.state.isLoading = false;
	    }
	    if (path === "list") {
	      this.books.update(this.state.list);
	    }
	    if (path === "isLoading") {
	      this.state.isLoading
	        ? this.app.classList.add("loading")
	        : this.app.classList.remove("loading");
	    }
	  }
	  render() {
	    this.app.prepend(this.header.create());
	    this.app.append(this.search.create());
	    this.app.append(this.books.create());
	  }
	  async load(query, offset) {
	    const res = await fetch(
	      `https://openlibrary.org/search.json?q=${query}&offset=${offset}`
	    );
	    const data = await res.json();
	    return data;
	  }
	}

	class App {
	  routes = [
	    { path: "", view: MainView },
	    { path: "#book", view: BookView },
	    { path: "#favorites", view: FavoritesView },
	  ];
	  appState = {
	    _favorites: [],
	    get favorites() {
	      return this._favorites;
	    },
	    set favorites(item) {
	      if (this._favorites.find((el) => el.key === item.key)) {
	        this._favorites = this._favorites.filter((el) => el.key !== item.key);
	        return;
	      }
	      this._favorites.push(item);
	    },
	  };
	  constructor() {
	    window.addEventListener("hashchange", this.route.bind(this));
	    this.route();
	  }
	  route() {
	    this.currentView?.destroy();
	    const view = this.routes.find(route => route.path == location.hash.split("?")[0]).view;
	    this.currentView = new view(this.appState);
	    this.currentView.render();
	  }
	}

	new App();

})();
