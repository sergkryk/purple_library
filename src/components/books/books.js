import "./books.css";
import AbstractNode from "../../common/abstract-node";
import BookCard from "../book-card/book-card";
import AbstractSection from "../../common/abstract-section";

export default class Books extends AbstractSection {
  constructor(booksList, appState) {
    super();
    this.books = booksList;
    this.appState = appState;
    this.list = new AbstractNode("ul", ["books__list"]).create();
  }
  addToList() {
    if (this.books.length <= 0) {
      return;
    }
    this.list.append(
      ...this.books.map((book) => new BookCard(book, this.appState).create())
    );
  }
  create() {
    this.section.classList.add("books");
    this.title.classList.add("books__title");
    this.addToList();
    this.section.append(this.list);
    return this.section;
  }
  update(newBooksList) {
    this.books = newBooksList;
    this.list.innerHTML = "";
    this.addToList();
  }
}
