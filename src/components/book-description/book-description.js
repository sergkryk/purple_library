import AbstractNode from "../../common/abstract-node";

export default class Description {
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
