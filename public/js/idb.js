
// variable to hold db connection
let db;

// connect to IndexedDB database called 'budget_tracker' set to version 1
const request = indexedDB.open("budget_tracker", 1);

// emits when the database version changes
request.onupgradeneeded = function (event) {
   // save a reference to the database
    db = event.target.result;
   // create an object store (table) called `new_budget`, set it to have an auto incrementing primary key
   db.createObjectStore("new_budget", { autoIncrement: true });
};

// on success
request.onsuccess = function (event) {
   // save reference to db in global variable
   db = event.target.result;

   if (navigator.onLine) {
       uploadTransaction();
   }
};

// on error
request.onerror = function (event) {
   console.log(event.target.errorCode);
};

// setup end
// =================================================================

// function to run when no internet connection
function saveRecord(record) {
   // open a new transaction with read and write permissions
   const transaction = db.transaction(["new_budget"], "readwrite");

   // access the object store
   const budgetObjectStore = transaction.objectStore("new_budget");

   // add record
   budgetObjectStore.add(record);
}

// function to run when reconnected to the internet
function uploadTransaction() {
   // open db transaction, access object store, get all records
   const transaction = db.transaction(["new_budget"], "readwrite");

   // access your object store
   const budgetObjectStore = transaction.objectStore("new_budget");

   // get all records from store
   const getAll = budgetObjectStore.getAll();

   // process data on successful .getAll()
   getAll.onsuccess = function () {
      // if there was data in indexedDb's store, send it to the api server
      if (getAll.result.length > 0) {
         fetch("/api/transaction", {
            method: "POST",
            body: JSON.stringify(getAll.result),
            headers: {
               Accept: "application/json, text/plain, */*",
               "Content-Type": "application/json",
            },
         })
            .then((response) => response.json())
            .then((serverResponse) => {
               if (serverResponse.message) {
                  throw new Error(serverResponse);
               }
               // open transaction, access object store, clear all items
               const transaction = db.transaction(["new_budget"], "readwrite");
               const budgetObjectStore = transaction.objectStore("new_budget");
               budgetObjectStore.clear();

               // send notification
               alert("You are back online. All data has been uploaded!");
            })
            .catch((err) => {
               console.log(err);
            });
      }
   };
}

// listen for app coming back online to automatically run function
window.addEventListener("online", uploadTransaction);
