var fs = require('fs');

var config = {};

config.password = "adminpass";
config.folder_path = __dirname+'/uploadedFiles/'; //please change this in .gitignore as well
config.ip="0.0.0.0";
config.port=3020;
config.cryptionKey="myTotalySecretKey";

fs.access(config.folder_path, function(error) {
    if (error) {
      console.log("Directory does not exist.");
      fs.mkdir(config.folder_path, function (err) {
          if(err) return console.log("something wrong with folder path");
          else console.log("folder created");
      })
    }
  });

module.exports = config;