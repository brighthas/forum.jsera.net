var dbs = require("forum").dbs;
var Q = require("q");

var query = {

    "get hot topics": function () {
        var defer = Q.defer();
        var db = dbs.getDB("Topic");

        db.find({}).limit(10).sort({replyNum: -1}).toArray(function (err, rs) {
            defer.resolve(rs || []);
        })

        return defer.promise;
    },

    "get top topics": function () {
        var defer = Q.defer();
        var db = dbs.getDB("Topic");

        db.find({top: true}).limit(10).sort({updateTime: -1}).toArray(function (err, rs) {
            defer.resolve(rs || []);
        })

        return defer.promise;
    },

    "get all columns": function () {
        var defer = Q.defer();
        var db = dbs.getDB("Column");

        db.find({}).sort({updateTime: -1}).toArray(function (err, rs) {
            defer.resolve(rs || []);
        })

        return defer.promise;
    },

    "get topic count by column's id": function (columnId) {

        var defer = Q.defer();

        var db = dbs.getDB("Topic");

        db.count({columnId: columnId}, function (err, rs) {
            defer.resolve(rs || 0);
        })

        return defer.promise;
    },

    "get a user by id": function (id) {
        var defer = Q.defer();
        var db = dbs.getDB("User");
        db.findOne({
            id: id
        }, function (err, rs) {
            defer.resolve(rs);
        });

        return defer.promise;
    },

    "get topics by column's id": function (columnId, page) {

        var defer = Q.defer();
        if (columnId) {
            page = parseInt(page) || 1;
            var db = dbs.getDB("Topic");
            db.find({columnId: columnId})
                .sort({updateTime: -1})
                .limit(10)
                .skip((page - 1) * 10)
                .toArray(function (err, rs) {
                    defer.resolve(rs || []);
                })
        } else {
            defer.resolve([]);
        }

        return defer.promise;
    },

    "get a column by id": function (id) {
        var defer = Q.defer()

        var db = dbs.getDB("Column");
        db.findOne({id: id}, function (err, rs) {
            defer.resolve(rs);
        })

        return defer.promise;
    },

    "get topic count by column's id": function (id) {
        var defer = Q.defer()

        var db = dbs.getDB("Topic");
        db.count({columnId: id}, function (err, rs) {
            defer.resolve(rs || 0);
        })

        return defer.promise;
    },

    "get top topics by column's id": function (id) {
        var defer = Q.defer()

        var db = dbs.getDB("Topic");
        db.find({columnId: id, top: true}).sort({updateTime: -1}).toArray(function (err, rs) {
            defer.resolve(rs || []);
        })

        return defer.promise;
    },

    "get a newest reply by topic's id": function (id) {
        var defer = Q.defer()

        var db = dbs.getDB("Reply");
        db.find({
            topicId: id
        }).sort({createTime: -1}).toArray(function (err, rs) {
                defer.resolve(rs ? rs[0] : null);
            })
        return defer.promise;
    },

    "get a topic by id": function (id) {
        var defer = Q.defer()

        var db = dbs.getDB("Topic");
        db.findOne({
            id: id
        }, function (err, rs) {
            defer.resolve(rs);
        })
        return defer.promise;
    },

    "get a column by topic's id": function (id) {
        var defer = Q.defer();
        query["get a topic by id"](id).then(function (topic) {
            if (topic) {
                query["get a column by id"](topic.columnId).then(function (rs) {
                    defer.resolve(rs);
                })
            } else {
                defer.resolve();
            }
        })
        return defer.promise;
    },

    "get a reply by id": function (id) {
        var defer = Q.defer()

        var db = dbs.getDB("Reply");
        db.findOne({
            id: id
        }, function (err, rs) {
            defer.resolve(rs);
        })
        return defer.promise;
    },

    "get replys by user's id": function (uid, page) {
        var defer = Q.defer();
        page = parseInt(page) || 1;
        var db = dbs.getDB("Reply");
        db.find({authorId: uid})
            .sort({createTime: -1})
            .limit(10)
            .skip((page - 1) * 10)
            .toArray(function (err, rs) {
                defer.resolve(rs || []);
            })

        return defer.promise;
    },

    "get topic count by user's id": function (id) {
        var defer = Q.defer()

        var db = dbs.getDB("Topic");
        db.count({authorId: id}, function (err, rs) {
            defer.resolve(rs || 0);
        })

        return defer.promise;
    },

    "get reply count by user's id": function (id) {
        var defer = Q.defer()

        var db = dbs.getDB("Reply");
        db.count({authorId: id}, function (err, rs) {
            defer.resolve(rs || 0);
        })

        return defer.promise;
    },

    "get messages by user's id": function (uid, page) {
        var defer = Q.defer();
        page = parseInt(page) || 1;
        var db = dbs.getDB("Message");
        db.find({targetId: uid})
            .sort({createTime: -1})
            .limit(10)
            .skip((page - 1) * 10)
            .toArray(function (err, rs) {
                defer.resolve(rs || []);
            })

        return defer.promise;
    },

    "get infos by user's id": function (uid, page) {
        var defer = Q.defer();
        page = parseInt(page) || 1;
        var db = dbs.getDB("Info");
        db.find({targetId: uid})
            .sort({createTime: -1})
            .limit(10)
            .skip((page - 1) * 10)
            .toArray(function (err, rs) {
                defer.resolve(rs || []);
            })

        return defer.promise;
    },

    "get topics by user's id":function(uid,page){
        var defer = Q.defer();
        page = parseInt(page) || 1;
        var db = dbs.getDB("Topic");
        db.find({authorId: uid})
            .sort({createTime: -1})
            .limit(10)
            .skip((page - 1) * 10)
            .toArray(function (err, rs) {
                defer.resolve(rs || []);
            })

        return defer.promise;
    },
    "search topics by keyword":function(keyword,page){
        var defer = Q.defer();
        page = parseInt(page) || 1;
        var db = dbs.getDB("Topic");
        db.find({"$or":[{title:/.*keyword.*/},{body:/.*keyword.*/}]})
            .sort({createTime: -1})
            .limit(10)
            .skip((page - 1) * 10)
            .toArray(function (err, rs) {
                defer.resolve(rs || []);
            })

        return defer.promise;
    },
    "search topics count by keyword":function(keyword){
        var defer = Q.defer();
        var db = dbs.getDB("Topic");
        db.count({"$or":[{title:/.*keyword.*/},{body:/.*keyword.*/}]},function(err,count){
            defer.resolve(count);
        })
        return defer.promise;
    }

}


module.exports = query;
