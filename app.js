var express = require('express');
var app = express();
var session = require('express-session');

//要用websocket 下面这两句话就必须写，固定格式
var http =require('http').Server(app);
var io =require('socket.io')(http);

//下面是session的固定格式！！！！！！！！！！！
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  // cookie: { secure: true }
}));

app.use(express.static('./public'));


// 这里没有用数据库，而是用的内存来保存的用户！！！！！！！
var alluser = [];

app.set('view engine','ejs');
// 中间件
app.get('/',function(req,res,next){
	res.render('index');
});

// 确认登陆，然后检查是否有用户名，昵称不能重复，赋予session
app.get('/check',function(req,res,next){
	name = req.query.username;
	// 这里没有用数据库，而是用的内存来保存的用户 ！！！！
	if(!name){
		res.send('请填写用户名！');
		return;
	}
	if(alluser.indexOf(name) != -1){
		res.send('用户名被占用');
		return;
	}
	// 注册成功，push到数组然后设置session ！！！
	alluser.push(name);
	req.session.username = name;
	res.redirect('/chat');

});

app.get('/chat',function(req,res,next){
	// 这个页面必须保证有用户名，就是要有session
	if(!req.session.username){
		res.redirect('/');
		return;
	}
	res.render('chat',{
		"username":req.session.username
	});
});

io.on("connection",function(socket){
	//用socket.on监听用户端的emit，并返回所有给所有客户端信息
	// 这里的msg就是个json形式，可以直接  原模原样  返回给模版，模版再处理
	socket.on('message',function(msg){
		io.emit('messages',msg);
	});
});

// 这要改成http，不用app
http.listen(3000);