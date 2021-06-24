/******* Don't call this file until you are 100% sure, this will erase everything */

var express = require("express"),
    app = express(),
    bodyParser = require("body-parser");
var mongoose = require('mongoose');
var fetch = require("node-fetch");
var rimraf = require("rimraf");
var config = require("./config");

/****** mongoose config */
mongoose.connect('mongodb://localhost/storage', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("database connected");
    reset_all();
});


function reset_all() {
    mongoose.connection.db.dropDatabase(function (err, result) {
        if (err) return console.log("database wasn't dropped");
        rimraf(config.folder_path, function () {console.log("everything is reset 0");});
    });
}

