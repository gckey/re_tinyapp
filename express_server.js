////////////////////////////////////////////////////////////////////////////////
/* Requires */
////////////////////////////////////////////////////////////////////////////////
const express = require("express"); //Require the express library
const morgan = require("morgan"); //To tell what routes are being pinged, useful for debugging
const cookieParser = require("cookie-parser");
const { emit } = require("nodemon");

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
app.use(morgan("dev"));
app.use(cookieParser());

////////////////////////////////////////////////////////////////////////////////
/* Listener (Initiate Server)*/
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

// Lookup a user by email address
const getUserByEmail = (userEmail) => {
  for (const userID in users) {
    const user = users[userID];
    if (user.email === userEmail) {
      return user;
    }
  }
  return null;
};

//Database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
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
  // const templateVars = { urls: urlDatabase };
  const userObj = users[req.cookies.user_id];
  const templateVars = {
    user: userObj,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

//Route to receive the form submission
app.post("/urls", (req, res) => {
  // console.log(req.body); // Log the POST request body to the console
  const randomString = generateRandomString(); //Generate a unique id for shortURL
  // save the id and longURL pair to urlDatabase 
  urlDatabase[randomString] = req.body.longURL;
  // console.log("New urlDB:", urlDatabase);
  res.redirect(`/urls/${randomString}`);
  // res.send("Ok"); // Respond with 'Ok' (we will replace this)
});

//Route to render urls_new template
app.get("/urls/new", (req, res) => {
  const userObj = users[req.cookies.user_id];
  const templateVars = {
    user: userObj
  };
  res.render("urls_new", templateVars);
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
  const userObj = users[req.cookies.user_id];
  /*Create an object containing the extracted shortURL and the corresponding longURL*/
  const templateVars = { id: shortURL, longURL: longURL, user: userObj };
  res.render("urls_show", templateVars);
});

// Delete route
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

//Update route
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newURL = req.body.longURL;
  urlDatabase[id] = newURL;
  res.redirect("/urls");
});

//Route to handle login
app.post("/login", (req, res) => {
  // console.log("POST login: req.body", req.body);
  const username = req.body.username;
  res.cookie("username", username); //Sets cookie username to value
  res.redirect("/urls");
});

//POST route for logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");//clears key-value pair
  res.redirect("/urls");
});

/*** 
 * Registration Page
*/

//Show registration form
app.get("/register", (req, res) => {
  // const templateVars = { username: req.body["username"] };
  const userObj = users[req.cookies.user_id];
  const templateVars = {
    user: userObj,
    urls: urlDatabase
  };
  res.render("urls_register", templateVars);
});

// Handle register form submission
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  //Get the data from the html body
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  //Check if email or password are empty
  if (!userEmail || !userPassword) {
    res.status(400).end("<p>Please Enter Email and/or Password!</p>");
  } else if (getUserByEmail(userEmail)) { //check if email already exist or not
    res.status(400).send("<p>Email address is already exists !!!</p>");
  } else {
    // Create new user object
    const newUser = {
      id: userID,
      email: userEmail,
      password: userPassword
    };
    //Add new user to database variable
    users[userID] = newUser;
    console.log("POST Register users obj", users);
    res.cookie("user_id", userID);//Set userid cookie
    res.redirect("/urls");
  }
});