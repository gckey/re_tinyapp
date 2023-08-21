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

// Return URLS for currently logged in user
const urlsForUser = (id, urlDatabase) => {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

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
    urls: urlsForUser(req.cookies.user_id, urlDatabase)
  };
  res.render("urls_index", templateVars);
});

//Route to receive the form submission
app.post("/urls", (req, res) => {
  // console.log(req.body); // Log the POST request body to the console
  if (!req.cookies.user_id) {
    res.redirect("/login");
    return;
  }
  if (!req.body.longURL) {
    res.redirect("/urls/new");
    return;
  }
  const randomString = generateRandomString(); //Generate a unique id for shortURL
  const longURL = req.body.longURL;
  const userId = req.cookies.user_id;
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
  const user_id = req.cookies.user_id;
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
  const userObj = users[req.cookies.user_id];

  // Check to see if a user is logged in or not
  if (!userObj) {
    return res.status(403).send("Please log in first");
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
  const userObj = users[req.cookies.user_id];
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
  const userObj = users[req.cookies.user_id];
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

//Show login form
app.get("/login", (req, res) => {
  // console.log(req.cookies);
  const user_id = req.cookies.user_id;
  if (user_id) {
    return res.redirect("/urls");
  } else {
    const userObj = users[req.cookies.user_id];
    const templateVars = {
      user: userObj
    };
    res.render("urls_login", templateVars);
  }
});

//Route to handle login
app.post("/login", (req, res) => {
  console.log("POST login: req.body", req.body);
  const email = req.body.email;
  const password = req.body.password;
  const foundUser = getUserByEmail(email);

  //Check if a user submitted form with username and password
  if (!email || !password) {
    return res.status(403).send("<p>Please Enter unername and/or password</p>");
  } else if (!foundUser) { //Check if there is no user that matches
    return res.status(403).send("<p>User does not exist.</p>");
  } else if (foundUser.password !== password) {
    return res.status(403).send("Incorrect Password!");
  } else {
    res.cookie("user_id", foundUser.id); //Sets cookie
    res.redirect("/urls");
  };
});

//POST route for logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");//clears key-value pair
  res.redirect("/login");
});

/*** 
 * Registration Page
*/

//Show registration form
app.get("/register", (req, res) => {
  // const templateVars = { username: req.body["username"] };
  const user_id = req.cookies.user_id;
  if (user_id) {
    res.redirect("/urls");
  } else {
    const userObj = users[req.cookies.user_id];
    const templateVars = {
      user: userObj,
      urls: urlDatabase
    };
    res.render("urls_register", templateVars);
  }
});

// Handle register form submission
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  //Get the data from the html body
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  // Check if username and password is provided
  if (!userEmail || !userPassword) {
    res.status(400).send("Please Enter Email and/or Password!</p>");
  } else if (getUserByEmail(userEmail)) { //check if email already exist or not
    res.status(400).send("Email address is already exists !!!");
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