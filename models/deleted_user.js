var mongoose=require("mongoose");

var deleted_userSchema=new mongoose.Schema({
username:{type : String , unique : true},
password:String,
capacity: { type: Number, default: 0 },
free_space: { type: Number, default: 0 },
folder_name: String
});


module.exports=mongoose.model("Deleted_user", deleted_userSchema);
