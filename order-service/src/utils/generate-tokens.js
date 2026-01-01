const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = 'your_jwt_secret';
const userId = new mongoose.Types.ObjectId();
const adminId = new mongoose.Types.ObjectId();

const userToken = jwt.sign({ id: userId.toString(), role: 'user' }, JWT_SECRET);
const adminToken = jwt.sign({ id: adminId.toString(), role: 'admin' }, JWT_SECRET);

console.log('User Token:', userToken);
console.log('Admin Token:', adminToken);
console.log('User ID:', userId.toString());