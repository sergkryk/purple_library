import AbstractView from "../abstract-view.js";

export default class MainView extends AbstractView {
  state = {
    list: [],
    isLoading: false,
    searchQuery: null,
    offset: 0,
  }
  constructor(appState) {
    super();
    this.appState = appState; 
    this.setTitle('Поиск книг');
  }
  render() {
    const el = document.createElement('h1');
    el.textContent = "Поиск книг";
    this.app.append(el);
    this.appState.favorites.push('Hello')
  }
}