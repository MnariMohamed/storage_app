var express = require("express");
var router = express.Router({ mergeParams: true });
let config = require('/cfg/storage_config.json');

//get storage manager page
router.get("/storage_manager", function (req, res) {
    res.render("storage_manager/storage_manager");
})

module.exports = router;