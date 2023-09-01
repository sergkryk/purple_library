import "./books.css";
import AbstractNode from "../../common/abstract-node";
import BookCard from "../book-card/book-card";

export default class Books {
  constructor(booksList) {
    this.books = booksList;
    this.section = new AbstractNode("section", ["books"]).create();
    this.title = new AbstractNode("h2", ["books__title"]).create();
    this.list = new AbstractNode("ul", ["books__list"]).create();
  }

  create() {
    if (this.books.length <= 0) {
      this.title.textContent = "Ничего не найдено";
      this.section.append(this.title);
      return this.section;
    }
    this.title.textContent = `Найдено книг - ${this.books.length}`;
    this.books = this.books.map((book) => {
      return new BookCard(book).create();
    });
    this.list.append(...this.books);
    this.section.prepend(this.title);
    this.section.append(this.list);
    return this.section;
  }

  update(newBooksList) {
    this.books = newBooksList;
    this.create();
  }
}
