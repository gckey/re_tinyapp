const express = require("express"); //Require the express library
const app = express(); // Call our app as an instance of express
const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
// Route that responds with "Hello!" for requests to the root path(/)
app.get("/", (req, res) => {  
  res.send("Hello!");
});

// Route that will return the urlDatabase object as a JSON response
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Make the server listen on port 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});