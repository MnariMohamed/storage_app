var express = require("express");
var router = express.Router({ mergeParams: true });
var User = require("../models/user");
var Deleted_user = require("../models/deleted_user");
var passport = require("passport");
var moment = require("moment");
var fetch = require("node-fetch");
var disk = require('diskusage');
var File = require("../models/file");
var rimraf = require("rimraf");
let config = require('/cfg/storage_config.json');
const Cryptr = require('cryptr');
//delete user
router.delete('/user', isLoggedIn, function (req, res) {
  var deleteFile = req.body.deleteFiles;
  User.findOne({ username: req.body.username }, function (err, the_user) {

    if (err || the_user == null) { console.log(err); return res.json({ message: "failed", err }); }
    else {

      if (deleteFile) {
        //this part might change depending if the user will have multiple paths
        File.findOne({ User: the_user }, function (err, l_file) {
          if(err || !l_file){console.log(err); return res.json({message:"fail", desc:"error or file not found"});}
          if (l_file) {
            var LF_path = l_file.path.substr(0, l_file.path.lastIndexOf("/"));
            //removing folder, another alternative is to use config path for first param
            rimraf(LF_path, function () {
              File.deleteMany({ User: the_user }, function (err) {
                if (err) { console.log(err); res.json({ message: "fail", location: "delete files" }); }
                else {

                  User.deleteOne({ username: req.body.username }, function (err, user) {
                    if (err) { console.log(err); return res.json({ message: "failed", err }); }
                    else
                      return update_admin(req, res);
                  });

                }
              });
            });
          }
          else {
            User.deleteOne({ username: req.body.username }, function (err, user) {
              if (err) { console.log(err); return res.json({ message: "failed", err }); }
              else
                return update_admin(req, res);
            });
          }
        });
      }
      else {
        var new_del_user = { username: the_user.username, folder_name: the_user.folder_name };
        Deleted_user.create(new_del_user, function (err, del_user) {
          if (err) { console.log(err); return res.json({ message: "failed", err }); }
          else {

            File.find({ User: the_user }, function (err, DU_files) {
              if (err) { console.log(err); return res.json({ message: "fail", err, location: 'finding files of deleted user' }); }
              else {
                DU_files.forEach(t_file => {
                  t_file.User = null;
                  t_file.Deleted_user = del_user;
                  t_file.save();
                });
                User.deleteOne({ username: req.body.username }, function (err, user) {
                  if (err) { console.log(err); return res.json({ message: "failed", err }); }
                  else
                    return update_admin(req, res);
                });
              }
            });

          }
        });
      }

    }

  });

});



/***** update routes */

//update user
router.put("/update/user", async function (req, res) {
  var username = req.body.username;
  var capacity = req.body.capacity;
  var n_username = req.body.n_username;

  disk.check(config.folder_path, async function (err, info) {
    var free_disk_sp_G = info.free;
    console.log(free_disk_sp_G);
    User.find({}, async function (err, users) {
      if (err) { console.log(err); res.json({ message: "fail" }) }
      else {
        var temp_used = 0;
        var original_free_disk = 0;
        var used_users_storage = 0;
        var allowed_storage = 0;
        var total_users_storage = 0;
        await users.forEach(t_user => {
          temp_used = t_user.capacity - t_user.free_space;
          used_users_storage += temp_used;
          total_users_storage += t_user.capacity;
        });
        total_users_storage = total_users_storage * Math.pow(1000, 3);
        console.log(used_users_storage, total_users_storage);
        original_free_disk = free_disk_sp_G - used_users_storage;
        allowed_storage = original_free_disk - total_users_storage;
        allowed_storage = allowed_storage / Math.pow(1000, 3);

        User.findOne({ username }, function (err, userC) {
          if (err) { console.log(err); res.json({ message: "failed", location: "update capacity" }); }
          else {
            var difference = capacity - userC.capacity;
            var usedSpace = userC.capacity - userC.free_space;
            if (allowed_storage < difference || usedSpace > capacity) return res.json({ message: "failed", description: "space not enough or used" });

            userC.capacity = capacity;
            userC.free_space = userC.free_space + difference;
            userC.username = n_username;
            if (req.body.new_pass) {
              userC.setPassword(req.body.new_pass, function () {
                userC.save(function () {
                  console.log(userC);
                  res.json({ message: "success", user: userC });
                });
              });
            }
            else {
              userC.save(function () {
                console.log(userC);
                res.json({ message: "success", user: userC });
              });
            }
          }
        });

      }
    });
  });

});

