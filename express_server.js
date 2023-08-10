const express = require("express"); //Require the express library

////////////////////////////////////////////////////////////////////////////////
/* Configuration */
////////////////////////////////////////////////////////////////////////////////
const PORT = 8080; // default port 8080
const app = express(); // Call our app as an instance of express

// set the view engine to ejs
app.set("view engine", "ejs");

////////////////////////////////////////////////////////////////////////////////
/* Middlewares */
////////////////////////////////////////////////////////////////////////////////

app.use(express.urlencoded({ extended: true })); //for parsing the body of POST requests

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

////////////////////////////////////////////////////////////////////////////////
/* Routes */
////////////////////////////////////////////////////////////////////////////////

//index page, Route that responds with "Hello!" for requests to the root path(/)
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  // res.send("<html><body>Hello <b>World</b></body></html>\n");
  const templateVars = { greeting: "Hello World!" };
  res.render("hello_world", templateVars);
});

// Route that will return the urlDatabase object as a JSON response
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// use res.render to load up an ejs view file
// Route handler for /urls
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//Route to display the form
app.get("/urls/new", (req,res) => {
  res.render("urls_new");
});

//Route to display a single URL and its shortened form
app.get("/urls/:id", (req, res) => {
  // Get the shortURL from the route parameter using req.params.id
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL]; // Look up the corresponding longURL from the urlDatabase using the extracted shortURL
  const templateVars = { id: shortURL, longURL: longURL }; /*Create an object containing the extracted shortURL and the corresponding longURL*/
  res.render("urls_show", templateVars);
});

////////////////////////////////////////////////////////////////////////////////
/* Listner */
////////////////////////////////////////////////////////////////////////////////

//Make the server listen on port 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});