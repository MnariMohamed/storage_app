var express=require("express"),
 app=express(),
 bodyParser=require("body-parser");
 var  passport=require("passport"),
 localStrategy=require("passport-local"),
passportLocalMongoose=require("passport-local-mongoose");
var mongoose = require('mongoose');
var User=require("./models/user");
var config=require("./config");

/****** mongoose config */
mongoose.connect('mongodb://localhost/storage', { useNewUrlParser: true ,useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
console.log("database connected");
});



app.use(express.static("public"));

 //read json
 app.use(express.json({
  type: ['application/json', 'text/plain']
}))
app.use(bodyParser.urlencoded({extended: false}));
app.set("view engine","ejs");

//session
app.use(require("express-session")({
secret: "secret",
resave: false,
saveUninitialized: false
}));
/***passport config */
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({extended:true}));
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
  res.locals.currentUser=req.user;
  next();
});


/*********** ROUTES */
var useRoutes=require("./routes/user");
var storageRoutes=require("./routes/storage");
var usageRoutes=require("./routes/usage");

app.use(useRoutes);
app.use(isLoggedIn ,storageRoutes);
app.use(isLoggedIn ,usageRoutes);



function isLoggedIn(req, res, next) {
    if(req.isAuthenticated())
    return next();
    else {
      res.redirect("/login");
    }
  }


 var port=process.env.PORT || 3020;
 app.listen(port, process.env.IP || config.ip, function () {
    console.log("started at: "+port); 
  });