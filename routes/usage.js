var express = require("express");
var router = express.Router({ mergeParams: true });
var File = require("../models/file");
var User = require("../models/user");
var Deleted_user = require("../models/deleted_user");
var rimraf = require("rimraf");
var config = require("../config");
var fs = require('fs');


router.get("/usage", function (req, res) {
    if(req.user.username!="admin")
    return res.redirect("/login");

    var files = [];
    User.find({}, async function (err, users) {
        Deleted_user.find({}, async function (err, d_users) {
            if (err) return res.json({ message: "fail" });
            else {

                File.find({ User: { $in: users }, pre_deleted: false }).populate('User').exec(function (err, all_files) {
                    if (err) return res.json({ message: "fail" });
                    var client_files = [];
                    all_files.forEach(t_file => {
                        if (t_file.User) {
                            if (t_file.User.username != "admin") {
                                client_files.push(t_file);
                            }
                        }
                    });

                    File.find({ Deleted_user: { $in: d_users }, pre_deleted: false }).populate('Deleted_user').exec(function (err, d_user_files) {
                        if (err) return res.json({ message: "fail" });
                        else {

                            File.find({ $or: [{ Deleted_user: { $in: d_users } }, { User: { $in: users } }], pre_deleted: true }).populate('User').populate('Deleted_user').exec(function (err, pre_d_files) {
                                if (err) return res.json({ message: "fail" });
                                else {
                                    res.render("usage", { client_files, users, d_user_files, d_users, pre_d_files });
                                }
                            });

                        }
                    });
                });


            }
        });

    });

});

//get files by search
router.get("/search/:keyword", function (req, res) {
    File.find({name:{$regex : ".*"+req.params.keyword+".*"}}).populate('User').populate('Deleted_user').exec( function (err, files) {
        if(err) return res.json({message: "failed", location:"finding files by search"});
        else{
return res.json({message:"success",files});
        }
    })
});

//delete whole user and files
router.delete("/delete_folder", function (req, res) {
    var username = req.body.username;
    var folder_name = req.body.folder_name;
    Deleted_user.findOne({ username }, function (err, d_user) {
        if (err) return res.json({ message: "fail", location: "finding user" });
        else {
            //this part might change depending if the user will have multiple paths
            File.findOne({Deleted_user: d_user}, function (err, l_file) {
            File.deleteMany({ Deleted_user: d_user }, function (err) {
                if (err) return res.json({ message: "fail", location: "deleting files db" });
                else {

                    if(l_file){
                            var LF_path=l_file.path.substr(0, l_file.path.lastIndexOf("/"));
                            console.log("p: "+LF_path);
                            rimraf(LF_path, function () {
                                Deleted_user.deleteOne({ username }, function (err) {
                                    if (err) return res.json({ message: "fail", location: "deleting user db" });
                                    else {
                                        console.log("success 'as always ;)'");
                                        return res.json({ message: "success" });
                                    }
                                });
                            });
                        }
                        else{
                            Deleted_user.deleteOne({ username }, function (err) {
                                if (err) return res.json({ message: "fail", location: "deleting user db" });
                                else {
                                    console.log("success 'as always ;)'");
                                    return res.json({ message: "success" });
                                }
                            }); 
                        }

                }
            });
        });

        }
    });
});

router.put("/restore/file", function (req, res) {
    var files_ids=[];
    files_ids = req.body.files_ids;
    File.updateMany({_id: { $in: files_ids }},{pre_deleted: false}, function (err, files) {
        if (err) return res.json({ message: "fail", location: "updating files status" });
        else {
            console.log("success 'as always ;)'");
            return res.json({ message: "success" });
        }
        });
})
module.exports = router;