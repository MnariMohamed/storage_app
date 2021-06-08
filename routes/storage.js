var express = require("express");
var router = express.Router({ mergeParams: true });
var File = require("../models/file");
var fs = require('fs');
const fileUpload = require('express-fileupload');
var User = require("../models/user");
var Deleted_user = require("../models/deleted_user");
var config = require("../config");

router.use(fileUpload({
    useTempFiles: true,
    createParentPath: true
}));



//get files by user and name in directory, send them to client
router.get("/storage", function (req, res) {
    var files = [];
    if (fs.existsSync(config.folder_path + req.user.folder_name + "/"))
        files = fs.readdirSync(config.folder_path + req.user.folder_name + "/");

    File.find({ name: { $in: files }, User: req.user, pre_deleted: false}).sort({ date: 'desc' }).exec(function (err, Cfiles) {
        var freespace = req.user.capacity;
        for (var i = 0; i < Cfiles.length; i++) {
            freespace -= Cfiles[i].size;
        }
        req.user.free_space = freespace;
        req.user.save();


        res.render("storage", { the_files: Cfiles, prepath:config.folder_path });

    });
});

//download file
router.get("/download_file/:folder_name/:file_name", function (req, res) {
    var folder_name=req.params.folder_name;
    var file_name=req.params.file_name;
    console.log(config.folder_path+folder_name+"/"+file_name);
    res.download(config.folder_path+folder_name+"/"+file_name);
});


//upload file
router.post('/upload', async (req, res) => {
    try {

        console.log(req.files.uploadedFile.name);
        if (!req.files) {
            res.send({
                status: false,
                message: 'Error: No file uploaded'
            });
        } else {

            File.countDocuments({}, function (err, count) {
                let uploadedFile = req.files.uploadedFile;
                var name_B_D = uploadedFile.name.substring(0, uploadedFile.name.indexOf("."));
                var name_A_D = uploadedFile.name.substring(uploadedFile.name.indexOf(".") + 1);
                var size_G = uploadedFile.size / Math.pow(1000, 3);
                var modified_name = name_B_D + "_" + count + "_." + name_A_D;
                var n_file = { name: modified_name, User: req.user, size: size_G };
                if (fs.existsSync(config.folder_path + req.user.folder_name + "/" + modified_name)) {
                    console.log("The file exists.");
                    res.json({ message: "failed", desc: "file exists", err });
                } else {
                    uploadedFile.mv(config.folder_path + req.user.folder_name + "/" + modified_name, function (err) {
                        if (err) {
                            console.log(err);
                        }

                        else {
                            File.create(n_file, function (err, fileC) {

                                if (err) { console.log(err); res.json({ message: "failed", err }) }
                                else {

                                    var files = fs.readdirSync(config.folder_path + req.user.folder_name + "/");
                                    File.find({ name: { $in: files }, User: req.user }, function (err, Cfiles) {
                                        var freespace = req.user.capacity;
                                        for (var i = 0; i < Cfiles.length; i++) {
                                            freespace -= Cfiles[i].size;
                                        }
                                        req.user.free_space = freespace;
                                        req.user.save();
                                    });

                                    res.json({
                                        message: 'success',
                                        data: {
                                            name: uploadedFile.name,
                                            mimetype: uploadedFile.mimetype,
                                            size: uploadedFile.size
                                        }
                                    });

                                }

                            });
                        }

                    });
                }

            });

        }
    } catch (err) {
        res.json({ Error: "Error while uploading file." });
        console.log(err);
    }
});


//delete file
router.delete("/delete_file", function (req, res) {
    var path = req.body.path;
    var file_name = path.split("/")[1];
    var username = req.body.username_d;
    var deleted = req.body.deleted_u;
    console.log(file_name);
    // Read file stats
    fs.stat(config.folder_path + path, (err, stats) => {
        if (err) {
            console.log(`File doesn't exist.`);
        } else {

            if (deleted) {
                fs.unlink(config.folder_path + path, function (err) {
                    if (err) throw err;
                    else {
                        Deleted_user.findOne({ username }, function (err, d_user) {
                            if (err) { console.log(err); res.json({ message: "fail", location: "finding user in deleting file" }); }
                            else {
                                File.deleteMany({ Deleted_user: d_user, name: file_name }, function (err) {
                                    if (err) { console.log(err); res.json({ message: "fail", location: "deleting file from db" }); }
                                    else {
                                        res.json({ message: "success" });
                                    }
                                });
                            }
                        });
                    }
                });
            }
            else {

                User.findOne({ username }, function (err, user) {
                    if (err) { console.log(err); res.json({ message: "fail", location: "finding user in deleting file" }); }
                    else {
                        user.free_space = user.free_space + (stats.size / Math.pow(1000, 3));
                        user.save(function () {
                            //delete_from direct
                            fs.unlink(config.folder_path + path, function (err) {
                                if (err) throw err;
                                else {
                                    //delete file from db
                                    File.deleteMany({ User: user, name: file_name }, function (err) {
                                        if (err) { console.log(err); res.json({ message: "fail", location: "deleting file from db" }); }
                                        else {
                                            res.json({ message: "success" });
                                        }
                                    });
                                }
                            });
                        });

                    }
                });
            }

        }
    });


});

router.post("/predelete", function (req, res) {
    var path = req.body.path;
    var file_name = path.split("/")[1];
    File.updateOne({ User: req.user, name: file_name }, { pre_deleted: true }, function (err, file) {
        if (err) { console.log(err); res.json({ message: "fail", location: "finding file to mark as delete" }); }
        else {
            console.log(file);
            //if needed to increase free space, it will be increased if the file is confirmed
    /*        fs.stat(config.folder_path + path, (err, stats) => {
            req.user.free_space = req.user.free_space + (stats.size / Math.pow(1000, 3));
            req.user.save();
        });*/

            res.json({ message: "success", file });
        }
    });
});

module.exports = router;