CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  user_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection (
  id SERIAL PRIMARY KEY,
  user_id INT,
  book_id INT,
  user_cover TEXT,
  num_pages INT,
  pages_completed INT,
  date_added DATE,
  date_completed DATE 
);

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  user_id INT,
  description TEXT,
  book_id INT,
  private BOOLEAN,
  date DATE
);

CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  book_cover TEXT,
  title TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS book_authors (
  id SERIAL PRIMARY KEY,
  book_id INT,
  author_id INT
);

CREATE TABLE IF NOT EXISTS authors (
  id SERIAL PRIMARY KEY,
  author_name TEXT 
);


CREATE TABLE IF NOT EXISTS book_genres (
  id SERIAL PRIMARY KEY,
  book_id INT,
  genre_id INT
);

CREATE TABLE IF NOT EXISTS genres (
  id SERIAL PRIMARY KEY,
  genre_name TEXT
);



