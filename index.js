// Import Dependencies.
import express from 'express';
import pg from 'pg';
import jsSha from 'jssha';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';
import moment from 'moment';
import multer from 'multer';

// Init DB connection.
const { Pool } = pg;

// Separate DB connection configs for production vs non-production environments.
let poolConfigs;
if (process.env.ENV === 'PRODUCTION') {
  // Set up Remote Postgres server.
  poolConfigs = {
    user: 'postgres',
    password: process.env.DB_PASSWORD, // DB_PASSWORD - environment variable for security.
    host: 'localhost',
    database: 'bookrepo',
    port: 5432,
  };
} else {
  // Set up Local Postgres server.
  poolConfigs = {
    user: 'jchua',
    host: 'localhost',
    database: 'bookrepo',
    port: 5432,
  };
}

// Create new Pool with above conditions.
const pool = new Pool(poolConfigs);
// Set name of upload directory.
const multerUpload = multer( { dest: 'uploads/' });

// Init Express.
const app = express();
const PORT = process.argv[2];

// Configure Express settings.
app.set('view engine', 'ejs'); // Set view engine for 'ejs' templates.
app.use('/public', express.static('public')); // Retrieve static files from `public`.
app.use(express.static('uploads')); // Retrieve static files from `uploads`.
app.use(express.urlencoded({ extended : false })); // Set up our middleware to parse POST data.
app.use(methodOverride('_method')); // Enable PUT/DELETE headers to be sent in requests.
app.use(cookieParser()); // Configure usage of cookie-parser.

// Helper Functions
const momentFromNow = (date) => {
  return moment(date).fromNow();
};

// /Root - GET Request. []. 
app.get('/', (req, res) => {
  console.log('/ root GET request came in! ---')
  
  // If user is logged-in, redirect to another page.
  const { userId } = req.cookies;

  res.render('root')
});

// (Universal) Books - GET Request. [Render a list of entire database of books].
app.get('/books', (req, res) => {
  console.log('/books GET request came in!')
  const allBooksQuery = `
  WITH bookauthors AS (
    SELECT authors.author_name, book_authors.book_id, authors.id
    FROM authors 
    INNER JOIN book_authors ON authors.id = book_authors.author_id
  ),

  bookgenres AS (
    SELECT genres.genre_name, book_genres.book_id
    FROM genres 
    INNER JOIN book_genres ON genres.id = book_genres.genre_id
  )
  
  SELECT 
    books.id,
    books.book_cover,
    books.title,
    books.description,
    STRING_AGG(DISTINCT bookauthors.author_name, ', ') authors_names,
    STRING_AGG(DISTINCT bookgenres.genre_name, ', ') genres_names
  FROM books
  INNER JOIN bookauthors ON books.id = bookauthors.book_id
  INNER JOIN bookgenres ON books.id = bookgenres.book_id
  GROUP BY 1,2,3,4
  `

  pool
    .query(allBooksQuery)
    .then(result => {
      console.log('allBooksQuery results: --- ', result.rows);
      const allBooksArr = result.rows;

      res.render('books', { allBooksArr })
    })
    .catch(err => console.log('/books GET request Query Error', err));
});

// Books/:id - GET Reuqest. [Render a single book from entire database of books].
app.get('/books/:id', (req, res) => {
  console.log('/books/:id GET request came in!');

  const { id } = req.params;

  const singleBookQuery = `
    WITH bookauthors AS (
      SELECT authors.author_name, book_authors.book_id, authors.id
      FROM authors 
      INNER JOIN book_authors ON authors.id = book_authors.author_id
    ),

    bookgenres AS (
      SELECT genres.genre_name, book_genres.book_id
      FROM genres 
      INNER JOIN book_genres ON genres.id = book_genres.genre_id
    )
    
    SELECT 
      books.id,
      books.book_cover,
      books.title,
      books.description,
      STRING_AGG(DISTINCT bookauthors.author_name, ', ') authors_names,
      STRING_AGG(DISTINCT bookgenres.genre_name, ', ') genres_names
    FROM books
    INNER JOIN bookauthors ON books.id = bookauthors.book_id
    INNER JOIN bookgenres ON books.id = bookgenres.book_id
    GROUP BY 1,2,3,4
    HAVING books.id = $1
    `

  pool
    .query(singleBookQuery, [id])
    .then(result => {
      console.log('singleBookQuery results: ---', result.rows);

      const singleBook = result.rows[0];

      res.render('books-id', { singleBook })
    })
    .catch(err => console.log('/books/:id GET request Query Error', err));
});

