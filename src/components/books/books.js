import "./books.css";
import AbstractNode from "../../common/abstract-node";
import BookCard from "../book-card/book-card";

export default class Books {
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
