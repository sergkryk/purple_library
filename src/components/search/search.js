import './search.css';
import AbstractNode from "../../common/abstract-node";

export default class Search {
  constructor() {
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

    return this.form;
  }
}
