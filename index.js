// Import Dependencies.
import express from 'express';
import pg from 'pg';
import jsSHA from 'jssha';
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
const SALT = 'local';

// Configure Express settings.
app.set('view engine', 'ejs'); // Set view engine for 'ejs' templates.
app.use('/public', express.static('public')); // Retrieve static files from `public`.
app.use(express.static('uploads')); // Retrieve static files from `uploads`.
app.use(express.urlencoded({ extended : false })); // Set up our middleware to parse POST data.
app.use(methodOverride('_method')); // Enable PUT/DELETE headers to be sent in requests.
app.use(cookieParser()); // Configure usage of cookie-parser.

// Helper Functions:
// Helper Function 1 - Convert dates to strings.
const momentFromNow = (date) => {
  return moment(date).fromNow();
};

// Helper Function 2 - Generate hash from cookie/password and salt.
const getHash = (input) => {
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  const unhashedString = `${input}-${SALT}`;
  shaObj.update(unhashedString);

  return shaObj.getHash('HEX');
}

// Helper Function 3 - Run auth middleware to check for log-in & userId.
const checkAuth = (req, res, next) => {  
  console.log("Verifying user authentication. ---")

  const { loggedInHash, userId } = req.cookies;

  req.isUserLoggedIn = false;  // Set default value.

  // Check to see if relevant cookies exists.
  if (loggedInHash && userId) {
    const hash = getHash(userId);
    
    if (loggedInHash === hash) {
      req.isUserLoggedIn = true;
    }
  }
  next();
};

// /Root - GET Request. [Ad Page to prompt user to sign up (if not logged in)]. 
app.get('/', (req, res) => {
  console.log('/ root GET request came in! ---')
  
  // If user is logged-in, redirect to another page.
  const { userId } = req.cookies;

  res.render('root', { userId })
});

// Signup - POST Request. [Accept a POST request to create a user].
app.post('/signup', (req, res) => {
  console.log('/signup POST request came in!');

  const { name, email, password } = req.body;

  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8'});
  shaObj.update(password);
  const hashedPassword = shaObj.getHash('HEX');

  const insertUserQuery = `
  INSERT INTO users (user_name, email, password)
  VALUES ($1, $2, $3)
  RETURNING *
  `
  const values = [ name, email, hashedPassword ];

  pool
  .query(insertUserQuery, values)
  .then(result => {
    console.log('insertUserQuery results: ---', result.rows);
    const newUser = result.rows[0];

    res.render('welcome', { newUser })
  })
  .catch(err => console.log('insertUserQuery error: ---', err))
});

// Login - GET Request. [Render form for user to log in].
app.get('/login', (req, res) => {
  console.log('/login GET request came in! ---')

  res.render('login');
});

// Login - POST Request. [Accept POST request to log user in].
app.post('/login', (req, res) => {
  console.log('/login POST request came in! ---')

  const { email, password } = req.body;

  const selectUserQuery = `
  SELECT * FROM users
  WHERE email = $1
  `;

  pool
    .query(selectUserQuery, [ email ])
    .then(result => {

      // When email does not exist in DB.
      if (result.rows.length === 0) {
        res.status(403).render('error');
        return;
      }

      // Get user record from result.
      const user = result.rows[0];

      // Generate hashed password from what was keyed in log-in form.
      const shaPassword = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
      shaPassword.update(password);
      const hashedPassword = shaPassword.getHash('HEX');

      if (user.password !== hashedPassword) {
        res.status(403).render('error');
        return;
      }

      // Generate hashed cookie value.
      const shaCookie = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
      const unhashedCookieString = `${user.id}-${SALT}`;
      shaCookie.update(unhashedCookieString);
      const hashedCookieString = shaCookie.getHash('HEX');

      res.cookie('loggedInHash', hashedCookieString);
      res.cookie('userId', user.id);
      res.redirect('/collection')
    })
    .catch(err => {
      console.log('Error when making request to /login POST route', err.stack);
      res.status(503).send(result.rows);
      return;
    })
});

// Logout - POST Request. [Log user out by deleting cookies].
app.delete('/logout', (req, res) => {
  console.log('/logout DELETE request came in');

  res.clearCookie('userId');
  res.clearCookie('loggedInHash');

  res.redirect('/')
});

// (Universal) Books - GET Request. [Render a list of entire database of books].
app.get('/books', (req, res) => {
  console.log('/books GET request came in!')
  const { userId } = req.cookies;
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

      res.render('books', { allBooksArr, userId })
    })
    .catch(err => console.log('/books GET request Query Error', err));
});

// Books/:id - GET Request. [Render a single book from entire database of books].
app.get('/books/:id', (req, res) => {
  console.log('/books/:id GET request came in!');

  const { userId } = req.cookies;
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

  pool.query(singleBookQuery, [id], (err , result) => {
    if (err) {
      console.log('/books/:id GET request singleBookQuery Error', err);
    }

    console.log('singleBookQuery results: ---', result.rows);
    const singleBook = result.rows[0];

    const checkBookExistsQuery = `
    SELECT book_id 
    FROM collection
    WHERE user_id = $1 AND book_id IN ($2)
    `;

    pool.query(checkBookExistsQuery, [userId, id], (checkBookExistsQueryErr, checkBookExistsQueryResult) => {
      if (checkBookExistsQueryErr) {
        console.log('/books/:id GET request checkBookExistsQuery error', checkBookExistsQueryErr);
       }

      const bookExistsArr = checkBookExistsQueryResult.rows;

      res.render('books-id', { singleBook, bookExistsArr }) 
     
    });
  });
});