//get update page
router.get("/user_info", isLoggedIn, function (req, res) {
  res.render("user/user_info");
});

//update password
router.post("/update_info", isLoggedIn, function (req, res) {
  var new_pass = req.body.new_pass;

  passport.authenticate('local', function (err, user, info) {
    if (err) { console.log(err); return res.json({ message: "failed", location: "authenticating" }); }
    else if (!user) { console.log("not exist"); return res.json({ message: "failed", location: "user existence" }); }
    // req / res held in closure
    else {
      req.logIn(user, function (err) {
        if (err) { console.log(err); return res.json({ message: "failed", location: "authenticating" }); }
        else {

          req.user.setPassword(new_pass, function () {
            req.user.save(function name(err) {
              if (err) { console.log(err); res.json({ message: "failed", location: "update password" }); }
              else {
                req.logout();
                res.json({ message: "success" });
              }
            });
          });

        }
      });
    }
  })(req, res);

});

router.get("/edit_profile/:user_id", isLoggedIn, function (req, res) {
  if (res.locals.currentUser.username != "admin")
    return res.redirect("/login");

  User.findOne({ _id: req.params.user_id }, function (err, user) {
    if (err) return res.json({ message: "failed" });
    const cryptr = new Cryptr(user.decryption_key);
    var data = { user, cryptr };
    check_disk(req, res, "user/profile", data);
  })
});

//update admin storage
router.post("/adminStorage", function (req, res) {
  User.findOne({ username: "admin" }, function (err, admin) {
    if (err) {
      return console.log(err);
    }
    var used_admin_space = admin.capacity - admin.free_space;
    if (req.body.adminStorage < used_admin_space) {
      return res.send("<h1 style='text-align: center;'>you can't choose a storage less than you are using: " + used_admin_space + ", <a href='/users'>Go Back</a></h1>");
    }
    /****** ! */
    disk.check(config.folder_path, async function (err, info) {
      var free_disk_sp_G = info.free;
      console.log(free_disk_sp_G);
      User.find({}, async function (err, users) {
        if (err) { console.log(err); res.json({ message: "fail" }) }
        else {
          var temp_used = 0;
          var original_free_disk = 0;
          var used_users_storage = 0;
          var allowed_storage = 0;
          var total_users_storage = 0;
          await users.forEach(t_user => {
            temp_used = t_user.capacity - t_user.free_space;
            used_users_storage += temp_used;
            total_users_storage += t_user.capacity;
          });
          total_users_storage = total_users_storage * Math.pow(1000, 3);
          console.log(used_users_storage, total_users_storage);
          original_free_disk = free_disk_sp_G - used_users_storage;
          allowed_storage = original_free_disk - total_users_storage;
          allowed_storage = allowed_storage / Math.pow(1000, 3);
          var dirence = req.body.adminStorage - admin.capacity;
          if (dirence > allowed_storage) {
            return res.send("<h1 style='text-align: center;'>not enough allowed storage, <a href='/users'>Go Back</a></h1>");
          }
          admin.capacity = req.body.adminStorage;
          admin.free_space = req.body.adminStorage - used_admin_space;
          admin.save();
          res.redirect("/");
        }
      });
    });

  })
});


//get users
router.get("/users", isLoggedIn, function (req, res) {
  if (req.user.username != "admin")
    return res.redirect("/login");

  User.find({}, function (err, users) {
    if (err) {
      console.log(err);
    }
    else {
      User.findOne({ username: "admin" }, function (err, admin) {
        var data = { users, moment, admin_free_sp: admin.free_space };
        check_disk(req, res, "user/users", data);
      });
    }
  })
});



