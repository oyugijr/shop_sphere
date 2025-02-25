const Product = require("../models/Product");

const findAll = async () => await Product.find();
const findById = async (id) => await Product.findById(id);
const create = async (data) => await Product.create(data);
const update = async (id, data) => await Product.findByIdAndUpdate(id, data, { new: true });
const remove = async (id) => await Product.findByIdAndDelete(id);

module.exports = { findAll, findById, create, update, remove };