// Books/:id - POST Request. [Push book metadata into user collection].
app.post('/books/:id', (req, res) => {
  console.log('/books/:id POST request came in!');

  const { userId } = req.cookies;
  const bookId = req.params.id;
  const dateNow = moment().format('YYYY-MM-DD')

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

      return pool.query(insertCollectionQuery, values);
    })
    .then(result => { 
      console.log("Added to colletion table SUCCESS.")
      res.redirect(`/books/${bookId}`);
    })
    .catch(err =>  console.log('/books/:id query errror: ---', err));
});

// Collection - GET Request. [Render list of user's collected books].
app.get('/collection', checkAuth, (req, res) => {
  console.log('/collection/ GET request came in! ---')

  // Redirect user if not logged in.
  if (req.isUserLoggedIn === false) {
    res.status(403).send('sorry');
    return;
  }

  const { view } = req.query;
  const { userId } = req.cookies;
  let collectionArr, booksAuthors, noteCounts;

  const collectionQuery = `
  SELECT *
  FROM collection
  WHERE user_id = ${userId}
  `

  pool.query(collectionQuery)
    .then(collectionResult => { 
      collectionArr = collectionResult.rows;

      // Create an array of book_ids which will go in the next query.
      const bookIdArr = collectionArr.map(book => book.book_id)
                                                         
      const bookQuery = `
      SELECT 
        books.id AS book_id,
        books.book_cover,
        books.title,
        books.description,
        book_authors.author_id
      FROM books 
      INNER JOIN book_authors ON books.id = book_authors.book_id
      WHERE books.id IN (${[...bookIdArr]})
      `;
    
      return pool.query(bookQuery)
    })
    .then(booksResult => {
      const collectionAuthors = booksResult.rows;

      // Create an array of author_ids from the bookQuery in previous query.
      const authorIds = collectionAuthors.map(author => author.author_id);

      const bookAuthorsQuery = `
      SELECT 
        book_authors.book_id,
        authors.author_name
      FROM book_authors                                                                           
      INNER JOIN authors ON book_authors.author_id = authors.id                               
      WHERE book_authors.author_id IN (${[...authorIds]})
      `;

      return pool.query(bookAuthorsQuery)
    })
    .then(bookAuthorsResult => { 

      booksAuthors = bookAuthorsResult.rows;
      const authorNames = {};

      for (let i = 0; i < booksAuthors.length; i += 1) {
        const booksAuthor = booksAuthors[i];

        if (!authorNames[booksAuthor.book_id]) {
          authorNames[booksAuthor.book_id] = [];
        } 
        authorNames[booksAuthor.book_id].push(booksAuthor.author_name);
      }

      // Return newly formed authorNames 
      for (let i = 0; i < collectionArr.length ; i ++) {
        // Create new key (author_names), with values (array of authors) from authorNames object.
        collectionArr[i].author_names = authorNames[collectionArr[i].book_id];
      }
      
      const noteCountsQuery = `
       SELECT 
        DISTINCT book_id, 
        user_id, 
        COUNT(description) note_counts
      FROM notes
      GROUP BY 1, 2
      HAVING user_id = $1
      ORDER BY 1`;

      return pool.query(noteCountsQuery, [userId]);
    })
    .then(noteCountsResult => {
      noteCounts = noteCountsResult.rows;
      const bookIds = collectionArr.map(book => book.book_id);

      const bookInfoQuery = `
      SELECT *
      FROM books
      WHERE id IN (${bookIds})
      ` 
      return pool.query(bookInfoQuery)
    })
    .then(bookInfoResult => {
      const bookInfo = bookInfoResult.rows;

      // Add respective book info to the user's collection.
      for (let i = 0; i < collectionArr.length; i++) {
        for (let j = 0; j < bookInfo.length; j++) {
          if (bookInfo[j].id === collectionArr[i].book_id) {
            collectionArr[i].user_cover = bookInfo[j].book_cover
            collectionArr[i].title = bookInfo[j].title
            collectionArr[i].description = bookInfo[j].description
          }
        }
      }
      
      // Add note counts to respective book_ids.
      for (let i = 0 ; i < collectionArr.length; i++) {
          collectionArr[i].note_counts = 0;
        for (let j = 0; j < noteCounts.length; j++) {
          if (collectionArr[i].book_id === noteCounts[j].book_id) {
            collectionArr[i].note_counts = Number(noteCounts[j].note_counts);
          }
        }
      }

      // Convert datetime to Moment string.
      collectionArr.forEach(bookListing => {
        bookListing.date_added = momentFromNow(bookListing.date_added);
      });

      // 1st view: Book in Cover format
      if (view === 'covers') {
        res.render('collection-cover', { collectionArr });
      // 2nd view: Book in Table List format
      } else {
        // res.send(collectionArr);
        res.render('collection-table', { collectionArr });
      }
    })
    .catch(err => {
      res.render('empty-collection-table');
    })
  });

