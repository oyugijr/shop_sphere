const express = require("express");
const proxy = require("express-http-proxy");
const { PRODUCT_SERVICE_URL } = require("../config/services");

const router = express.Router();
router.use("/", proxy(PRODUCT_SERVICE_URL));

module.exports = router;
