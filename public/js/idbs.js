let db;

const request = indexedDB.open("budget_table", 1);

request.onupgradeneeded = function(event) {
  // save reference to database
  const db = event.target.result;
  // create an object store for budget table and set auto incrementing primary key
  db.createObjectStore("budget_transaction", { autoIncrement: true });
};

request.onsuccess = function(event) {
  // when db is successfully created with object store, save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run function to send all local db data to api
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  // log error here
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(["budget_transaction"], "readwrite");

  const budgetObjectStore = transaction.objectStore("budget_transaction");

  // add record to your store with add method
  budgetObjectStore.add(record);
}

function checkDatabase() {
  // open a transaction on your pending db
  const transaction = db.transaction(["budget_transaction"], "readwrite");

  // access your pending object store
  const budgetObjectStore = transaction.objectStore("budget_transaction");

  // get all records from store and set to a variable
  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, let's send it to the api server
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

          const transaction = db.transaction(["budget_transaction"], "readwrite");
          const budgetObjectStore = transaction.objectStore("budget_transaction");
          // clear all items in your store
          budgetObjectStore.clear();

          alert('Saved transactions have been updated!');
        })
        .catch((err) => {
          // set reference to redirect back here
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);
