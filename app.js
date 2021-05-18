// jshint esversion:8

const express = require("express");
const app = express();
const sql = require("mssql");
require("dotenv").config();

// middlewares
app.use("/public", express.static("./public"));
app.use(express.urlencoded({ extended: true }));

// view engine
app.set("view engine", "pug");
app.locals.pretty = true;

const booksQuery = `
SELECT
  ISBN13,
  Titel,
  STRING_AGG(CONCAT(f.Förnamn, ' ', f.Efternamn), ', ') AS Författare,
  Pris
FROM
  Böcker b
JOIN BöckerFörfattare bf ON b.ISBN13 = bf.BokID
JOIN Författare f ON f.ID = bf.FörfattarID
GROUP BY ISBN13, Titel, Pris
ORDER BY
        CASE @sortColumn WHEN 'ISBN13' THEN ISBN13 ELSE NULL END,
        CASE @sortColumn WHEN 'FörnamnEfternamn' THEN STRING_AGG(CONCAT(f.Förnamn, ' ', f.Efternamn), ', ') ELSE NULL END,
        CASE @sortColumn WHEN 'Pris' THEN Pris ELSE NULL END,
        Titel
`;
app.get("/", async (req, res) => {
  try {
    let querySort = req.query.sortColumn;
    if (!querySort) {
      querySort = "Titel";
    }

    if (querySort === "Författare") {
      querySort = "FörnamnEfternamn";
    }

    const connection = await sql.connect(process.env.CONNECTION);
    const result = await connection
      .request()
      .input("sortColumn", sql.NVarChar, querySort)
      .query(booksQuery);

    const lookup = {
      ISBN13: "ISBN13",
      Titel: "Titel",
      FörnamnEfternamn: "Författare",
      Pris: "Pris"
    };

    const books = result.recordset;

    for (const book of books) {
      if (book.Pris) book.Pris = book.Pris + " kr";
    }

    if (querySort) {
      res.render("books", { books, querySort, lookup });
    } else {
      res.render("books", { books });
    }
  } catch (err) {
    console.error(err.message);
  }
});

const bookQuery = `
SELECT
  ISBN13,
  Titel,
  STRING_AGG(CONCAT(f.Förnamn, ' ', f.Efternamn), ', ') AS Författare,
  Pris,
  Utgivningsdatum,
  fl.Namn AS Förlag
FROM
  Böcker b
JOIN BöckerFörfattare bf ON b.ISBN13 = bf.BokID
JOIN Författare f ON f.ID = bf.FörfattarID
JOIN Förlag fl ON fl.FörlagsID = b.FörlagsID
WHERE ISBN13 = @bookId
GROUP BY ISBN13, Titel, Pris, Utgivningsdatum, fl.Namn;
`;

const bookButicsQuery = `
SELECT
  ISBN13,
  Titel,
  Butiksnamn,
  Antal
FROM
  Böcker b
JOIN LagerSaldo lgs ON lgs.ISBN = b.ISBN13
JOIN Butiker bt ON bt.ID = lgs.ButiksID
WHERE ISBN13 = @bookId;
`;

app.get("/book/:bookId", async (req, res) => {
  try {
    const connection = await sql.connect(process.env.CONNECTION);
    const result = await connection
      .request()
      .input("bookId", sql.NVarChar, req.params.bookId)
      .query(bookQuery);
    const buticsResult = await connection
      .request()
      .input("bookId", sql.NVarChar, req.params.bookId)
      .query(bookButicsQuery);
    const book = result.recordset[0];
    const bookInButics = buticsResult.recordset;
    const bookISBN = book.ISBN13;
    for (const bookInButic of bookInButics) {
      if (bookInButic.Antal === 0) bookInButic.Antal = "Ej i lager";
    }
    for (const bookItem in book) {
      if (bookItem === "Utgivningsdatum") {
        let bookDate = new Date(book[bookItem]);
        const bookDay = String(bookDate.getDate()).padStart(2, "0");
        const bookMonth = String(bookDate.getMonth() + 1).padStart(2, "0");
        const bookYear = bookDate.getFullYear();
        bookDate = `${bookYear}-${bookMonth}-${bookDay}`;
        book[bookItem] = bookDate;
      }
    }
    res.render("book", { book, bookInButics, bookISBN });
  } catch (err) {
    console.error(err.message);
  }
});

const editBookQuery = `
SELECT
  ISBN13,
  Titel,
 STRING_AGG(CONCAT(f.Förnamn, ' ', f.Efternamn), ', ') AS Forfattare,
  Pris,
  Utgivningsdatum,
  fl.Namn AS Förlag
FROM
  Böcker b
JOIN BöckerFörfattare bf ON b.ISBN13 = bf.BokID
JOIN Författare f ON f.ID = bf.FörfattarID
JOIN Förlag fl ON fl.FörlagsID = b.FörlagsID
WHERE ISBN13 = @bookId
GROUP BY ISBN13, Titel, Pris, Utgivningsdatum, fl.Namn
`;

