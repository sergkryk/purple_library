import AbstractNode from "../../common/abstract-node.js";
import FavoritesCounter from "../favorites-counter/favorites-counter.js";
import HeaderFavorites from "../header-favorites/header-favorites.js";
import HeaderSearch from "../header-search/header-search.js";
import Logo from "../logo/logo.js";

export default class Header {
  constructor(appState) {
    this.appState = appState;
    this.counter = new FavoritesCounter(this.appState.favorites.length);
    this.header = new AbstractNode("header", ["header"]).create();
    this.headerNav = new AbstractNode("nav", ["header__nav", "nav"]).create();
    this.headerList = new AbstractNode("header", ["nav__list"]).create();
    this.headerLogo = new Logo().create();
    this.headerSearch = new HeaderSearch().create();
    this.headerFavourites = new HeaderFavorites(this.counter).create();
  }

  create() {
    this.headerList.appendChild(this.headerSearch);
    this.headerList.appendChild(this.headerFavourites);
    this.headerNav.appendChild(this.headerList);
    this.header.appendChild(this.headerLogo);
    this.header.appendChild(this.headerNav);
    return this.header;
  }
  updateCounter() {
    this.counter.update(this.appState.favorites.length);
  }
}
