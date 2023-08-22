////////////////////////////////////////////////////////////////////////////////
/* Requires */
////////////////////////////////////////////////////////////////////////////////
const express = require("express"); //Require the express library
const morgan = require("morgan"); //To tell what routes are being pinged, useful for debugging
// const cookieParser = require("cookie-parser");
const { emit } = require("nodemon");
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');
const helpers = require("./helpers");

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
// app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  // keys: ['key1', 'key2'],
  secret: 'so-dry',
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

////////////////////////////////////////////////////////////////////////////////
/* Listener (Initiate Server)*/
////////////////////////////////////////////////////////////////////////////////

//Make the server listen on port 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//Database
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2a$10$Q4m3QVTQxJdVc93k/ayykOqCZiUQ9KWDIshTHlVQag5ISTOWVCJs.",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2a$10$S1d1yBcug6/pvGOuGwsONOBYT9um4vxLXV/Dds35ZGATQdBhp6me6",
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
  const userObj = users[req.session.user_id];
  const templateVars = {
    user: userObj,
    urls: helpers.urlsForUser(req.session.user_id, urlDatabase)
  };
  res.render("urls_index", templateVars);
});

//Route to receive the form submission
app.post("/urls", (req, res) => {
  // console.log(req.body); // Log the POST request body to the console
  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  }
  if (!req.body.longURL) {
    res.redirect("/urls/new");
    return;
  }
  const randomString = helpers.generateRandomString(); //Generate a unique id for shortURL
  const longURL = req.body.longURL;
  const userId = req.session.user_id;
  // save the id and longURL pair to urlDatabase 
  urlDatabase[randomString] = {
    longURL: longURL,
    userID: userId
  };
  console.log("New urlDB:", urlDatabase);
  res.redirect(`/urls/${randomString}`);
});

//Route to render urls_new template
app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  const userObj = users[user_id];
  if (!user_id) {
    res.redirect("/login");
  } else {
    const templateVars = {
      user: userObj
    };
    res.render("urls_new", templateVars);
  }
});

// Route to redirect directly to longURL 
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];//look up the longURL in urlDatabase
  if (!longURL) {
    res.status(404).send("Short URL does not exist");
  } else {
    res.redirect(302, longURL);
  }
});

//Route to display a single URL and its shortened form
app.get("/urls/:id", (req, res) => {
  // Get the shortURL from the route parameter using req.params.id
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL]; // Look up the corresponding longURL from the urlDatabase using the extracted shortURL
  const userObj = users[req.session.user_id];

  // Check to see if a user is logged in or not
  if (!userObj) {
    return res.status(403).send("Please log in first to TinyApp");
  }

  // Check if the URL does not exist
  if (!longURL) {
    return res.status(404).send("Short URL does not exist");
  }

  // Check if the user does not own the URL
  if (longURL.userID !== userObj.id) {
    return res.status(403).send("You don’t have appropriate permission to view this URL. Please contact your administrator!");
  }

  /*Create an object containing the extracted shortURL and the corresponding longURL*/
  const templateVars = { id: shortURL, longURL: longURL, user: userObj };
  res.render("urls_show", templateVars);
});

// Delete route
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  // const userID = req.cookies.userID;
  const userObj = users[req.session.user_id];
  const userID = userObj && userObj.id;
  const urlInfo = urlDatabase[id];

  //check if the ID does not exist
  if (!urlInfo) {
    return res.status(401).send("Short URL not found!");
  } else if (!userID) { //check if user is not logged in
    return res.status(403).send("You must log in or register first!");

  } else if (urlDatabase[id].userID !== userID) { //check if user doesnot own the url
    return res.status(403).send("You don’t have appropriate permission to delete URL. Please contact your administrator!");
  } else {
    delete urlDatabase[id];
    res.redirect("/urls");
  }
});

//Update route
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const userObj = users[req.session.user_id];
  const userID = userObj && userObj.id;

  //check if the URL ID does not exist
  if (!urlDatabase[id]) {
    return res.status(404).send("Short URL does not exist");
  }
  //check if user is not logged in
  if (!userObj) {
    return res.status(403).send("Please log in/register first");
  }

  //check if the user doesnot own the url
  if (urlDatabase[id].userID !== userID) {
    return res.status(403).send("You don’t have appropriate permission to Edit URL. Please contact your administrator!");
  }

  //update URL if user owns the URL
  const newURL = req.body.longURL;
  urlDatabase[id].longURL = newURL;
  res.redirect("/urls");
});

//Display login form
app.get("/login", (req, res) => {
  // console.log(req.cookies);
  const user_id = req.session.user_id;
  if (user_id) {
    return res.redirect("/urls");
  } else {
    const userObj = users[req.session.user_id];
    const templateVars = {
      user: userObj
    };
    res.render("urls_login", templateVars);
  }
});

// Submission of the login form
app.post("/login", (req, res) => {
  console.log("POST login: req.body", req.body);
  const email = req.body.email;
  const password = req.body.password;
  const foundUser = helpers.getUserByEmail(email, users);

  //Check if a user submitted form with username and password
  if (!email || !password) {
    return res.status(403).send("<p>Please Enter unername and/or password</p>");
  } else if (!foundUser) { //Check if there is no user that matches
    return res.status(403).send("<p>User does not exist.</p>");
  } else if (!bcrypt.compareSync(password, foundUser.password)) {
    return res.status(403).send("Your Password do not match. Please try again.");
  } else {
    // res.cookie("user_id", foundUser.id); //Sets cookie
    req.session.user_id = foundUser.id;
    res.redirect("/urls");
  };
});

//POST route for logout
app.post("/logout", (req, res) => {
  // res.clearCookie("user_id");//clears key-value pair
  req.session = null;
  res.redirect("/login");
});

/*** 
 * Registration Page
*/

//Show registration form
app.get("/register", (req, res) => {
  // const templateVars = { username: req.body["username"] };
  const user_id = req.session.user_id;
  if (user_id) {
    res.redirect("/urls");
  } else {
    const userObj = users[req.session.user_id];
    const templateVars = {
      user: userObj,
      urls: urlDatabase
    };
    res.render("urls_register", templateVars);
  }
});

// Handle register form submission
app.post("/register", (req, res) => {
  const userID = helpers.generateRandomString();
  //Get the data from the html body
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(userPassword, salt);

  // Check if username and password is provided
  if (!userEmail || !userPassword) {
    res.status(400).send("Please Enter Email and/or Password!</p>");
  } else if (helpers.getUserByEmail(userEmail, users)) { //check if email already exist or not
    res.status(400).send("Email address is already exists !!!");
  } else {
    // Create new user object
    const newUser = {
      id: userID,
      email: userEmail,
      password: hash
    };
    //Add new user to database variable
    users[userID] = newUser;
    console.log("POST Register users obj", users);
    // res.cookie("user_id", userID);//Set userid cookie
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});