import AbstractNode from "../../common/abstract-node";

export default class HeaderSearch {
  create() {
    const item = new AbstractNode('li', ['nav__item']).create();
    item.innerHTML = `<div class="nav__item-logo"><svg width="20" height="20" viewBox="0 0 20 20"><use xlink:href="#icon-search"></use></svg></div><a href="#" class="nav__item-link">Поиск книг</a>`;
    return item;
  }
}
