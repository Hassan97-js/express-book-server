// jshint esversion:6

// getting the form all div:s
const bookTitleDiv = document.querySelector(".form-titel");
const bookAuthorDiv = document.querySelector(".form-forfattare");
const bookPrisDiv = document.querySelector(".form-pris");
const bookDateDiv = document.querySelector(".form-utgivningsdatum");
const bookPublisherDiv = document.querySelector(".form-forlag");

// getting the form and all form's elements nodes
const form = document.querySelector("form");
const bookTitle = document.querySelector("#titel");
const bookAuthor = document.querySelector("#författare");
const bookPris = document.querySelector("#pris");
const bookDate = document.querySelector("#utgivningsdatum");
const bookPublisher = document.querySelector("#förlag");

// variables
let isEmpty = true;
const bookDatePattern = /^\d{4}\-\d{1,2}\-\d{1,2}$/;

console.log(bookDatePattern.test(bookDate.value));

function validateForm() {
  if (
    !bookTitle.value ||
    !bookAuthor.value ||
    !bookPris.value ||
    !bookDate.value ||
    !bookPublisher.value
  ) {
    if (!bookTitle.value) {
      alert("Titel får inte vara tom");
    } else if (!bookAuthor.value) {
      alert("Du måste välja en författare");
    } else if (!bookPris.value) {
      alert("Priset får inte vara tom");
    } else if (!bookDate.value) {
      alert("Datum får inte vara ");
    } /* else if (bookDatePattern.test(bookDate.value) === false) {
      alert("Datumet måste matcha mönstret yyyy-mm-dd");
      console.log(bookDatePattern.test(bookDate.value));
    } */ else if (
      !bookPublisher.value
    ) {
      alert("Förlag får inte vara tom");
    }
    return false;
  }
}

form.onsubmit = validateForm;
