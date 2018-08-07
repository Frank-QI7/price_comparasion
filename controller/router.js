var fd = require('formidable');
// var db= require('../models/db.js');
var accounts = require('../models/accounts.js');
var md5 = require('../models/md5.js');
var path = require('path');
var message = require('../models/message.js');
var session = require('express-session');
// var kecheng = require('../models/kecheng.js');
var fs = require('fs');



exports.showIndex = function(req,res,next){
	console.log(req.session.username);
	//当用户登陆成功的时候，取数据库查找此人的头像位置，用来展示用户头像
	if(req.session.login == "1"){
		var name = req.session.username;
		var login = true;
	}else{
		var name = "";
		var login = false;
	}
	accounts.find({"name":name},function(err,result){
		if (result.length == 0) { var avatar = "default.jpg";}else{
			var avatar = result[0].avatar;
		}
		// 我们现在不去遍历message，严格前后台分离，后台在这只给用户信息，不给所有的说说信息
		// message.find({},{},{sort: {date: -1}},function(err,result2){
			res.render("index",{
				"login":login,
				"username":name,
				"active":"首页",
				"avatar":avatar,  //登陆人的头像
				// 现在我们不用这种方法 严格前后台分离，后台在这只给用户信息，不给所有的说说信息
				// "shuoshuo":result2
			})
		});
	// });

};
//表单页
exports.showRegister = function(req,res,next){
	res.render("register",{
		"login":req.session.login == "1"?true:false,
		"username":req.session.login == "1"?req.session.username:"",
		// 用来设置 heading.ejs 里导航栏的 active
		"active":"注册"
	});
};

exports.doRegister = function(req,res,next){
	// 得到用户填写的信息，并查询数据库
	var form = new fd.IncomingForm();
	form.parse(req,function(err,fields){
		name = fields.username;
		pwd = md5(md5(fields.password) + "2");
		// 查询数据库是不是用户名被占用，没有占用就保存
		accounts.find({"name":name},function(err,result){
			if(err){
				res.send("-3"); //服务器错误
				return;
			}
			if(result.length !=0){
				res.send("-1"); //用户名被占用
				return;
			}
			accounts.create({"name":name,
							"password":pwd,
							"avatar":"default.jpg"},function(err,result){
				if(err){
					res.send('-3'); //服务器错误
					return;
				}
				// 在app.js里设置好session，这里可以直接用
				// req.session.login 和 req.session.username用来给index页面判断用户是否登陆了
				// 如果登陆了，那么注册和登录按钮就不存在了
				// 注册和登录成功后，都要用req.session给用户返回一个session！！！！！！！！
				// 用于取消登录和注册按钮
				req.session.login="1";
				req.session.username = name;
				// 最最最重要的一点！！！！res.send只能写在最后！！！！不然req.session传回去也是空！！！
				res.send('1'); //注册成功，并设置session！！！！
			});
		});
	})
};



exports.showlogin = function(req,res,next){
	res.render("login",{
		"login":req.session.login == "1"?true:false,
		"username":req.session.login == "1"?req.session.username:"",
		// 用来设置 heading.ejs 里导航栏的 active
		"active":"登陆"
	});
};

exports.checklogin = function(req,res,next){
	var form = new fd.IncomingForm();
	form.parse(req,function(err,fields){
		name = fields.username;
		pwd = md5(md5(fields.password) + "2");
		// 查询数据库是不是用户名被占用，没有占用就保存
		accounts.find({"name":name},function(err,result){
			if(err){
				res.send("-3"); //服务器错误
				return;
			}
			if(result.length==0){
				res.send("-1"); //用户名不存在
				return;
			}
			if(pwd == result[0].password){
				// 注册和登录成功后，都要用req.session给用户返回一个session！！！！！！！！
				// 用于取消登录和注册按钮
				req.session.login = "1";
				req.session.username = name;
				res.send("1"); //登陆成功
				return;
			}else{
				res.send("-2");
				return;
			}
		});
	})
};

//设置头像页面，必须保证此时是登陆状态！！！！！！！！！！！
exports.showAvatar = function(req,res,next){
	if(req.session.login!="1"){
		res.send("请登陆!");
		return;
	}
	res.render('setavatar',{
		"login" : true,
		"username":req.session.username,
		"active":"设置资料"
	})
};

// 图片上传后进入这个页面来剪裁,保存
exports.doAvatar = function(req,res,next){
	var form = new fd.IncomingForm();
	form.uploadDir = path.normalize(__dirname + '/../avatar/');
	form.parse(req,function(err,fields,files){
		var oldpath = files.avatar.path;
		var newpath = path.normalize(__dirname + "/../avatar/" + req.session.username + ".jpg");
		fs.rename(oldpath, newpath, function(err) {
			if(err){
				res.send('失败');
				return;
			}
			//图片剪切就不做了，下面直接把图片保存到数据库
			accounts.update({"name":req.session.username},{$set:{"avatar":req.session.username + ".jpg"}},function(err){
				// 按理说，我们此时应该返回1个1给前端ajax，让前端来执行redirect，但是我们没用ajax做，我们就在这redirect
				// res.write('设置成功，返回首页');
				res.redirect('/');
			});



		})

	})
};


// 保存说说
exports.dopostshuoshuo = function(req,res,next){
	//这个页面也需要用户登陆
	if(req.session.login!="1"){
		res.send("请登陆!");
		return;
	}

	// 得到用户填写的信息，并查询数据库
	var form = new fd.IncomingForm();
	form.parse(req,function(err,fields){
		var content = fields.content;
		message.create({
			name : req.session.username,
			content : content,
			date: new Date()
		},function(err,result){
 			if(err){
 				res.send('-3'); //服务器错误
 				return;
 			}
 			res.send('1');
		})
	});
}

// 给ajax用来获取数据的
exports.allshuoshuo = function(req,res,next){
	var page = req.query.page;
	per = 12
	message.find({},null,{sort: {date: -1},skip:(page)*per,limit:per},function(err,result){
		res.json(result);
	});
};


exports.getuserinfo = function(req,res,next){
	var name = req.query.username;
	accounts.find({"name":name},function(err,result){
		// 写一个obj传给res.json，不能把全部信息返回，因为含有密码
		var obj = {
			"username":result[0].name,
			"avatar":result[0].avatar,
			"_id":result[0]._id
		}
		res.json(obj);
	});
};

exports.shuoshuoamount = function(req,res,next){
	// function()里的参数必须要写err和result
	message.countDocuments({},function(err,result){
		res.send(result.toString());   //要把result化为string才可以send
	});
};

exports.showuser = function(req,res,next){
	// 理解 req.params["user"] ！！！！！！
	var user = req.params["id"];
    message.find({"name":user},function(err,result){
    	if(result.length == 0 ){
    		res.send("无效的用户名");
    		return;
    	}
    	//因为message里没有保存此人的头像信息，所以还要去accounts里再查找一下，
       accounts.find({"name":user},function(err,result2){
           res.render("user",{
               "login": req.session.login == "1" ? true : false,
               "username": req.session.login == "1" ? req.session.username : "",
               "user" : user,
               "active" : "我的说说",
               "cirenshuoshuo" : result,
               "cirentouxiang" : result2[0].avatar
           });
       });
    });
};

exports.showuserlist = function(req,res,next){
	    accounts.find({},function(err,result){
        res.render("userlist",{
            "login": req.session.login == "1" ? true : false,
            "username": req.session.login == "1" ? req.session.username : "",
            "active" : "成员列表",
            "suoyouchengyuan" : result
        });
    });
};


