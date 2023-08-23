////////////////////////////////////////////////////////////////////////////////
/* Requires */
////////////////////////////////////////////////////////////////////////////////
const express = require("express"); //Require the express library
const morgan = require("morgan"); //To tell what routes are being pinged, useful for debugging
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
app.use(cookieSession({
  name: 'session',
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

//index page
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Route that will return the urlDatabase object as a JSON response
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Route handler for /urls
app.get("/urls", (req, res) => {
  const userObj = users[req.session.user_id];
  const templateVars = {
    user: userObj,
    urls: helpers.urlsForUser(req.session.user_id, urlDatabase)
  };
  // use res.render to load up an ejs view file
  res.render("urls_index", templateVars);
});

//Route to receive the form submission
app.post("/urls", (req, res) => {
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

// Route to redirect to longURL
app.get("/u/:id", (req, res) => {
  //Check if the shortURL exisits in the urlDatabase
  if (urlDatabase[req.params.id]) {
    const longURL = urlDatabase[req.params.id].longURL;//look up the longURL in urlDatabase
    //Check if the longURL not found
    if (longURL === undefined) {
      res.status(302);//the resource requested has been found but there is no longURL
    } else {
      res.redirect(longURL); //redirect to the corresponding longURL
    }
  } else {
    //Show error msg if the shortURL does not exist
    res.status(400).send("Short URL does not exist");
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
  // Extract the URL id from the route parameter
  const id = req.params.id;
  // Get the user object from the session using the user_id stored in the session
  const userObj = users[req.session.user_id];
  // Extract the user's ID from the user object, if it exists
  const userID = userObj && userObj.id;
  // Retrieve the URL with the specified ID from the urlDatabase
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
  // Extract the URL id from the route parameter
  const id = req.params.id;
  // Get the user object from the session using the user_id stored in the session
  const userObj = users[req.session.user_id];
  // Extract the user's ID from the user object, if it exists
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
  //Get user_id from the session
  const user_id = req.session.user_id;
  if (user_id) {
    return res.redirect("/urls"); //redirect to /urls if the user is already logged in
  } else { // If not logged in, extract the user object from the users database using the session's user_id
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
  const email = req.body.email; // Get email from the html body
  const password = req.body.password; //Get the password from the html body
  //Get the user object associated with the provided email
  const foundUser = helpers.getUserByEmail(email, users);

  //Check if a user submitted form with username and password
  if (!email || !password) {
    return res.status(403).send("<p>Please Enter unername and/or password</p>");
  } else if (!foundUser) { //Check if the user exists
    return res.status(403).send("<p>User does not exist.</p>");
    //Check if an entered password matches
  } else if (!bcrypt.compareSync(password, foundUser.password)) {
    return res.status(403).send("Your Password do not match. Please try again.");
  } else {
    //Set user_id key if email and password are valid
    req.session.user_id = foundUser.id;
    res.redirect("/urls"); //After successful log in, redirect the user to the URLS page
  };
});

//POST route for logout
app.post("/logout", (req, res) => {
  req.session = null; // Clear the session
  res.redirect("/login");
});

/*** 
 * Registration Page
*/

//Show registration form
app.get("/register", (req, res) => {
  //Get user_id from the session
  const user_id = req.session.user_id;
  if (user_id) { //if user already logged in, redirect to /urls
    res.redirect("/urls");
  } else {
    const userObj = users[req.session.user_id]; //Get the corresponding user object
    const templateVars = {
      user: userObj,
      urls: urlDatabase
    };
    res.render("urls_register", templateVars);
  }
});

// Handle register form submission
app.post("/register", (req, res) => {
  //create a unique ID
  const userID = helpers.generateRandomString();
  //Get email data from the html body
  const userEmail = req.body.email;
  //Get password from the html body
  const userPassword = req.body.password;
  //generate a salt
  const salt = bcrypt.genSaltSync(10);
  //Hash the entered user password
  const hash = bcrypt.hashSync(userPassword, salt);

  // Check if email and password are provided
  if (!userEmail || !userPassword) {
    res.status(400).send("Please Enter Email and/or Password!</p>");
  } else if (helpers.getUserByEmail(userEmail, users)) { //check if email already exist or not
    res.status(400).send("Email address is already exists !!!");
  } else {
    // Create a new user object with the generated user ID, email, and hashed password
    const newUser = {
      id: userID,
      email: userEmail,
      password: hash
    };
    //Add new user to user database
    users[userID] = newUser;
    console.log("POST Register users obj", users);
    req.session.user_id = userID; // Set the user_id key on a sesssion with UserID
    res.redirect("/urls");
  }
});