// Collection - DELETE Request. [Delete book from collection list].
app.delete('/collection/:id', (req, res) => {
  console.log('/collection/:id DELETE request came in!');

  const { userId } = req.cookies;
  const bookId = req.params.id;

  console.log('EHHH book_id ----:', bookId);

  const deleteBookQuery = `
  DELETE FROM collection
  WHERE user_id = $1 
  AND book_id = $2
  RETURNING *
  `

  const values = [userId, bookId]

  pool.query(deleteBookQuery, values)
    .then(deletedBookResult => {
      res.redirect(`/collection`)
    })
    .catch(err => console.log('/collection/:id DELETE request err', err));
});

// Collection/:id - GET Request. [Render one of user's books along with it's user cover & user notes].
app.get('/collection/:id', checkAuth, (req, res) => {
  console.log('/collection/:id GET request came in! ---')

  // Redirect user if not logged in.
  if (req.isUserLoggedIn === false) {
    res.status(403).send('sorry');
    return;
  }

  let { userId } = req.cookies;
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
      userscollection.num_pages,
      userscollection.pages_completed,
      STRING_AGG(DISTINCT bookauthors.author_name, ', ') authors_names,
      STRING_AGG(DISTINCT bookgenres.genre_name, ', ') genres_names
    FROM books
    INNER JOIN bookauthors ON books.id = bookauthors.book_id
    INNER JOIN bookgenres ON books.id = bookgenres.book_id
    INNER JOIN userscollection ON books.id = userscollection.book_id
    GROUP BY 1,2,3,4,5,6,7
    HAVING userscollection.book_rank = $1
    `;


  pool.query(singleBookQuery, [id], (singleBookQueryErr, singleBookQueryResult) => {
      if (singleBookQueryErr) {
        console.log('/collection/:id GET request singleBookQueryErr', singleBookQueryErr);
      }
    
    const singleBook = singleBookQueryResult.rows[0];
    console.log('sgb', singleBook);

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

      // Pass in the pages completed perecentage.
      singleBook.pct_complete = Math.round((singleBook.pages_completed / singleBook.num_pages) * 100);

      res.render('collection-id', { singleBook, userNotesArr })
    });
  });
});

// Collection/:id - PUT Request. [Update user cover].
app.put('/collection/:id', multerUpload.single('usercover'), (req, res) => {
  console.log('/collection/:id PUT request came in! ---')

  let collectionBookId = req.params.id;
  let { userId } = req.cookies;

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
      console.log('insertCoverQuery results: ---', insertCoverResults)
    })
   .catch(err => { 
     res.status(503).send('Please try again :(');
     console.log('/collection/:id POST Request query error: ---', err)
   });
});

// Collection/:book_id/pages - PUT Request. [Update page info of a book in user collection].
app.put('/collection/:book_id/:bookrank_id', (req, res) => {

  console.log('/collection/:id/pages PUT request came in! ---')

  const { book_id, bookrank_id } = req.params;
  const { userId } = req.cookies;
  const { pagesCompleted, totalPages } = req.body;

  const updatePagesQuery = `
  UPDATE collection 
  SET 
    num_pages = $1, 
    pages_completed = $2
  WHERE user_id = $3 AND book_id = $4
  RETURNING *
  `
  const values = [totalPages, pagesCompleted, userId, book_id]

  pool
    .query(updatePagesQuery, values)
    .then(pagesResult => {
      console.log('updatePagesQuery result: ---', pagesResult.rows)

      res.redirect(`/collection/${bookrank_id}`); 
    })
    .catch(err => console.log('/collection/:id/pages PUT request error: --', err.stack))

});

// Notes/:book_id/:bookrank_id - POST Request. [Insert new note for user].
app.post('/notes/:book_id/:bookrank_id', (req, res) => {
  console.log('notes/:book_id/:bookrank_id POST request came in!')
  let { userId } = req.cookies;
  
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
    console.log('insertNotesQuery results: ---', result.rows)

    res.redirect(`/collection/${bookrank_id}#my-notes`)
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
      res.redirect(`/collection/${bookrank_id}#my-notes`)
    })
    .catch(err => console.log('notes/:note_id DELETE error: ---', err));
});

// Notes/:note_id/:bookrank_id - PUT Request. [Edit note for user].
app.put('/notes/:note_id/:bookrank_id', (req, res) => {
  console.log('notes/:note_id/:bookrank_id PUT request came in!')

  const { note_id, bookrank_id } = req.params;
  const { editNoteDescription } = req.body;
  const values = [ editNoteDescription, note_id ];

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
      res.redirect(`/collection/${bookrank_id}#my-notes`);
    })
    .catch(err => console.log('editNoteQuery error: ---', err));
});

// Start socket and listen on given port.
app.listen(PORT, (err) => {
  if (err) {
    console.log('Timeout - error listening to port.');
  }
  console.log('Success! Connected to port', PORT);
});