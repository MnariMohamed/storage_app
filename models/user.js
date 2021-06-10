var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");
const bcrypt = require('bcrypt');

var userSchema=new mongoose.Schema({
username:String,
password:String,
capacity: { type: Number, default: 0 },
free_space: { type: Number, default: 0 },
folder_name: String
});

userSchema.plugin(passportLocalMongoose);

userSchema.pre('save', function(next){
    var user = this;

    //check if password is modified, else no need to do anything
    if (!user.isModified('password')) {
       return next()
    }

    user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(8), null);
    next()
})

module.exports=mongoose.model("User", userSchema);
