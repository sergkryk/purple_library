import onChange from "on-change";
import AbstractView from "../../common/abstract-view.js";
import Header from "../../components/header/header.js";
import Search from "../../components/search/search.js";
import Books from "../../components/books/books.js";

export default class MainView extends AbstractView {
  state = {
    list: [],
    isLoading: false,
    searchQuery: null,
    offset: 0,
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
  async stateHook(path) {
    if (path === "searchQuery") {
      this.state.isLoading = true;
      const data = await this.load(this.state.searchQuery, this.state.offset);
      this.state.list = data.docs;
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
  }
  render() {
    this.app.prepend(this.header.create());
    this.app.append(this.search.create());
    this.app.append(this.books.create());
  }
  async load(query, offset) {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${query}&offset=${offset}`
    );
    const data = await res.json();
    return data;
  }
}
