var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");
const bcrypt = require('bcrypt');

var userSchema=new mongoose.Schema({
username:String,
password:String,
encrypted_pass: String,
decryption_key: String,
capacity: { type: Number, default: 0 },
free_space: { type: Number, default: 0 },
folder_name: String
});

userSchema.plugin(passportLocalMongoose);


module.exports=mongoose.model("User", userSchema);
