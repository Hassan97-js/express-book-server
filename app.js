// jshint esversion:8

const express = require("express");
const app = express();
const sql = require("mssql");
require("dotenv").config();

// middlewares
// app.use(express.static("./public"));
app.use("/public", express.static("./public"));
app.use(express.urlencoded());

// view engine
app.set("view engine", "pug");
app.locals.pretty = true;

const booksQuery = `
SELECT
  ISBN13,
  Titel,
  CONCAT(f.Förnamn, ' ', f.Efternamn) AS Författare,
  Pris
FROM
  Böcker b
JOIN BöckerFörfattare bf ON b.ISBN13 = bf.BokID
JOIN Författare f ON f.ID = bf.FörfattarID
ORDER BY
        CASE @sortColumn WHEN 'ISBN13' THEN ISBN13 ELSE NULL END,
        CASE @sortColumn WHEN 'FörnamnEfternamn' THEN concat(f.Förnamn, ' ', f.Efternamn) ELSE NULL END,
        CASE @sortColumn WHEN 'Pris' THEN Pris ELSE NULL END,
        Titel
`;
app.get("/", async (req, res) => {
  try {
    const connection = await sql.connect(process.env.CONNECTION);
    const result = await connection
      .request()
      .input("sortColumn", sql.NVarChar, req.query.sortColumn)
      .query(booksQuery);

    let querySort = req.query.sortColumn;
    if (!querySort) querySort = "Titel";
    const lookup = {
      ISBN13: "ISBN13",
      Titel: "Titel",
      FörnamnEfternamn: "Författare",
      Pris: "Pris"
    };
    if (querySort === "Författare") {
      querySort = "FörnamnEfternamn";
    }
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
  CONCAT(f.Förnamn, ' ', f.Efternamn) AS Författare,
  Pris,
  Utgivningsdatum,
  fl.Namn AS Förlag
FROM
  Böcker b
JOIN BöckerFörfattare bf ON b.ISBN13 = bf.BokID
JOIN Författare f ON f.ID = bf.FörfattarID
JOIN Förlag fl ON fl.FörlagsID = b.FörlagsID
WHERE ISBN13 = @bookId;
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
    res.render("book", { book, bookInButics, bookISBN });
  } catch (err) {
    console.error(err);
  }
});

const editBookQuery = `
SELECT
  ISBN13,
  Titel,
  CONCAT(f.Förnamn, ' ', f.Efternamn) AS Författare,
  Pris,
  Utgivningsdatum,
  fl.Namn AS Förlag
FROM
  Böcker b
JOIN BöckerFörfattare bf ON b.ISBN13 = bf.BokID
JOIN Författare f ON f.ID = bf.FörfattarID
JOIN Förlag fl ON fl.FörlagsID = b.FörlagsID
WHERE ISBN13 = @bookId;
`;

const allAuthorsQuery = `
SELECT
	Förnamn,
  Efternamn
FROM Författare;
`;

app.get("/:bookId/edit", async (req, res) => {
  const bookId = req.params.bookId;
  const connection = await sql.connect(process.env.CONNECTION);
  const result = await connection
    .request()
    .input("bookId", sql.NVarChar, bookId)
    .query(editBookQuery);

  const result_authors = await connection.request().query(allAuthorsQuery);

  const books = result.recordset;
  const authors = result_authors.recordset;

  for (const book of books) {
    if (book.Utgivningsdatum) {
      let bookDate = new Date(book.Utgivningsdatum);
      const bookDay = String(bookDate.getDate()).padStart(2, "0");
      const bookMonth = String(bookDate.getMonth()).padStart(2, "0");
      const bookYear = bookDate.getFullYear();
      bookDate = `${bookMonth}/${bookDay}/${bookYear}`;
      book.Utgivningsdatum = bookDate;
    }
  }

  res.render("bookEdit", { books, authors });
});

const updateBookQuery = `
UPDATE Böcker
SET Titel = @updateTitle
WHERE ISBN13 = @ISNB;

--UPDATE Författare
--SET Förnamn = SUBSTRING(@updateName, 0, CHARINDEX(' ', @updateName)), Efternamn = SUBSTRING--(@updateName, CHARINDEX(' ', @updateName), @updateName.length)
--WHERE ISBN13 = @ISNB;
`;

app.post("/:bookId/edit", async (req, res) => {
  const bookId = req.body.ISBN;
  const connection = await sql.connect(process.env.CONNECTION);
  await connection
    .request()
    .input("updateTitle", sql.NVarChar, req.body.titel)
    .input("ISNB", sql.NVarChar, req.body.ISBN)
    // .input("updateName", sql.NVarChar, req.body.författare)
    .query(updateBookQuery);
  console.log(req.body.författare);
  res.redirect(303, `/${bookId}/edit`);
});

app.all("*", (req, res) => {
  res.send("<h1>404: Page not found!</h1>");
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
