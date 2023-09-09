import "./book-card.css";
import AbstractNode from "../../common/abstract-node";

export default class BookCard {
  constructor(book, appState) {
    this.book = book;
    this.appState = appState;
    this.card = new AbstractNode("li", ["books__list-item", "book-card"]).create();
    this.title = new AbstractNode("h3", ["book-card__title"]).create();
    this.genre = new AbstractNode("p", ["book-card__genre"]).create();
    this.author = new AbstractNode("p", ["book-card__author"]).create();
    this.button = new AbstractNode("button", ["book-card__favorite"]).create();
    this.cover = new AbstractNode("img", ["book-card__cover"]).create();
    this.content = new AbstractNode("div", ["book-card__content"]).create();
    this.wrapper = new AbstractNode("div", ["book-card__cover-wrapper"]).create();
  }

  titleClickHandler() {
    console.log('card: ', this.book);
    window.location.href = `#book?key=${this.book.key}`;
  }

  favoritesClickHandler() {
    this.appState.favorites = this.book;
    this.card.classList.add("book-card--favorite");
  }

  setListeners() {
    this.title.addEventListener("click", this.titleClickHandler.bind(this));
    this.button.addEventListener(
      "click",
      this.favoritesClickHandler.bind(this)
    );
  }
  setCoverSrc() {
    this.book?.cover_i
      ? this.cover.setAttribute(
          "src",
          `https://covers.openlibrary.org/b/id/${this.book.cover_i}-M.jpg`
        )
      : "";
  }
  setContent() {
    this.title.textContent = this.book.title;
    this.author.textContent = this.book.author_name;
    this.genre.textContent = this.book?.subject ? this.book.subject[0] : "";
    this.button.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20"><use xlink:href="#icon-favorites"></use></svg>`;
  }

  create() {
    this.setListeners();
    this.setCoverSrc();
    this.setContent();
    this.content.append(this.genre, this.title, this.author, this.button);
    this.wrapper.append(this.cover);
    this.card.append(this.wrapper, this.content);
    return this.card;
  }
}
