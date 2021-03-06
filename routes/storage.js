var express = require("express");
var router = express.Router({ mergeParams: true });
var File = require("../models/file");
var fs = require('fs');
const fileUpload = require('express-fileupload');
var User = require("../models/user");
var Deleted_user = require("../models/deleted_user");
let config = require('/cfg/storage_config.json');
var myFunctions=require("../shared_data/functions");

let update_user_space=myFunctions.update_user_space;

router.use(fileUpload({
    useTempFiles: true,
    createParentPath: true,
    tempFileDir : '/tmp/'
}));



//get files by user and name in directory, send them to client
router.get("/storage", function (req, res) {
    if(req.user.username=="admin") return res.redirect("/usage");
    //suggestion: to assure files are same in db and disk a solution is to run a test to filter
req.body.user_id=req.user._id;
    File.find({ User: req.user, pre_deleted: false }).sort({ date: 'desc' }).exec(async function (err, Cfiles) {
        let data = { the_files: Cfiles };
        var view="storage";
        update_user_space(req, res, true, view, data);
    });
});

//download file
router.get("/download_file/:file_id", function (req, res) {
    var file_id = req.params.file_id;
    File.findOne({ _id: file_id }, function (err, file) {
        if (err) { console.log(err); res.json({ message: "failed", location: "find file to download" }); }
        else {
            if (!file) { return res.redirect("/storage", 404); }
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
            console.log("ongoing");
            let uploadedFile = req.files.uploadedFile;
            var name_B_D = uploadedFile.name.substring(0, uploadedFile.name.indexOf("."));
            var name_A_D = uploadedFile.name.substring(uploadedFile.name.indexOf(".") + 1);
            var size_G = uploadedFile.size / Math.pow(1000, 3);
            req.body.user_id=req.user._id;
const result=await update_user_space(req, res);
if(result.free_space<size_G)
return res.json({ message: "failed", desc: "space run out" });
            File.countDocuments({}, function (err, count) {
                var modified_name = name_B_D + "_" + count + "_." + name_A_D;
                var n_file = { name: uploadedFile.name, User: req.user, size: size_G, path: config.folder_path + req.user.folder_name + "/" + uploadedFile.name };
                if (fs.existsSync(config.folder_path + req.user.folder_name + "/" + uploadedFile.name)) {
                    console.log("The file exists.");
                    return res.json({ message: "failed", desc: "file exists", file_name: uploadedFile.name, err });
                } else {
                    uploadedFile.mv(config.folder_path + req.user.folder_name + "/" + uploadedFile.name, function (err) {
                        if (err) { console.log(err); }

                        else {
                            File.create(n_file, function (err, fileC) {

                                if (err) { console.log(err); res.json({ message: "failed" }) }
                                else {

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

//update current user freespace
router.post("/update/user_space", function (req, res) {
    update_user_space(req, res, false, null, null, true);
});


//delete files
router.delete("/delete_files", function (req, res) {
    //don't use multiple ids because the code not ready to do so
    var files_ids = [];
    files_ids = req.body.files_ids;
    var path;
    var file_name;
    var username = req.body.username_d;
    var deleted = req.body.deleted_u;
    File.find({ _id: { $in: files_ids } }, function (err, files) {
        if (err) { console.log(err); return res.json({ message: "failed", location: "find files" }); }

        files.forEach(function (file) {

            path = file.path;
            file_name = file.name;

            // Read file stats
            fs.stat(path, (err, stats) => {
                if (err) {
                    console.log(`File doesn't exist.`);
                    File.deleteOne(file, function (err) {
                        console.log("file deleted not found"); res.json({ message: "success" });
                    });
                } else {
                    if (deleted) {
                        fs.unlink(path, function (err) {
                            if (err) throw err;
                            else {
                                console.log("here");
                                Deleted_user.findOne({ username }, function (err, d_user) {
                                    if (err) { console.log(err); res.json({ message: "fail", location: "finding user in deleting file" }); }
                                    else {
                                        File.deleteMany({ Deleted_user: d_user, name: file_name }, function (err) {
                                            if (err) { console.log(err); res.json({ message: "fail", location: "deleting file from db" }); }
                                            else {
                                                update_admin(req, res);
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
                                //delete_from direct
                                fs.unlink(path, function (err) {
                                    if (err) {
                                        console.log(err);
                                        return res.json({ message: "fail" });
                                    }
                                    else {
                                        //delete file from db
                                        File.deleteMany({ User: user, name: file_name }, function (err, files) {
                                            if (err) { console.log(err); res.json({ message: "fail", location: "deleting file from db" }); }
                                            else {
                                                File.find({ User: user, pre_deleted: false }, function (err, a_files) {
                                                    var freespace = user.capacity;
                                                    for (var i = 0; i < a_files.length; i++) {
                                                        freespace -= a_files[i].size;
                                                    }
                                                    user.free_space = freespace;
                                                    user.save(function () {
                                                        update_admin(req, res);
                                                    });
                                                });
                                            }
                                        });
                                    }
                                });

                            }
                        });
                    }

                }
            });


        });

    });



});

router.post("/predelete", function (req, res) {
    var files_ids = [];
    files_ids = req.body.files_ids;
    var user_id = req.body.user_id;
    var total_files_size = 0;

    File.find({ User: user_id, _id: { $in: files_ids }, pre_deleted: false }, function (err, the_files) {
        if (err) { console.log(err); return res.json({ message: "failed", location: "finding files" }); }
        if(!the_files){ console.log("no files"); return res.json({message:"neutral"});}
        User.findOne({ username: "admin" }, function (err, admin) {
            if (err) { console.log(err); return res.json({ message: "failed", location: "finding admin" }); }
            var total_files_size = 0;
            for (var i = 0; i < the_files.length; i++) {
                total_files_size += the_files[i].size;
            }
            if (admin.free_space < total_files_size)
                return res.json({ message: "failed", keyword: "space", desc: "not enough space for admin storage, only " + admin.free_space + " left" });
            else
                admin.free_space -= total_files_size;
            admin.save(function () {
                File.updateMany({ User: user_id, _id: { $in: files_ids } }, { pre_deleted: true }, function (err, files) {
                    if (err) { console.log(err); res.json({ message: "fail", location: "updating file to mark as delete" }); }
                    else {
                        User.findOne({ _id: user_id }, function (err, user) {
                            user.free_space += total_files_size;
                            user.save(function () {
                                console.log(total_files_size);
                                res.json({ message: "success", files });
                            });
                        })

                    }
                });
            })


        });
    });

});

router.get("/file_exitence/:name/:user_id", function (req, res) {
    File.findOne({ name: req.params.name, User: req.params.user_id }, function (err, file) {
        if (err || !file) { console.log(err); return res.json({ message: "failed", location: "finding file" }); }
        else {
            if (file) {
                return res.json({ message: "success", desc: "name exists", file_name: file.name });
            }
            else {
                return res.json({ message: "failed", location: "file doesn't exist" });
            }
        }
    })
});



/********* useful functions */
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