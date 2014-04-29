function oneday(date) {
    var date = date || new Date();
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    this.startTime = date.getTime();
    this.endTime = this.startTime + 1000 * 60 * 60 * 24;
}

var query = require("query-brighthas")(),
    option1 = [
        "id", {required: true},
        "page", {type: "number", convert: true, default: 1},
        "limit", {type: "number", convert: true, default: 10}
    ],
    option2 = ["id", {required: true}],
    option3 = option1.slice(2).concat(["keyword", {required: true}]);


query.add("get all columns", function (args, callback) {
    var db = dbs.getDB("Column");
    db.find({}).exec(function (err, rs) {
        callback(rs || []);
    })
})

    .add("get a column by id", option2, function (args, callback) {
        var db = dbs.getDB("Column");
        db.findOne({
            id: args.id
        }).exec(function (err, rs) {
                callback(rs);
            })
    })

    .add("get a column by topic's id", option2, function (args, callback) {
        var tdb = dbs.getDB("Topic");
        var cdb = dbs.getDB("Column");
        tdb.findOne({
            id: args.id
        }).exec(function (err, rs) {
                if (rs) {
                    cdb.findOne({
                        id: rs.columnId
                    }).exec(function (err, c) {
                            callback(c);
                        });
                } else {
                    callback(null);
                }
            })
    })

    .add("get a topic by id", option2, function (args, callback) {
        var db = dbs.getDB("Topic");
        db.findOne({
            id: args.id
        }).exec(function (err, rs) {
                callback(rs);
            })
    })

    .add("get a reply by id", option2, function (args, callback) {
        var db = dbs.getDB("Reply");
        db.findOne({
            id: args.id
        }).exec(function (err, rs) {
                callback(rs);
            })
    })

    .add("get a newest reply by topic's id", option2, function (args, callback) {
        var db = dbs.getDB("Reply");
        db.findOne({
            topicId: args.id
        })
            .sort({createTime: -1})
            .exec(function (err, rs) {
                callback(rs);
            })
    })

    .add("get a newest reply's author by topic's id", option2, function (args, callback) {
        var self = this;
        this("get newest reply by topic's id", {topicId: args.id}).then(function (r) {
            if (r) {
                self("get user by id", {id: r.authorId}).then(function (u) {
                    callback(u);
                })
            } else {
                callback(null);
            }
        })
    })

    .add("get topics by column's id",
    option1,
    function (args, callback) {
        var db = dbs.getDB("Topic");
        db
            .find({
                columnId: args.id,
                top:false
            })
            .limit(args.limit)
            .sort({
                updateTime: -1
            })
            .skip((args.page - 1) * args.limit)
            .exec(function (err, rs) {
                callback(rs || []);
            })
    })

    .add("get top topics by column's id",
    option2,
    function (args, callback) {
        var db = dbs.getDB("Topic");
        db
            .find({
                columnId: args.id,
                top:true
            })
            .sort({
                updateTime: -1
            })
            .exec(function (err, rs) {
                callback(rs || []);
            })
    })

    .add("get topics by user's id",
    option1,
    function (args, callback) {
        var db = dbs.getDB("Topic");
        db
            .find({
                authorId: args.id
            })
            .limit(args.limit)
            .sort({
                updateTime: -1
            })
            .skip((args.page - 1) * args.limit)
            .exec(function (err, rs) {
                callback(rs || []);
            })
    })

    .add("get topic count by column's id",
    option2,
    function (args, callback) {
        var db = dbs.getDB("Topic");
        db.count({columnId: args.id}).exec(function (err, count) {
            callback(count || 0);
        })
    })

    .add("get a user by id", option2,
    function (args, callback) {
        var db = dbs.getDB("User");
        db.findOne({
            id: args.id
        }).exec(function (err, rs) {
                callback(rs);
            });
    })

    .add("get a user by email", ["email", {type: "email", required: true}],
    function (args, callback) {
        var db = dbs.getDB("User");
        db.findOne({
            email: args.email
        }).exec(function (err, rs) {
                callback(rs);
            });
    })

    .add("get a user by nickname", ["nickname", {required: true}],
    function (args, callback) {
        var db = dbs.getDB("User");
        db.findOne({
            nickname: args.nickname
        }).exec(function (err, rs) {
                callback(rs);
            });
    })

    .add("get a user's reply count in today", option2,
    function (args, callback) {
        var date = new oneday();
        var db = dbs.getDB("Reply");
        db.count({
            authorId: args.id,
            createTime: {
                $gt: date.startTime,
                $lt: date.endTime
            }
        })
            .exec(function (err, num) {
                callback(num || 0);
            });
    })

    .add("get a user's topic count in today", option2,
    function (args, callback) {
        var date = new oneday();
        var db = dbs.getDB("Topic");
        db.count({
            authorId: args.id,
            createTime: {
                $gt: date.startTime,
                $lt: date.endTime
            }
        })
            .exec(function (err, num) {
                callback({count:num||0});
            })
    })

    .add("get topic count by user's id", option2,
    function (args, callback) {
        var db = dbs.getDB("Topic");
        db
            .count({
                authorId: args.id
            })
            .exec(function (err, rs) {
                callback({count:rs||0});
            })
    })

    .add("get replys by user's id",
    option1,
    function (args, callback) {
        var db = dbs.getDB("Reply");
        db
            .find({
                authorId: args.id
            })
            .limit(args.limit)
            .sort({
                createTime: -1
            })
            .skip((args.page - 1) * args.limit)
            .exec(function (err, rs) {
                callback(rs || []);
            })
    })

    .add("get reply count by user's id", option2,
    function (args, callback) {
        var db = dbs.getDB("Reply");
        db
            .count({
                authorId: args.id
            })
            .exec(function (err, rs) {
                callback({count:rs || 0});
            })
    })

    .add("get messages by user's id", option1,
    function (args, callback) {
        var db = dbs.getDB("Message");
        db
            .find({
                targetId: args.id
            })
            .limit(args.limit)
            .sort({
                createTime: -1
            })
            .skip((args.page - 1) * args.limit)
            .exec(function (err, rs) {
                callback(rs || []);
            })
    })


    .add("get infos by user's id", option1,
    function (args, callback) {
        var db = dbs.getDB("Info");
        db
            .find({
                targetId: args.id
            })
            .limit(args.limit)
            .sort({
                createTime: -1
            })
            .skip((args.page - 1) * args.limit)
            .exec(function (err, rs) {
                callback(rs || []);
            })
    })

    .add("get top topics",
    function (args, callback) {
        var db = dbs.getDB("Topic");
        db.find({top: true}).limit(10).sort({
            updateTime: -1
        }).exec(function (err, rs) {
                callback(rs || []);
            })
    })

    .add("get hot topics", function (args, callback) {
        var db = dbs.getDB("Topic");
        db.find({}).limit(10).sort({
            replyNum: -1
        }).exec(function (err, rs) {
                callback(rs || []);
            })
    })

    .add("search topics by keyword",
    option3,
    function (args, callback) {
        var db = dbs.getDB("Topic");
        var num = 0;
        db.find({
            $where: function () {
                var regexp = new RegExp(args.keyword, "gi");
                return  regexp.test(this.title) || regexp.test(this.body);
            }
        })
            .limit(args.limit)
            .sort({
                updateTime: -1
            })
            .skip((args.page - 1) * args.limit)
            .exec(function (err, rs) {
                callback(rs || []);
            })
    })

    .add("search topics count by keyword",
    ["keyword", {required: true}],
    function (args, callback) {
        var db = dbs.getDB("Topic");
        db.count({
            $where: function () {
                var regexp = new RegExp(args.keyword, "gi");
                return  regexp.test(this.title) || regexp.test(this.body);
            }
        })
            .exec(function (err, rs) {
                callback(rs || 0);
            })
    })