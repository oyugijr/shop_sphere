const express = require("express");
const proxy = require("express-http-proxy");
const { ORDER_SERVICE_URL } = require("../config/services");

const router = express.Router();
router.use("/", proxy(ORDER_SERVICE_URL));

module.exports = router;
