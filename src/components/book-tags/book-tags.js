import AbstractNode from "../../common/abstract-node";

export default class Tags {
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
