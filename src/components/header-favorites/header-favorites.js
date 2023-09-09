import AbstractNode from "../../common/abstract-node";

export default class HeaderFavorites {
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
