import "./book-view.css";
import onChange from "on-change";
import AbstractView from "../../common/abstract-view";
import AbstractNode from "../../common/abstract-node";
import Header from "../../components/header/header.js";
import Tags from "../../components/book-tags/book-tags.js";
import Description from "../../components/book-description/book-description.js";
import BookInfo from "../../components/book-info/book-info.js";

export default class BookView extends AbstractView {
  state = {
    isLoading: false,
  };

  constructor(appState) {
    super();
    this.appState = appState;
    this.header = new Header(this.appState);
    this.section = new AbstractNode("section", ["book"]).create();
    this.title = new AbstractNode("h1", ["book__title"]).create();
    this.base = new AbstractNode("div", ["book__base"]).create();
    this.cover = new AbstractNode("div", ["book__cover"]).create();
    this.button = new AbstractNode("button", ["book__favorites"]).create();
    this.urlParams = new URLSearchParams(location.href.split("?")[1]);
    this.appState = onChange(this.appState, this.appStateHook.bind(this));
    this.state = onChange(this.state, this.stateHook.bind(this));
  }

  appStateHook(path) {
    if (path === "favorites") {
      this.header.updateCounter();
    }
  }
  stateHook(path) {
    if (path === "isLoading") {
      this.state.isLoading
        ? this.app.classList.add("loading")
        : this.app.classList.remove("loading");
    }
  }
  addListeners() {
    this.button.addEventListener("click", () => {
      this.appState.favorites = this.book;
    });
  }
  setTitle() {
    this.title.textContent = this.book.title;
    this.section.prepend(this.title);
  }
  setBase() {
    this.button.textContent = "В избранное";
    this.button.setAttribute("type", "button");
    this.cover.innerHTML = `<img src="https://covers.openlibrary.org/b/id/${this.book.cover_i}-L.jpg" alt="Превью обложки" />`;
    const info = new BookInfo(this.book).create();
    info.append(this.button);
    this.base.append(this.cover, info);
    this.section.append(this.base);
  }
  setDescription() {
    if (this.book?.description) {
      const description = new Description(this.book.description).create();
      this.section.append(description);
    }
  }
  setTags() {
    if (this.book?.subject?.length > 0) {
      const tags = new Tags(this.book.subject).create();
      this.section.append(tags);
    }
  }
  async render() {
    this.app.prepend(this.header.create());
    await this.load();
    this.setTitle();
    this.setBase();
    this.setDescription();
    this.setTags();
    this.addListeners();
    this.app.append(this.section);
  }
  async loadDescription() {
    const res = await fetch(
      `https://openlibrary.org${this.urlParams.get("key")}.json`
    );
    const data = await res.json();
    return data?.description ? data.description : "";
  }
  async loadInfo() {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=key:${this.urlParams.get("key")}`
    );
    const data = await res.json();
    return data.docs[0];
  }
  async load() {
    this.state.isLoading = true;
    const description = await this.loadDescription();
    const info = await this.loadInfo();
    this.book = Object.assign(info, { description });
    this.state.isLoading = false;
  }
}
