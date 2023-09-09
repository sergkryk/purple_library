import AbstractNode from "../../common/abstract-node";

export default class BookInfo {
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
