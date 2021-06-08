var mongoose=require("mongoose");

var fileSchema=new mongoose.Schema({
name: String,
User: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
Deleted_user: { type: mongoose.Schema.Types.ObjectId, ref: 'Deleted_user' },
date: { type: Date, default: Date.now },
size: Number,
pre_deleted: { type: Boolean, default: false }
});

module.exports=mongoose.model("File", fileSchema);
