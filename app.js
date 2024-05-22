//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const url = require("url");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const cookieParser = require("cookie-parser");


const app = express();
app.use(cookieParser());
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

app.use(
  session({
    secret: " MilesApart : Find your cummute partner ",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

const userSchema = new mongoose.Schema({
  phoneNo: Number,
  name: String,
  username: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String,
});

const driverSchema = new mongoose.Schema({
  from: String,
  to: String,
  time: String,
  date: Date,
  usertype: Boolean,
});

const passengerSchema = new mongoose.Schema({
  from: String,
  to: String,
  time: String,
  date: Date,
  usertype: Boolean,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model("User", userSchema);
const Driver = mongoose.model("Driver", driverSchema);
const Passenger = mongoose.model("Passenger", passengerSchema);

passport.use(User.createStrategy());
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, {
      id: user.id,
      username: user.username,
      phoneNo: user.phoneNo,
      name: user.name,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/map",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/map", function (req, res) {
  res.render("map");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get("/logout", function (req, res) {
  req.logout(function (err) {});
  res.redirect("/");
});

app.get("/myprofile", function (req, res) {
  res.render("myprofile");
});

app.get("/my_rides", function (req, res) {
  res.render("my_rides");
});

app.get("/Get_in_touch", function (req, res) {
  res.render("Get_in_touch");
});

app.get("/faqs", function (req, res) {
  res.render("faqs");
});

app.get("/aboutus", function (req, res) {
  res.render("aboutus");
});

app.get(
  "/auth/google/map",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/map");
  }
);

app.post("/register", function (req, res) {
  User.register(
    {
      username: req.body.username,
      phoneNo: req.body.phoneNo,
      name: req.body.name,
    },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        res.redirect("/login");
      }
    }
  );
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
    name: req.body.name,
    phoneNo: req.body.phoneNo,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local", {
        failureRedirect: "/login",
        failureMessage: true,
      })(req, res, function () {
        if (err) alert("Incorrect password");
        res.redirect("/map");
      });
    }
  });
});

app.get("/driverList",function(req,res){
  const drivers = req.cookies["drivers"];
  res.clearCookie("drivers", { httpOnly: true });
  res.render("driver_list",{driverList:drivers});
})

app.post("/add", function (req, res) {
  const is = req.body.usertypee;
  if (is) {
    const passenger = new Passenger({
      from: req.body.frome,
      to: req.body.toe,
      date: req.body.datee,
      time: req.body.timee,
      usertype: req.body.usertypee,
    });
    passenger.save();
    Driver.find({from:req.body.frome},function(err,drivers){
      if(!err){
        res.cookie("drivers",drivers,{httpOnly:true});
        
      res.redirect("/driverList");}
      else
      res.send(err);
    });
    
  } else {
    const driver = new Driver({
      from: req.body.frome,
      to: req.body.toe,
      date: req.body.datee,
      time: req.body.timee,
      usertype: req.body.usertypee,
    });
    driver.save();
  }
});

app.listen(3000, function () {
  console.log("Server started successfully on port 3000");
});
