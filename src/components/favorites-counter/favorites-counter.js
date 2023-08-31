import './favorites-counter.css'
import AbstractNode from "../../common/abstract-node";

export default class FavoritesCounter {
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
