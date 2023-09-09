import BookCard from "../book-card/book-card";

export default class FavoriteCard extends BookCard {
  constructor(book, appState) {
    super(book, appState);
  }
  favoritesClickHandler() {
    this.appState.favorites = this.book;
    if (this.appState.favorites.find(el => el.key === this.book.key)) {
      this.card.classList.toggle("book-card--favorite");
      return;
    }
    this.destroy();
  }
}
