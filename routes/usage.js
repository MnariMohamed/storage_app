var express = require("express");
var router = express.Router({ mergeParams: true });
var File = require("../models/file");
var User = require("../models/user");
var Deleted_user = require("../models/deleted_user");
var rimraf = require("rimraf");
var config = require("../config");
var fs = require('fs');


router.get("/usage", function (req, res) {
    var files = [];
    User.find({}, async function (err, users) {
        Deleted_user.find({}, async function (err, d_users) {
            if (err) return res.json({ message: "fail" });
            else {
                //cleaning up unexisted files
                await users.forEach(t_user => {
                    if (fs.existsSync(config.folder_path + t_user.folder_name + "/"))
                        files = fs.readdirSync(config.folder_path + t_user.folder_name + "/");
                    File.deleteMany({ name: { $nin: files }, User: t_user }, function (err) {
                        if (err) { console.log(err); res.json({ message: "fail", location: "delete file from db" }); }
                    });
                });

                await d_users.forEach(t_d_user => {
                    if (fs.existsSync(config.folder_path + t_d_user.folder_name + "/"))
                        files = fs.readdirSync(config.folder_path + t_d_user.folder_name + "/");
                    File.deleteMany({ name: { $nin: files }, User: t_d_user }, function (err) {
                        if (err) { console.log(err); res.json({ message: "fail", location: "delete file from db" }); }
                    });
                });

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
                                    console.log(pre_d_files);
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


router.delete("/delete_folder", function (req, res) {
    var username = req.body.username;
    var folder_name = req.body.folder_name;
    Deleted_user.findOne({ username }, function (err, d_user) {
        if (err) return res.json({ message: "fail", location: "finding user" });
        else {
            File.deleteMany({ Deleted_user: d_user }, function (err) {
                if (err) return res.json({ message: "fail", location: "deleting files db" });
                else {

                    rimraf(config.folder_path + d_user.folder_name, function () {
                        Deleted_user.deleteOne({ username }, function (err) {
                            if (err) return res.json({ message: "fail", location: "deleting user db" });
                            else {
                                console.log("success 'as always ;)'");
                                return res.json({ message: "success" });
                            }
                        });
                    });

                }
            });
        }
    });
});

module.exports = router;