// Books/:id - POST Reuqest. [Push book metadata into user collection].
app.post('/books/:id', (req, res) => {
  console.log('/books/:id POST request came in!');

  let { userId } = req.cookies;
  const bookId = req.params.id;
  const dateNow = moment().format('YYYY-MM-DD')
  userId = 2;

  const bookCoverQuery = `
  SELECT book_cover 
  FROM books
  WHERE id = $1
  `

  const insertCollectionQuery = `
  INSERT INTO collection (user_id, book_id, user_cover, pages_completed, date_added, date_completed)
  VALUES ($1, $2, $3, $4, $5, $6)
  `;

  pool  
    .query(bookCoverQuery, [ bookId ])
    .then(result => {
      let bookCover = result.rows[0].book_cover;
      const values = [userId, bookId, bookCover, 0, dateNow, 'infinity']

      const myPromise = pool.query(insertCollectionQuery, values);
      return myPromise;
    })
    .then(result => { 
      console.log("Added to colletion table SUCCESS.")
      console.log('insertCollectionQuery results: ---', result.rows);
      // Don't delay this.
      const delayRedirect = () => {
        res.redirect(`/books/${bookId}`);
      }
      const milSecondsDelay = 10000;

      setTimeout(delayRedirect, milSecondsDelay)
    })
    .catch(err =>  console.log('/books/:id query errror: ---', err));
});

// Collection - GET Request. [Render list of user's collected books].
app.get('/collection', (req, res) => {
  console.log('/collection GET request came in! ---')

  const { view } = req.query;
  // const { userId } = req.cookies;
  let userId = 2; // Update this once done with user authentication.

  const userCollectionQuery = `
  WITH bookauthors AS (
    SELECT 
      book_authors.book_id,
      STRING_AGG(DISTINCT authors.author_name, ', ') AS author_names                              
    FROM book_authors                                                                           
    INNER JOIN authors ON book_authors.author_id = authors.id                               
    GROUP BY book_authors.book_id
  ),

  notecount AS (
    SELECT 
      DISTINCT notes.book_id, notes.user_id, 
      COUNT(notes.description) note_counts
    FROM notes
    GROUP BY 1, 2
    HAVING user_id = $1
    ORDER BY 1
  )

  SELECT
    users.id user_id,
    users.user_name, 
    collection.user_cover,
    collection.num_pages,
    collection.pages_completed,
    collection.date_added,
    books.id book_id,
    books.title,
    books.description,
    books.book_cover,
    bookauthors.author_names,
    notecount.note_counts
  FROM users
  INNER JOIN collection ON users.id = collection.user_id
  INNER JOIN books ON collection.book_id = books.id 
  INNER JOIN bookauthors ON books.id = bookauthors.book_id
  LEFT JOIN notecount ON books.id = notecount.book_id
  WHERE users.id = $1
  `;
  
  pool
    .query(userCollectionQuery, [userId])
    .then(result => {
      console.log('userCollectionQuery results: ---', result.rows);
      const collectionArr = result.rows;
      
      // Convert datetime to Moment string.
      collectionArr.forEach(bookListing => {
        bookListing.date_added = momentFromNow(bookListing.date_added);
      });

      // 1st view: Book in Cover format
      if (view === 'covers') {
        res.render('collection-cover', { collectionArr });
      // 2nd view: Book in Table List format
      } else {
        res.render('collection-table', { collectionArr });
      }
    })
    .catch(err => console.log("userCollectionQuery Error: ---", err.stack));
});

// Collection/:id - GET Request. [Render one of user's books along with it's user cover & user notes].
app.get('/collection/:id', (req, res) => {
  console.log('/collection/:id GET request came in! ---')
  let { userId } = req.cookies;
  userId = 2;
  const { id } = req.params;

  const singleBookQuery = `
    WITH bookauthors AS (
      SELECT authors.author_name, book_authors.book_id, authors.id
      FROM authors 
      INNER JOIN book_authors ON authors.id = book_authors.author_id
    ),

    bookgenres AS (
      SELECT genres.genre_name, book_genres.book_id
      FROM genres 
      INNER JOIN book_genres ON genres.id = book_genres.genre_id
    ),

    userscollection AS (
      SELECT 
        users.user_name,
        users.id user_id,
        RANK() OVER (ORDER BY book_id ASC) AS book_rank,
        collection.id AS realbookrank,
        collection.book_id,
        collection.user_cover,
        collection.num_pages,
        collection.pages_completed,
        collection.date_added,
        collection.date_completed
      FROM users
      INNER JOIN collection ON users.id = collection.user_id
      WHERE users.id = ${userId}
    )
    
    SELECT 
      books.id AS book_id,
      books.book_cover,
      books.title,
      books.description,
      userscollection.book_rank,
      STRING_AGG(DISTINCT bookauthors.author_name, ', ') authors_names,
      STRING_AGG(DISTINCT bookgenres.genre_name, ', ') genres_names
    FROM books
    INNER JOIN bookauthors ON books.id = bookauthors.book_id
    INNER JOIN bookgenres ON books.id = bookgenres.book_id
    INNER JOIN userscollection ON books.id = userscollection.book_id
    GROUP BY 1,2,3,4,5
    HAVING userscollection.book_rank = $1
    `;


  pool.query(singleBookQuery, [id], (singleBookQueryErr, singleBookQueryResult) => {
      if (singleBookQueryErr) {
        console.log('/collection/:id GET request singleBookQueryErr', singleBookQueryErr);
      }
    
    const singleBook = singleBookQueryResult.rows[0];

    const notesQuery = `
    SELECT * FROM notes
    WHERE user_id = ${userId} AND book_id = ${singleBook.book_id}
    ORDER BY id DESC;
    `;

    pool.query(notesQuery, (notesQueryErr, notesQueryResult) => {
        if (notesQueryErr) {
          console.log('/collection/:id GET request notesQueryErr', notesQueryErr);
        }

      const userNotesArr = notesQueryResult.rows;
      console.log("userNotes: ----", userNotesArr);

      res.render('collection-id', { singleBook, userNotesArr })
    });
  });
});

