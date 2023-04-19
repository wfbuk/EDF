import axios from 'axios';
import { parseStringPromise } from 'xml2js';

// define Book interface for response to client 
export interface Book {
  title: string,
  author: string,
  isbn: string,
  quantity: number,
  price: number
}

// define convenience BookResponse interface for response from APIS 
export interface BookResponse {
  book: {
    title: string,
    author: string,
    isbn: string
  }
  stock: {
    quantity: number,
    price: number
  }
}


// define formats for response type
enum formats {
  XML = 'application/xml',
  JSON = 'application/json'
};


//initial API url
const defaultUrl = 'http://api.book-seller-example.com/by-author';

/**
 * Facade function to make handling of format transparent to client
 * @param author string
 * @param limit number
 * @param format formats
 * @returns Promise<Book[]> 
 */
export async function fetchBooksByAuthor(author: string, limit: number, format?: formats): Promise<Book[]> {
  let frmt = format === undefined ? formats.JSON : format;
  if (frmt === formats.XML)
    return new XmlApiClient().fetchBooks(author, limit);
  else {
    return new ApiClient().fetchBooks(author, limit);
  }
}


/**
 * Class to make a GET request with Axios. 
 */
class ApiClient {
  url: string = defaultUrl;
  constructor() {
  }

  /**
  * Asycn function to call API with query params for author and limit
  * @param author surname of author
  * @param limit number of items to return 
  * @returns Promise<Book[]>
  */
  async fetchBooks(author: string, limit: number): Promise<Book[]> {
    const params = {
      author: author,
      limitL: limit
    };
    return this.makeRequest(params);
  }

  /**
  * Makes a request with Axios. 
  * Axios defaults everything to JSON so don't need to specify it here
  * @param params query params object
  * @returns Promise<Book[]>
  */
  async makeRequest(params: {}): Promise<Book[]> {
    //get response as array of BookResponse types
    const axiosResponse = await axios.get<BookResponse[]>(this.url, {
      params: params
    });
    //transform response
    return getBooks(axiosResponse.data);
  }
}

/**
 * Extends regular ApiClient class to handle XML responses
 */
class XmlApiClient extends ApiClient {
  constructor() {
    super();
  }

  /**
  * Override makeRequest function to request and handle xml response with Axios;
  * We specify response type alongside the params
  * @param params query params object
  * @returns Promise<Book[]>
  */
  async makeRequest(params: {}): Promise<Book[]> {
    const axiosResponse = await axios.get(this.url, {
      params: params,
      responseType: 'document',
    });
    return parseXml(axiosResponse.data);
  }
}



/**
* Uses uses xml2js to parse an XML Document to JSON object 
* https://www.npmjs.com/package/xml2js
* @param data an XML document
* @returns Promise<Book[]>
*/
async function parseXml(data: Document): Promise<Book[]> {
  const jsonArray = await parseStringPromise(data);
  const books: Book[] = [];
  for (let i = 0; i < jsonArray.length; i++) {
    // JSON object structure same as BookResponse type???
    const bookJson: BookResponse = jsonArray[i] as BookResponse;
    books.push(getBook(bookJson));
  }
  return books;
}

/**
 * Converts an array of BookResponse to an array of Book
 * @param bookResponses BookResponse[]
 * @returns Book[]
 */
function getBooks(bookResponses: BookResponse[]): Book[] {
  const books: Book[] = bookResponses.map(bookResponse => getBook(bookResponse));
  return books;
}

/**
 * Converts an object of type BookResponse to one of type Book
 * @param bookResponse BookResponse
 * @returns Book
 */
function getBook(bookResponse: BookResponse): Book {
  return {
    title: bookResponse.book.title,
    author: bookResponse.book.author,
    isbn: bookResponse.book.isbn,
    quantity: bookResponse.stock.quantity,
    price: bookResponse.stock.price
  };
}

