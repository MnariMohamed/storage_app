var express = require("express");
var router = express.Router({ mergeParams: true });
var File = require("../models/file");
var User = require("../models/user");
var Deleted_user = require("../models/deleted_user");
var rimraf = require("rimraf");
var config = require("../config");
var fs = require('fs');


router.get("/usage", function (req, res) {
    if (req.user.username != "admin")
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
    File.find({ name: { $regex: ".*" + req.params.keyword + ".*" } }).populate('User').populate('Deleted_user').exec(function (err, files) {
        if (err) return res.json({ message: "failed", location: "finding files by search" });
        else {
            return res.json({ message: "success", files });
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
            File.findOne({ Deleted_user: d_user }, function (err, l_file) {
                File.deleteMany({ Deleted_user: d_user }, function (err) {
                    if (err) return res.json({ message: "fail", location: "deleting files db" });
                    else {

                        if (l_file) {
                            var LF_path = l_file.path.substr(0, l_file.path.lastIndexOf("/"));
                            console.log("p: " + LF_path);
                            rimraf(LF_path, function () {
                                Deleted_user.deleteOne({ username }, function (err) {
                                    if (err) return res.json({ message: "fail", location: "deleting user db" });
                                    else {
                                        return update_admin(req, res);
                                    }
                                });
                            });
                        }
                        else {
                            Deleted_user.deleteOne({ username }, function (err) {
                                if (err) return res.json({ message: "fail", location: "deleting user db" });
                                else {
                                    return update_admin(req, res);
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
    var files_ids = [];
    files_ids = req.body.files_ids;
    //turn it to multiple later
    File.findOne({ _id: { $in: files_ids } }, function (err, file) {
        if (err) return res.json({ message: "fail", location: "finding file" });
        User.findOne({ _id: file.User }, function (err, user) {
            if (err) return res.json({ message: "fail", location: "finding user" });
            // if (user.free_space < file.size) return res.json({ message: "fail", desc: "user space full" });
            File.updateMany({ _id: { $in: files_ids } }, { pre_deleted: false }, function (err, files) {
                if (err) return res.json({ message: "fail", location: "updating files status" });
                else {
                    console.log("success 'as always ;)'");
                    return res.json({ message: "success" });
                }
            });

        });
    });

})


//**** functions **********/
function update_admin(req, res) {
    User.findOne({ username: "admin" }, function (err, admin) {
        if (err) { console.log(err); return res.json({ message: "failed", location: "finding admin" }); }
        File.find({ pre_deleted: true }, function (err, pred_files) {
            var pred_files_size_t = 0;
            pred_files.forEach(function (pred_file) {
                pred_files_size_t += pred_file.size;
            });
            admin.free_space = admin.capacity - pred_files_size_t;
            admin.save(function () {
                res.json({ message: "success" });
            });
        });
    });
}
module.exports = router;