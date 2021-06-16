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
    if(!file){return res.redirect("/storage", 404);}
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

                                        console.log(req.user.free_space, fileC.size);
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
    User.findOne({_id:req.body.user_id}, function (err, user) {
        if(err){console.log(err); return res.json({message:"failed", location:"finding user"}); }
        File.find({User: user, pre_deleted: false}, function (err, files) {
    if(err || !files){console.log(err); return res.json({message:"failed"});}
    console.log(files);
    var files_size_t=0;
    files.forEach(function (file) {
        files_size_t+=file.size;
    });
    user.free_space=user.capacity-files_size_t;
    user.save(function () {
        User.findOne({username:"admin"}, function (err, admin) {
            if(err){console.log(err); return res.json({message:"failed", location:"finding admin"}); }
            File.find({pre_deleted: true}, function (err, pred_files) {
                var pred_files_size_t=0;
                pred_files.forEach(function (pred_file) {
                    pred_files_size_t+=pred_file.size;
                });
                admin.free_space=admin.capacity-pred_files_size_t;
                admin.save(function () {
                    res.json({ message: "success" });
                });
                            });
        });    
    });
});
    });
    
});


//delete files
router.delete("/delete_files", function (req, res) {
    //don't use multiple ids because the code not ready to do so
    var files_ids=[];
    files_ids=req.body.files_ids;
    var path;
    var file_name;
    var username = req.body.username_d;
    var deleted = req.body.deleted_u;
    File.find({_id: { $in: files_ids }}, function (err, files) {

        files.forEach(function (file) {
                    if(err){console.log(err); res.json({message:"failed", location:"find file to download"}); }
    else{
        path=file.path;
        file_name=file.name;

    // Read file stats
    fs.stat(path, (err, stats) => {
        if (err) {
            console.log(`File doesn't exist.`);
            File.deleteOne(file,function(err){
                res.json({ message: "success" });
            });
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
                                if (err) throw err;
                                else {
                                    //delete file from db
                                    File.deleteMany({ User: user, name: file_name }, function (err) {
                                        if (err) { console.log(err); res.json({ message: "fail", location: "deleting file from db" }); }
                                        else {
                                            File.find({User: user, pre_deleted:false}, function (err, a_files) {
                                            var freespace = user.capacity;
                                            for (var i = 0; i < a_files.length; i++) {
                                                freespace -= a_files[i].size;
                                            }
                                            user.free_space = freespace;
                                            console.log(freespace);
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

    }
        });

});



});

router.post("/predelete", function (req, res) {
    var files_ids=[];
    files_ids = req.body.files_ids;
    var user_id=req.body.user_id;
    var total_files_size=0;

    File.find({ User: user_id, _id: { $in: files_ids } }, function (err, the_files) {
        if(err){ console.log(err); return res.json({message:"failed", location:"finding files"});}
        User.findOne({username: "admin"}, function (err, admin) {
            if(err){ console.log(err); return res.json({message:"failed", location:"finding admin"});}
            var total_files_size=0;
            for (var i = 0; i < the_files.length; i++) {
                total_files_size+=the_files[i].size;
            }
            if(admin.free_space<total_files_size)
            return res.json({message:"failed", keyword:"space", desc:"not enough space for admin storage, only "+admin.free_space+" left"});
            else
            admin.free_space-=total_files_size;
            admin.save(function () {
                File.updateMany({ User: user_id, _id: { $in: files_ids } }, { pre_deleted: true }, function (err, files) {
                    if (err) { console.log(err); res.json({ message: "fail", location: "updating file to mark as delete" }); }
                    else {
                            User.findOne({_id: user_id}, function(err, user) {
                                user.free_space+=total_files_size;
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


function update_admin(req,res) {
    User.findOne({username:"admin"}, function (err, admin) {
        if(err){console.log(err); return res.json({message:"failed", location:"finding admin"}); }
        File.find({pre_deleted: true}, function (err, pred_files) {
            var pred_files_size_t=0;
            pred_files.forEach(function (pred_file) {
                pred_files_size_t+=pred_file.size;
            });
            admin.free_space=admin.capacity-pred_files_size_t;
            admin.save(function () {
                res.json({ message: "success" });
            });
                        });
    });  
}
module.exports = router;