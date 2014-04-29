var forum = require("../forum");
var identity = require("../identity")();
var captcha = require("../captcha");

identity.domain.on("User.*.create", function (data) {
    console.log(data);
    forum.domain.repos.User.create(data);
})

identity.domain.on("User.*.update", function (data) {
    forum.domain.Aggres.get(data.id).then(function (user) {
        if (user) {
            user.updateInfoPrivate(data);
        }
    })
})

var engines = require('consolidate');
var query = require("./query");
var Pager = require("./Pager");

var Q = require("q");

var express = require('express');
var session = require("express-session");
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();


app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser("keyboard cat"));
app.use(session());
app.use(express.static(path.join(__dirname, 'public')));

// view engine setup
app.engine('.html', engines.ejs);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');


// 加入验证码验证
app.post("/identity/reg", captcha.validat);
app.post("/identity/login", captcha.validat);


app.use('/forum', forum.controller);
app.use('/identity', identity.controller);
app.use("/captcha", captcha);

function share_data(req, res, next) {
    Q.all([
            query["get hot topics"](),
            query["get top topics"](),
            query["get all columns"]()
        ]).spread(function (hotList, topList, columnList) {
            res.locals.hotList = hotList;
            res.locals.topList = topList;
            res.locals.columnList = columnList;
            next();
        })
}


app.get("/", share_data, function (req, res) {

    var counts = [],
        managers = []; // 版主

    res.locals.columnList.forEach(function (col) {
        counts.push(query["get topic count by column's id"](col.id));
        managers.push(query["get a user by id"](col.managerId));
    })

    // 得到每个栏目的帖数
    Q.all(counts).spread(function () {
        res.locals.topicCountList = [].slice.apply(arguments);

        Q.all(managers).spread(function () {

            res.locals.managers = [].slice.apply(arguments);

            done();
        })
    })

    // 完成并渲染界面
    function done() {
        res.locals.title = "社区主页"
        res.locals.breadcrumb = "index"
        res.locals.loginUser = req.session.user;
        res.locals.pageType = "index";

        res.render("index");

    }
})

app.post("/user/logined", function (req, res) {
    res.send(req.session.user || "");
})

app.get("/column/:id/:page?", share_data, function (req, res) {

    var qs = [
        query["get topics by column's id"](req.params.id, req.params.page),
        query["get a column by id"](req.params.id),
        query["get topic count by column's id"](req.params.id),
        query["get top topics by column's id"](req.params.id)
    ]

    Q.all(qs).spread(function (topics, column, count, top_topics) {

        top_topics = top_topics || [];

        topics = top_topics.concat(topics);

        if (res.locals.column = column) {

            res.locals.breadcrumb = "column";
            res.locals.title = column.name;
            res.locals.topics = topics;

            res.locals.pager = Pager(count, parseInt(req.query.page) || 1, 10);

            var topicInfosArr = [];

            topics.forEach(function (topic) {
                topicInfosArr.push(topicInfo(topic));
            });

            Q.all(topicInfosArr).then(function (rs) {
                res.locals.topicsInfo = rs;
                res.render("column");
            })

        } else {
            res.send(404);
        }
    })
        // only test.
        .fail(function (err) {
            console.log(err);
        })
})

app.get("/topic/:id", function (req, res) {

    res.render("topic");
})

app.get("/user/:id", function (req, res) {

    res.render("topic");
})

app.get("/search", function (req, res) {

    res.render("search");
})

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    throw err;
    res.send({errors: err});

});


module.exports = app;
