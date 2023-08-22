// Lookup a user by email address
const getUserByEmail = (email, database) => {
  for (const userID in database) {
    // const user = users[userID];
    if (database[userID].email === email) {
      return database[userID];
    }
  }
  return null;
};

const generateRandomString = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }
  return randomString;
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

module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser
};