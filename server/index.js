var express = require('express');

var bodyParser = require('body-parser');
var session = require('express-session');

var Cookies = require('cookies');
var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json())

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    // res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    next();
})

app.use(session({
    secret: 'keyboard cat', //增加安全性
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 30, // 设置 session 的有效时间，单位毫秒
    },
}))

app.use('/upload', require("./router/upload"))

app.listen(3333, function () {
    console.log('app is listening on port 3333.');
})