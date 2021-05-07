// jshint esversion:6

// getting the form and all form's elements nodes
const form = document.querySelector("form");
const bookTitle = document.querySelector("#titel");
const bookAuthor = document.querySelector("#författare");
const bookPris = document.querySelector("#pris");
const bookDate = document.querySelector("#utgivningsdatum");
const bookPublisher = document.querySelector("#förlag");

// regex variables
const bookDatePattern = /^\d{4}\-\d{1,2}\-\d{1,2}$/;

// function to validate the form before sending it to the server
function validateForm() {
  if (bookPris.value && isNaN(bookPris.value)) {
    alert("Priset måste vara ett nummer");
    return false;
  } else if (bookPris.value && bookPris.value <= 0) {
    alert("Priset får inte vara noll eller mindre än noll");
    return false;
  } else if (bookDate.value && !bookDatePattern.test(bookDate.value)) {
    alert("Datumet måste matcha mönstret yyyy-mm-dd");
    return false;
  }
  return true;
}

form.onsubmit = validateForm;
