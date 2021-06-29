var User = require("../models/user");
var File = require("../models/file");

module.exports = {
    //update user spaces, reuires user_id in req
//suggestion: check files real existence here
    update_user_space: function(req, res, respond=false, view, data={}, resJson=false) {
        return new Promise(resolve => {
        User.findOne({ _id: req.body.user_id }, function (err, user) {
            if (err) { console.log(err); return res.json({ message: "failed", location: "finding user" }); }
            if (!user) { console.log("user not found"); return false; }
            File.find({ User: user, pre_deleted: false }, function (err, files) {
                if (err || !files) { console.log(err); return false; }
                console.log(files);
                var files_size_t = 0;
                files.forEach(function (file, f_idx, f_arr) {
                    files_size_t += file.size;
                });
                user.free_space = user.capacity - files_size_t;
                user.save(function () {
                    User.findOne({ username: "admin" }, function (err, admin) {
                        if (err) { console.log(err); return res.json({ message: "failed", location: "finding admin" }); }
                        File.find({ pre_deleted: true }, function (err, pred_files) {
                            var pred_files_size_t = 0;
                            pred_files.forEach(function (pred_file) {
                                pred_files_size_t += pred_file.size;
                            });
                            admin.free_space = admin.capacity - pred_files_size_t;
                            admin.save(function () {
                                if(respond==true){
                                    data["Buser"]=user;
                                    return res.render(view, data)
                                }
                                else if(resJson==true){
                                        return res.json({message:"success" ,data})
                                }
                                else
                                 resolve(user);
                            });
                        });
                    });
                });
            });
        });
    });
    }
};