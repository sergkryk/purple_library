import "./app.css";
import "./normalize.css";
import BookView from "./views/book/book-view.js";
import FavoritesView from "./views/favorites/favorites-view.js";
import MainView from "./views/main/main-view.js";

class App {
  routes = [
    { path: "", view: MainView },
    { path: "#book", view: BookView },
    { path: "#favorites", view: FavoritesView },
  ];
  appState = {
    _favorites: [],
    get favorites() {
      return this._favorites;
    },
    set favorites(item) {
      if (this._favorites.find((el) => el.key === item.key)) {
        this._favorites = this._favorites.filter((el) => el.key !== item.key);
        return;
      }
      this._favorites.push(item);
    },
  };
  constructor() {
    window.addEventListener("hashchange", this.route.bind(this));
    this.route();
  }
  route() {
    this.currentView?.destroy();
    const view = this.routes.find(route => route.path == location.hash.split("?")[0]).view;
    this.currentView = new view(this.appState);
    this.currentView.render();
  }
}

new App();
