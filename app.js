var qiniu = require("./qiniu");

var forum = require("forum");
var identity = require("identity")();
var captcha = require("captcha");
var markdown = require("marked");

identity.domain.on("User.*.create", function (data) {
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
app.post("/forum/topics/create", captcha.validat);


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

function loginUser(req, res, next) {
    res.locals.loginUser = null;

    if (req.session.user) {
        query["get a user by id"](req.session.user.id).then(function (user) {
            res.locals.loginUser = user;
            next();
        })
    } else {
        next();
    }
}

app.get("/", share_data, loginUser, function (req, res) {

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
        res.locals.pageType = "index";

        res.render("index");

    }
})

app.post("/user/logined", loginUser, function (req, res) {
    res.send(res.locals.loginUser || "");
})

function topicInfo(topic) {

    var defer = Q.defer();

    var info = {}

    query["get a user by id"](topic.authorId).then(function (topicAuthor) {

        info.topicAuthor = topicAuthor;

        query["get a newest reply by topic's id"](topic.id).then(function (r) {
            if (r) {
                info.newReply = r;
                query["get a user by id"](r.authorId).then(function (replyAuthor) {
                    if (replyAuthor) {
                        info.replyAuthor = replyAuthor;
                    }
                    defer.resolve(info);
                })
            } else {
                defer.resolve(info);
            }
        })
    })

    return defer.promise;
}

app.get("/column/:id/:page?", share_data, loginUser, function (req, res) {

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

            res.locals.pager = Pager(count, parseInt(req.params.page) || 1, 10);

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
})

app.get("/topic/:id", share_data, loginUser, function (req, res) {

    var topicId = req.params.id;

    Q.all([
            query["get a topic by id"](topicId),
            query["get a column by topic's id"](topicId)
        ]).spread(function (topic, column) {

            if (topic && column) {
                res.locals.topic = topic;
                res.locals.title = topic.title;
                res.locals.breadcrumb = "topic"
                res.locals.column = column;
                res.locals.markdown = markdown;

                res.render("topic");
            } else {
                res.send(404);
            }

        }).fail(function (err) {
            console.log(err)
        })
})

app.get("/user/:id", share_data, loginUser, function (req, res) {

    query["get a user by id"](req.params.id).then(function (user) {
        if (user) {
            res.locals.breadcrumb = "user";
            res.locals.user = user;
            res.locals.title = res.locals.user.username + "的个人中心"
            res.render("user");
        } else {
            res.send(404);
        }
    })
})

app.get("/search", share_data,function (req, res) {

    if (req.query.keyword) {
        Q.all([
                query["search topics by keyword"](req.query.keyword, req.query.page),
                query["search topics count by keyword"](req.query.keyword)])
            .spread(function (topics, count) {


                res.locals.breadcrumb = "search";
                res.locals.title = "搜索关键词: " + req.query.keyword;
                res.locals.keyword = req.query.keyword;
                res.locals.topics = topics;
                res.locals.pager = Pager(count, parseInt(req.query.page) || 1, 10);

                var topicInfosArr = [];

                topics.forEach(function (topic) {
                    topicInfosArr.push(topicInfo(topic));
                });

                Q.all(topicInfosArr).then(function (rs) {
                    res.locals.topicsInfo = rs;
                    res.render("search");
                })

            })
    } else {
        res.send(404);
    }


})

app.get("/token",  function(req,res){
    if(req.session.user){
        var putPolicy = new qiniu.rs.PutPolicy("jsera:logo/"+req.session.user.username);
        putPolicy.asyncOps  = "imageView2/2/w/200";
        res.send(putPolicy.token());
    }else{
        res.send();
    }
})

app.get("/query", function (req, res) {
    var qn = req.query.name;
    if (qn && query[qn]) {

        var params = []

        try {
            params = JSON.parse(req.query.params);
        } catch (e) {
        }

        query[qn].apply(null, params).then(function (rs) {
            res.send(rs);
        })

    } else {
        res.send();
    }

})

app.use(function (err, req, res, next) {
    console.log(err);
    res.send({errors: err});

});


module.exports = app;
