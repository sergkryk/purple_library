import AbstractNode from "../../common/abstract-node";

export default class Logo {
  create() {
    const logo = new AbstractNode('div', ['header__logo']).create();
    logo.innerHTML = `<svg width="40" height="40" fill="none"><use xlink:href="#icon-logo"></use></svg>`;
    return logo;
  }
}
