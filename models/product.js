var mongoose = require('mongoose');
// 引用数据库 ！！！！！！
var db = require('./db.js');
var productschema = new mongoose.Schema({
	name : String,
	price : String,
	location : String,
	image: String
});

productschema.index({"name":1});

var productmodel = db.model('products',productschema);
module.exports = productmodel;