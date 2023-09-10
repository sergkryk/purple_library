import onChange from "on-change";
import AbstractView from "../../common/abstract-view.js";
import Header from "../../components/header/header.js";
import Search from "../../components/search/search.js";
import Books from "../../components/books/books.js";
import Pagination from "../../components/pagination/pagination.js";

export default class MainView extends AbstractView {
  state = {
    list: [],
    isLoading: false,
    searchQuery: null,
    offset: 0,
    limit: 9,
    numsFound: 0,
    offsetStep: 9,
  };
  constructor(appState) {
    super();
    this.appState = appState;
    this.appState = onChange(this.appState, this.appStateHook.bind(this));
    this.state = onChange(this.state, this.stateHook.bind(this));
    this.setTitle("Поиск книг");
    this.header = new Header(this.appState);
    this.search = new Search(this.state);
    this.books = new Books(this.state.list, this.appState);
  }
  appStateHook(path) {
    if (path === "favorites") {
      this.header.updateCounter();
    }
  }
  async fetchBooks() {
    const data = await this.load();
    this.state.numsFound = data.numFound;
    this.state.list = data.docs;
  }
  async stateHook(path) {
    if (path === "searchQuery") {
      this.state.isLoading = true;
      await this.fetchBooks()
      this.state.offset = 0;
      this.pagination?.destroy();
      this.renderPagination();
      this.state.isLoading = false;
    }
    if (path === "offset") {
      if (this.state.isLoading) {
        return;
      }
      this.state.isLoading = true;
      await this.fetchBooks()
      this.state.isLoading = false;
    }
    if (path === "list") {
      this.books.update(this.state.list);
    }
    if (path === "isLoading") {
      this.state.isLoading
        ? this.app.classList.add("loading")
        : this.app.classList.remove("loading");
    }
    if (path === "numsFound") {
      this.books.setTitle(
        this.state.numsFound > 0
          ? `Найдено книг - ${this.state.numsFound}`
          : "Ничего не найдено."
      );
    }
  }
  renderPagination() {
    if (this.state.numsFound > 0 && this.state.numsFound > this.state.limit) {
      this.pagination = new Pagination(this.state);
      this.app.append(this.pagination.create());
    }
  }
  render() {
    this.books.setTitle(
      this.state.numsFound > 0 ? this.state.numsFound : "Ничего не найдено."
    );
    this.app.prepend(this.header.create());
    this.app.append(this.search.create(), this.books.create());
  }
  async load() {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${this.state.searchQuery}&offset=${this.state.offset}&limit=${this.state.limit}`
    );
    const data = await res.json();
    return data;
  }
}
