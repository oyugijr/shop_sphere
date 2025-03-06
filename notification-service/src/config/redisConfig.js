const Redis = require('ioredis');
require("dotenv").config();

const redisPub = new Redis(process.env.REDIS_URL);
const redisSub = new Redis(process.env.REDIS_URL);

module.exports = { redisPub, redisSub };