//check admin
router.get("/admin", function (req, res) {
  User.findOne({ username: 'admin' }, function (err, user) {
    if (err) {
      console.log(err);
      res.json({ message: "failed", err });
    }
    else if (user) {
      res.json({ message: "exists", user });
    }
    else
      res.json({ message: "failed" });
  })
});



/*****register routes*/
router.get("/register", isLoggedIn, function (req, res) {
  if (res.locals.currentUser.username != "admin")
    return res.redirect("/login");

  // get disk usage.
  var data = { };
  check_disk(req, res, "user/adduser", data);

});



router.post("/register", async function (req, res) {
  var date_now = new Date(Date.now());
  date_now = date_now.toUTCString();

  Deleted_user.countDocuments({ username: req.body.username }, function (err, count) {
    console.log(count);
    if (count == 0) {
      var newUser = new User({ username: req.body.username, capacity: req.body.capacity, free_space: req.body.capacity, folder_name: req.body.username + "_" + date_now });
      User.register(newUser, req.body.password, function (err, user) {
        if (err) {
          console.log(err);
          return res.json({ message: "failed" });
        }
        else {
          const cryptr = new Cryptr(config.cryptionKey);
          const encrptedPass = cryptr.encrypt(req.body.password);
          user.encrypted_pass=encrptedPass;
          user.decryption_key=config.cryptionKey;
          user.save(function () { return res.json({ message: "success", user }); });
        }
      });
    }
    else {
      return res.json({ message: "failed" });
    }

  });

});

/////login routes
router.get("/login/:status?", function (req, res) {
  User.findOne({ username: 'admin' }, function (err, user) {
    if (err) { console.log(err); return res.json({ message: "failed", err });}
    else if (!user) {  return res.redirect("/");  }
    else{
      if (req.params.status == "fail") return res.render("login", { status: req.params.status });
    else return res.render("login");
    }
  });
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/", //home redirect
  failureRedirect: "/login/fail" //redirect to login
}));

router.get("/logout", function (req, res) {
  req.logout();
  res.redirect("login");
});


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();
  else {
    res.redirect("/login");
  }
}

/******* creating Admins */
router.get("/", function (req, res) {
  fetch('http://localhost:'+config.port+'/admin').then((res0) => { return res0.json(); })
    .then(function (resp) {
      if (resp.message != "exists") {
        fetch('http://localhost:'+config.port+'/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username: "admin", password: config.password })
        }).then((res1) => { console.log("admin created"); res.render("login"); });
      }
      else {
        if (req.user) {
          if (req.user.username == "admin")
            res.redirect("/usage");
          else
            res.redirect("/storage");
        }
        else
          res.render("login");

      }
    });

});

//***** functions */
function check_disk(req, res, view, data) {
  disk.check(config.folder_path, async function (err, info) {
    if(err){console.log(err); return res.json({message:"fail", desc: "check_disk failed"})}
    var free_disk_sp_G = info.free;
    User.find({}, async function (err, users) {
      if (err) { console.log(err); res.json({ message: "fail" }) }
      else {
        var temp_used = 0;
        var original_free_disk = 0;
        var used_users_storage = 0;
        var allowed_storage = 0;
        var total_users_storage = 0;
        await users.forEach(t_user => {
          temp_used = t_user.capacity - t_user.free_space;
          used_users_storage += temp_used;
          total_users_storage += t_user.capacity;
        });
        total_users_storage = total_users_storage * Math.pow(1000, 3);
        console.log(used_users_storage, total_users_storage);
        original_free_disk = free_disk_sp_G - used_users_storage;
        allowed_storage = original_free_disk - total_users_storage;
        allowed_storage = allowed_storage / Math.pow(1000, 3);
        data["allowed_storage"] = allowed_storage;
        data["free_disk_sp_G"] = free_disk_sp_G;
        res.render(view, data);
      }
    });
  });
}

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
