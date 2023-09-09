import Books from "../books/books";
import FavoriteCard from "../favorite-card/favorite-card";

export default class FavoriteBooks extends Books {
  constructor(booksList, appState) {
    super(booksList, appState);
  }
  addToList() {
    if (this.books.length <= 0) {
      return;
    }
    this.list.append(
      ...this.books.map((book) => new FavoriteCard(book, this.appState).create())
    );
  }
}
