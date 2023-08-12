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

////////////////////////////////////////////////////////////////////////////////
/* Listner */
////////////////////////////////////////////////////////////////////////////////

//Make the server listen on port 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const generateRandomString = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }
  return randomString;
};

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

//Route to receive the form submission
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const randomString = generateRandomString(); //Generate a unique id for shortURL
  // save the id and longURL pair to urlDatabase 
  urlDatabase[randomString] = req.body.longURL;
  console.log("New urlDB:", urlDatabase);
  res.redirect(`/urls/${randomString}`);
  // res.send("Ok"); // Respond with 'Ok' (we will replace this)
});

//Route to render urls_new template
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// Route to redirect directly to longURL 
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];//look up the longURL in urlDatabase
  res.redirect(longURL);
});

//Route to display a single URL and its shortened form
app.get("/urls/:id", (req, res) => {
  // Get the shortURL from the route parameter using req.params.id
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL]; // Look up the corresponding longURL from the urlDatabase using the extracted shortURL
  const templateVars = { id: shortURL, longURL: longURL }; /*Create an object containing the extracted shortURL and the corresponding longURL*/
  res.render("urls_show", templateVars);
});