import onChange from "on-change";
import AbstractView from "../../common/abstract-view.js";
import Header from "../../components/header/header.js";

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
    this.setTitle("Поиск книг");
    this.header = new Header(this.appState);
  }
  appStateHook(path) {
    console.log(path);
    this.header.updateCounter();
  }
  render() {
    this.app.prepend(this.header.create());
    const el = document.createElement("h1");
    el.textContent = "Поиск книг";
    this.app.append(el);
  }
}
