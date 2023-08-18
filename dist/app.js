(function () {
  'use strict';

  class AbstractView {
    constructor() {
      this.app = document.querySelector('#root');
    }
    setTitle(title) {
      document.title = title;
    }
    render() {
      return;
    }
    destroy() {
      return;
    }
  }

  class MainView extends AbstractView {
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
    }
  }

  class App {
    routes = [
      { path: "", view: MainView }
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
      const view = this.routes.find(route => route.path == location.hash).view;
      this.currentView = new view(this.appState);
      this.currentView.render();
    }
  }

  new App();

})();
