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
//suggestion: to assure files are same in db and disk a solution is to run a test to filter

    File.find({User: req.user, pre_deleted: false }).sort({ date: 'desc' }).exec(function (err, Cfiles) {

        res.render("storage", { the_files: Cfiles });

    });
});

//download file
router.get("/download_file/:file_id", function (req, res) {
    var file_id = req.params.file_id;
File.findOne({_id: file_id}, function (err, file) {
    if(err){console.log(err); res.json({message:"failed", location:"find file to download"}); }
else{
    console.log(file.path);
    res.download(file.path);
}
});

});


//upload file
router.post('/upload', async (req, res) => {
    try {
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
                var n_file = { name: modified_name, User: req.user, size: size_G, path: config.folder_path + req.user.folder_name + "/" + modified_name };
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

                                    req.user.free_space = req.user.free_space - fileC.size;
                                    req.user.save(function () {
                                        console.log(req.user, fileC.size);
                                        res.json({
                                            message: 'success',
                                            data: {
                                                name: uploadedFile.name,
                                                mimetype: uploadedFile.mimetype,
                                                size: uploadedFile.size
                                            }
                                        });
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
    var file_id=req.body.file_id;
    var path;
    var file_name;
    var username = req.body.username_d;
    var deleted = req.body.deleted_u;
    File.findOne({_id: file_id}, function (err, file) {
        if(err){console.log(err); res.json({message:"failed", location:"find file to download"}); }
    else{
        path=file.path;
        file_name=file.name;

    // Read file stats
    fs.stat(path, (err, stats) => {
        if (err) {
            console.log(`File doesn't exist.`);
        } else {

            if (deleted) {
                fs.unlink(path, function (err) {
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
                        user.save(function () {
                            //delete_from direct
                            fs.unlink(path, function (err) {
                                if (err) throw err;
                                else {
                                    //delete file from db
                                    File.deleteMany({ User: user, name: file_name }, function (err) {
                                        if (err) { console.log(err); res.json({ message: "fail", location: "deleting file from db" }); }
                                        else {
                                            File.find({User: user}, function (err, a_files) {
                                            var freespace = user.capacity;
                                            for (var i = 0; i < a_files.length; i++) {
                                                freespace -= a_files[i].size;
                                            }
                                            user.free_space = freespace;
                                            console.log(freespace);
                                            user.save();
                                            res.json({ message: "success" });
                                        });
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

    }
});



});

router.post("/predelete", function (req, res) {
    var files_ids=[];
    files_ids = req.body.files_ids;
    File.updateMany({ User: req.user, _id: { $in: files_ids } }, { pre_deleted: true }, function (err, files) {
        if (err) { console.log(err); res.json({ message: "fail", location: "finding file to mark as delete" }); }
        else {
            console.log(files);
            res.json({ message: "success", files });
        }
    });
});

module.exports = router;