const authorsQuery = `
SELECT
  Förnamn,
  Efternamn,
  ID
FROM Författare;
`;

let errMessage = "";

app.get("/:bookId/edit", async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const connection = await sql.connect(process.env.CONNECTION);
    const result = await connection
      .request()
      .input("bookId", sql.NVarChar, bookId)
      .query(editBookQuery);

    const result_authors = await connection.request().query(authorsQuery);

    const books = result.recordset;

    books[0].Forfattare = books[0].Forfattare.split(", ");
    console.log(books[0]);

    console.log(books[0].Forfattare);

    for (const book of books) {
      if (book.Utgivningsdatum) {
        let bookDate = new Date(book.Utgivningsdatum);
        const bookDay = String(bookDate.getDate()).padStart(2, "0");
        const bookMonth = String(bookDate.getMonth() + 1).padStart(2, "0");
        const bookYear = bookDate.getFullYear();
        bookDate = `${bookYear}-${bookMonth}-${bookDay}`;
        book.Utgivningsdatum = bookDate;
      }
    }

    const authors = result_authors.recordset;

    res.render("bookEdit", { books, authors, errMessage });
    errMessage = "";
  } catch (err) {
    console.error(err.message);
  }
});

const updateBookQuery = `
UPDATE Böcker
SET Titel = @updateTitle
WHERE ISBN13 = @ISBN;

UPDATE Böcker
SET Utgivningsdatum = @updateUtgivningsdatum
WHERE ISBN13 = @ISBN;

UPDATE Böcker
SET Pris = @updatePris
WHERE ISBN13 = @ISBN;

UPDATE Böcker
SET FörlagsID = @publishId
WHERE ISBN13 = @ISBN;
`;

const getAuthorId = `
SELECT
	ID
FROM
	Författare
WHERE Förnamn = @firstName AND Efternamn= @lastName;
`;

const getPublisherId = `
SELECT
    FörlagsID
FROM
	Förlag
WHERE Namn = @publishName
`;

const deleteIsbn = `
DELETE FROM BöckerFörfattare
WHERE BokID = @bokId
`;

const insertNewAuthor = `
INSERT INTO BöckerFörfattare (BokID, FörfattarID)
VALUES (@bokId, @författarID)
`;

app.post("/:bookId/edit", async (req, res) => {
  try {
    const bookId = req.body.ISBN;
    // Författare
    let bookAuthors = req.body.författare;
    console.log(bookAuthors);

    const connection = await sql.connect(process.env.CONNECTION);

    // delete the selected book
    await connection
      .request()
      .input("bokId", sql.NVarChar, bookId)
      .query(deleteIsbn);

    if (Array.isArray(bookAuthors)) {
      for (const name of bookAuthors) {
        const firstName = name.match(/([\w+]+)/g)[0];
        const lastName = name.match(/([\w+]+)/g)[1];

        const result_authorId = await connection
          .request()
          .input("firstName", sql.NVarChar, firstName)
          .input("lastName", sql.NVarChar, lastName)
          .query(getAuthorId);
        const authorId = result_authorId.recordset[0].ID;

        const result_insert = await connection
          .request()
          .input("bokId", sql.NVarChar, bookId)
          .input("författarID", sql.Int, authorId)
          .query(insertNewAuthor);
        console.log(result_insert);
      }
    } else {
      const firstName = bookAuthors.match(/([\w+]+)/g)[0];
      const lastName = bookAuthors.match(/([\w+]+)/g)[1];
      console.log(firstName, lastName);

      const result_authorId = await connection
        .request()
        .input("firstName", sql.NVarChar, firstName)
        .input("lastName", sql.NVarChar, lastName)
        .query(getAuthorId);

      const authorId = result_authorId.recordset[0].ID;

      console.log(authorId);

      const result_insert = await connection
        .request()
        .input("bokId", sql.NVarChar, bookId)
        .input("författarID", sql.Int, authorId)
        .query(insertNewAuthor);
      console.log(result_insert);
    }

    // förlag
    const result_publisherId = await connection
      .request()
      .input("publishName", sql.NVarChar, req.body.förlag)
      .query(getPublisherId);
    const publisherId = result_publisherId.recordset[0].FörlagsID;

    // update queries
    await connection
      .request()
      .input("updateTitle", sql.NVarChar, req.body.titel)
      .input("ISBN", sql.NVarChar, req.body.ISBN)
      .input("publishId", sql.Int, publisherId)
      .input("updatePris", sql.Int, req.body.pris)
      .input("updateUtgivningsdatum", sql.DateTime2, req.body.utgivningsdatum)
      .query(updateBookQuery);

    res.redirect(303, `/book/${bookId}`);
  } catch (err) {
    console.error(err.message);
  }
});

app.all("*", (req, res) => {
  res.send("<h1>404: Page not found!</h1>");
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
