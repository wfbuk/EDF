import { Book, fetchBooksByAuthor } from "./BookSearchApiClient";


let books: Book[];
try {
  books = await fetchBooksByAuthor("Shakespeare", 10);
}
catch (error) {
  // Do whatever we need to do with the error
  console.log(error);
}

