var mongoose = require('mongoose');
// 创建数据库
var db = mongoose.createConnection('mongodb://localhost:27017/Terrywhite',{ useNewUrlParser: true });
// 监听open事件
db.once('open',function(callback){
	console.log('success connection to Mongodb');
})

// 因为在做实例化的时候需要用到db，我们需要给它一个接口来调用
module.exports = db;
