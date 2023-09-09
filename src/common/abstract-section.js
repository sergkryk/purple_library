export default class AbstractSection {
  constructor() {
    this.section = document.createElement("section");
    this.title = document.createElement("h1");
    this.section.prepend(this.title);
  }
  setTitle(title) {
    this.title.textContent = title;
  }
  create() {
    return this.section;
  }
  destroy() {
    this.section.remove();
  }
} 