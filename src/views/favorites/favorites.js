import onChange from "on-change";
import AbstractView from "../../common/abstract-view";
import Header from "../../components/header/header.js";
import Books from "../../components/books/books";

export default class FavoritesView extends AbstractView {
  constructor(appState) {
    super();
    this.appState = appState;
    this.appState = onChange(this.appState, this.appStateHook.bind(this));
    this.header = new Header(this.appState);
    this.books = new Books(this.appState.favorites, this.appState);
  }

  appStateHook(path) {
    if (path === "favorites") {
      this.header.updateCounter();
      this.update();
    }
  }
  render() {
    this.books.setTitle("Избранные книги.");
    this.app.prepend(this.header.create());
    this.app.append(this.books.create());
  }
  update() {
    this.books.update(this.appState.favorites);
  }
}