// Collection/:id - PUT Request. [Update user cover].
app.put('/collection/:id', multerUpload.single('usercover'), (req, res) => {

  let collectionBookId = req.params.id;
  let { userId } = req.cookies;
  userId = 2;

  // Have to find a way to upload the user_cover to the book_id.
  const insertCoverQuery = `
  WITH userbooksordered AS (
    SELECT 
    user_id,
    book_id,
    RANK() OVER (ORDER BY book_id) AS collection_book_id
  FROM collection
  WHERE user_id = ${userId}
  )

  UPDATE collection 
  SET user_cover = $1
  WHERE user_id = ${userId} AND book_id = (The real book_id, not the collection book id)
  RETURNING *`;

  pool
   .query(insertCoverQuery, [req.file.filename])
   .then(result => {
      const insertCoverResults = result.rows;
      console.log('insertCoverQuery results: ---', insertCoverResults )
    })
   .catch(err => { 
     res.status(503).send('Please try again :(');
     console.log('/collection/:id POST Request query error: ---', err)

   });
});

// Notes/:book_id/:bookrank_id - POST Request. [Insert new note for user].
app.post('/notes/:book_id/:bookrank_id', (req, res) => {
  console.log('notes/:book_id/:bookrank_id POST request came in!')
  let { userId } = req.cookies;
  userId = 2;
  
  const { description } = req.body;
  const { book_id, bookrank_id} = req.params;

  const insertNotesQuery = `
  INSERT INTO notes (user_id, description, book_id, private, date)
  VALUES ($1, $2, $3, $4, $5)
  `

  const values = [userId, description, book_id, 'false', '2019-11-14']

  pool.query(insertNotesQuery, values, (err, result) => {
    if (err) {
      console.log('insertNotesQuery error: ---', err)
    }
    console.log('insertNotesQuery resuults: ---', result.rows)

    res.redirect(`/collection/${bookrank_id}`)
  });
});

// Notes/:note_id/:bookrank_id - DELETE Request. [Delete note for user].
app.delete('/notes/:note_id/:bookrank_id', (req, res) => {
  console.log('notes/:note_id/:bookrank_id DELETE request came in!')

  const { note_id, bookrank_id } = req.params;
  const deleteNoteQuery = 
  `
  DELETE FROM notes
  WHERE id = ${note_id}
  RETURNING *
  `

  pool
    .query(deleteNoteQuery)
    .then(result => {
      console.log('Note sucessfully deleted.');
      res.redirect(`/collection/${bookrank_id}`)
    })
    .catch(err => console.log('notes/:note_id DELETE error: ---', err));
});

// Notes/:note_id/:bookrank_id - PUT Request. [Edit note for user].
app.put('/notes/:note_id/:bookrank_id', (req, res) => {
  console.log('notes/:note_id/:bookrank_id PUT request came in!')

  console.log("body shope:", req.body)

  const { note_id, bookrank_id } = req.params;
  const { editNoteDescription } = req.body;
  const values = [ editNoteDescription, note_id ]

  const editNoteQuery = `
  UPDATE notes
  SET description = $1
  WHERE id = $2
  RETURNING *
  `

  pool
    .query(editNoteQuery, values)
    .then(result => {
      console.log('editNoteQuery results: ---', result.rows);
      res.redirect(`/collection/${bookrank_id}`);
    })
    .catch(err => console.log('editNoteQuery error: ---', err));
});

// Login - GET Request. [Render form for user to log in].
app.get('/login', (req, res) => {
  console.log('/login GET request came in! ---')

  res.render('login');
});

// Login - POST Request. [Accept POST request to log user in].
app.post('/login', (req, res) => {
  console.log('/login POST request came in! ---')

  // Set user ID in a cookie when logged in (rmb to recap jsSha to hash).
  res.cookie('userId', user.id);

  res.render('login');
});

// Start socket and listen on given port.
app.listen(PORT, (err) => {
  if (err) {
    console.log('Timeout - error listening to port.');
  }
  console.log('Success! Connected to port', PORT);
});