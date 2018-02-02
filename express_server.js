var cookieSession = require('cookie-session');
var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const bcrypt = require('bcrypt');

app.use(cookieSession({
  name: 'session',
  keys: ['secret keys'],

  // Cookie Options for sessions
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

function generateRandomString() {
  var length = 6;
  var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var RandomString = '';
  for (var i = length; i > 0; --i) { RandomString += chars[Math.floor(Math.random() * chars.length)]; }
  return RandomString;
}

var urlDatabase = {
  "b2xVn2": { Long_URL: "http://www.lighthouselabs.ca",
    USERid: "userRandomID"
  },
  "9sm5xK": { Long_URL: "http://www.google.com",
    USERid: 'sen373'
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "1"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "2"
  }
};

// "/" redirection depending on whether logged in 
app.get("/", (req, res) => {
  var userID = req.session.user_id;
  if (userID) {
    //user is logged in
    res.redirect("/urls");
  } else {
    //user is not logged in
    res.redirect("/login");
  }
});

//URLS Homepage - post of new URL
app.post("/urls", (req, res) => {
  var userID = req.session.user_id;
  var longURL = req.body.longURL;
  var shortURL = generateRandomString();
  let newData = {
    Long_URL: longURL,
    USERid: userID
  };
  urlDatabase[shortURL] = newData;
  res.redirect("/urls");
});

//URLS Homepage
app.get("/urls", (req, res) => {
  var userID = req.session.user_id;
  var user = users[userID];
  let templateVars = {
    urls: urlDatabase,
    user: user
  }; 
  res.render("urls_index", templateVars);
});

//Redirects from shortURL to longURL
app.get("/u/:id", (req, res) => {
  var shortURL = req.params.id;
  if (req.params.id in urlDatabase) {
    const longURL = urlDatabase[req.params.id].Long_URL;
    res.redirect(longURL);
} else {
  res.redirect("/urls");
  // res.status(404).send("The longUrl for the shortUrl does not exist.");
}
});

function urlsForUser(id) {
  var urlsForSpecificUser = [];
  var shortURL = id;
  var urlOwner = urlDatabase[shortURL].USERid;
  for (shortURL in urlDatabase) {
    if (shortURL === urlOwner) {
      urlsForSpecificUser = push(shortURL);
    } else { return; }
  }
  return urlsForSpecificUser;
}

//Link for user to add a new URL for shortening as long as user is logged in 
app.get("/urls/new", (req, res) => {
  var userID = req.session.user_id;
  if (userID){
    var user = users[userID];
    templateVars = {
      urls: urlDatabase,
      user: user
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

//Editing long URLs
app.post('/urls/:id', (req, res) => {
  var shortURL = req.params.id;
  let userID = req.session.user_id;
  var urlOwner = urlDatabase[shortURL].USERid;
  if (userID === urlOwner) {
    let newData = {
      Long_URL: req.body.longURL,
      USERid: userID
    };
    urlDatabase[shortURL] = newData;
    res.redirect('/urls');
  } else {
    res.status(400).send("<html>Error: Not allowed to edit other user's links right now</html>");
  }
});

//Editing URLs
app.get("/urls/:id", (req, res) => {     
  var shortURL = req.params.id;
  var userID = req.session.user_id;
  var user = users[userID];
  var urlOwner = urlDatabase[shortURL].USERid;
  //Checks to make sure the user owns the link to be able to edit it
  if (userID === urlOwner) {
    let templateVars = {
      shortURL: shortURL,
      Long_URL: '',
      longURL: urlDatabase[shortURL].Long_URL,
      user: user
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(400).send("<html>Error: Not allowed to edit other user's links unfortunately</html>");
  }
});

//For deleting the user's urls
app.post("/urls/:id/delete", (req, res) => {
  var shortURL = req.params.id;
  var userID = req.session.user_id;
  let newData = {
    longURL: urlDatabase[shortURL].Long_URL,
    USERid: userID
  };
  var urlOwner = urlDatabase[shortURL].USERid;
    //Checks to make sure the user owns the link to be able to delete it
  if (userID === urlOwner) {
    urlDatabase[shortURL] = newData;
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.status(400).send("<html>Error: Not allowed to delete other user's links</html>");
  }
});

//for logging in, renders loggin page (ejs file)
app.get("/login", (req, res) => {
  var userID = req.session.user_id;
  var user = users[userID];
  var shortURL = req.params.id;
  res.render("login");
});

app.post("/login", (req, res) => {
  //Checks if either email or password are empty/undefined
  if (!req.body.email || !req.body.password) {
    res.status(403);
    res.send("email/password combination fail");
  } else if (req.body.email) {
    //Loops through userdatabase to see if user email is in database
    for (var id in users) {
      //Checks if email corresponds and password is correct with bcrypt
      if (users[id].email === req.body.email && bcrypt.compareSync(req.body.password, users[id].password)) {
        req.session.user_id = id;
        res.redirect("/urls");
        return;
      }
    }
    //Gives a vague error message if email/password combination fails
    res.status(400);
    res.send("Error: incorrect login");
  } else {
    res.status(403);
    res.send("Error: incorrect login");
  }
});

//Registration
app.get("/register", (req, res) => {
  var userID = req.session.user_id;
  var user = users[userID];
  var shortURL = req.params.id;
  let templateVars = {
    urls: urlDatabase,
    user: user
  };
  res.render("register", templateVars);
});

//When user enters registration information, does some error checking, registers new user
app.post("/register", (req, res) => {
  let userID = generateRandomString();
  //Checks if either email or password has been left blank
  if(!req.body.email || !req.body.password) {
    res.status(400);
    res.send("email or password is empty");
    return;
  }
  //Loops through database to see if user already exists
  for (var id in users) {
    //If someone tries to register with an existing user's email generates a vague error message
    if (users[id].email == req.body.email) {
      res.status(400);
      res.send("error occured");
      return;
    }
  }
  const password = req.body.password; 
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[userID] = {id: userID, email: req.body.email, password: hashedPassword};
  req.session.user_id = userID;
  res.redirect("/urls");
});

//logs out and clears session
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

//Connects to our default port specified at beginning of script
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});