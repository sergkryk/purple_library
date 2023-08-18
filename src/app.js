import onChange from "on-change";
import MainView from "./common/main/main-view.js";

class App {
  routes = [
    { path: "", view: MainView }
  ]
  appState = {
    favorites: []
  }
  constructor() {
    window.addEventListener('hashchange', this.route.bind(this));
    this.appState = onChange(this.appState, this.appStateHook.bind(this))
    this.route();
  }

  appStateHook(path) {
    console.log(path);
  }

  route() {
    this.currentView?.destroy();
    const view = this.routes.find(route => route.path == location.hash).view;
    this.currentView = new view(this.appState);
    this.currentView.render();
  }
}

new App();