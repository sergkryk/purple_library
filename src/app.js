import './app.css';
import './normalize.css';
import DetailedView from './views/detailed/detailed-view';
import MainView from "./views/main/main-view.js";

class App {
  routes = [
    { path: "", view: MainView },
    { path: "#details", view: DetailedView }
  ]
  appState = {
    favorites: []
  }
  constructor() {
    window.addEventListener('hashchange', this.route.bind(this));
    this.route();
  }
  route() {
    this.currentView?.destroy();
    const view = this.routes.find(route => route.path == location.hash.split('?')[0]).view;
    this.currentView = new view(this.appState);
    this.currentView.render();
  }
}

new App();