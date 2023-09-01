import "./detailed-view.css";
import AbstractView from "../../common/abstract-view";
import Header from "../../components/header/header.js";
import AbstractNode from "../../common/abstract-node";

export default class DetailedView extends AbstractView {
  constructor(appState) {
    super();
    this.appState = appState;
    this.header = new Header(this.appState);
    this.section = new AbstractNode("section", ["detailed"]).create();
  }
  async render() {
    this.app.innerHTML = "";
    this.app.prepend(this.header.create());
    this.section.innerHTML = `
    <h1 class="detailed__title">The Lord of the Rings</h1>
    <div class="detailed__base">
      <div class="detailed__cover">
        <img src="https://covers.openlibrary.org/b/id/8474036-L.jpg" alt="Превью обложки" />
      </div>
      <div class="detailed__info">
        <ul class="detailed__list">
          <li class="detailed__item">
            <span class="detailed__key">Автор:</span>
            <span class="detailed__value">J.R.R. Tolkien</span>
          </li>
          <li class="detailed__item">
            <span class="detailed__key">Категория:</span>
            <span class="detailed__value">Action & Adventure</span>
          </li>
          <li class="detailed__item">
            <span class="detailed__key">Первая публикация:</span>
            <span class="detailed__value">1954</span>
          </li>
          <li class="detailed__item">
            <span class="detailed__key">Число страниц:</span>
            <span class="detailed__value">1193</span>
          </li>
        </ul>
        <button type="button" class="detailed__favorites">В избранное</button>
      </div>
    </div>
    <h2 class="detailed__subtitle">Описание:</h2>
    <p class="detailed__description">
      A Game of Thrones is the first novel in A Song of Ice and Fire, a series of fantasy novels by the American author George R. R. Martin. It was first published on August 1, 1996. The novel won the 1997 Locus Award and was nominated for both the 1997 Nebula Award and the 1997 World Fantasy Award. The novella Blood of the Dragon, comprising the Daenerys Targaryen chapters from the novel, won the 1997 Hugo Award for Best Novella. In January 2011, the novel became a New York Times Bestseller and reached No. 1 on the list in July 2011.
    </p>
    <h2 class="detailed__subtitle">Теги:</h2>
    <ul class="detailed__tags">
      <li class="detailed__tag">
        <span>Fiction</span>
      </li>
      <li class="detailed__tag">
        <span>Fantasy fiction</span>
      </li>
      <li class="detailed__tag">
        <span>English Fantasy fiction</span>
      </li>
      <li class="detailed__tag">
        <span>Wizards</span>
      </li>
    </ul>
    `;
    this.app.append(this.section);
    await this.load();
  }
  async load() {
    const params = new URLSearchParams(location.href.split("?")[1]);
    const res = await fetch(`https://openlibrary.org${params.get("key")}.json`);
    const data = await res.json();
    this.book = data;
  }
}
