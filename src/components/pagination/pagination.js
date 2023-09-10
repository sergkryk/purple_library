import "./pagination.css";
import AbstractNode from "../../common/abstract-node";

export default class Pagination {
  constructor(parentState) {
    this.parentState = parentState;
    this.pagination = new AbstractNode("div", ["pagination"]).create();
    this.previous = new AbstractNode("button", [
      "pagination__button",
      "pagination__button--prev",
    ]).create();
    this.next = new AbstractNode("button", [
      "pagination__button",
      "pagination__button--next",
    ]).create();
  }
  previousClickHandler() {
    this.parentState.offset =
      this.parentState.offset - this.parentState.offsetStep;
    this.next.removeAttribute("disabled");
    if (this.parentState.offset - this.parentState.offsetStep < 0) {
      this.previous.setAttribute("disabled", true);
    }
  }
  nextClickHandler() {
    this.parentState.offset =
      this.parentState.offset + this.parentState.offsetStep;
    this.previous.removeAttribute("disabled");
    if (
      this.parentState.offset + this.parentState.offsetStep >=
      this.parentState.numsFound
    ) {
      this.next.setAttribute("disabled", true);
    }
  }
  setContent() {
    this.previous.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 20 20">
      <use xlink:href="#icon-arrow">
    </svg>
    <span>Предыдущая страница</span>`;
    this.next.innerHTML = `
    <span>Следующая страница</span>
    <svg width="20" height="20" viewBox="0 0 20 20">
      <use xlink:href="#icon-arrow">
    </svg>`;
  }
  setAttributes() {
    this.previous.setAttribute("type", "button");
    this.previous.setAttribute("aria-label", "Предыдущая страница");
    this.next.setAttribute("type", "button");
    this.next.setAttribute("aria-label", "Следующая страница");
  }
  addListeners() {
    this.previous.addEventListener(
      "click",
      this.previousClickHandler.bind(this)
    );
    this.next.addEventListener("click", this.nextClickHandler.bind(this));
  }
  create() {
    if (this.parentState.offset === 0) {
      this.previous.setAttribute("disabled", true);
    }
    this.setContent();
    this.setAttributes();
    this.addListeners();
    this.pagination.append(this.previous, this.next);
    return this.pagination;
  }
  destroy() {
    this.pagination.remove();
  }
}
