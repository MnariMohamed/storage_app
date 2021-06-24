var express = require("express");
var router = express.Router({ mergeParams: true });
var config = require("../config");

//get storage manager page
router.get("/storage_manager", function (req, res) {
    res.render("storage_manager/storage_manager");
})

module.exports = router;