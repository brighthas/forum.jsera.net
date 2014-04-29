var dbs = require("../forum").dbs;
var Q = require("q");

module.exports = {

    "get hot topics": function () {
        var defer = Q.defer();
        var db = dbs.getDB("Topic");

        db.find({fine: true}).limit(10).sort({updateTime: -1}).toArray(function (err, rs) {
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

    "get topics by column's id":function(columnId,page){

        var defer = Q.defer();
        if(columnId){
            page = parseInt(page) || 1;
            var db = dbs.getDB("Topic");
            db.find({columnId:columnId})
                .sort({updateTime:-1})
                .limit(10)
                .skip((page-1) * 10)
                .toArray(function(err,rs){
                    defer.resolve(rs || []);
                })
        }else{
            defer.resolve([]);
        }

        return defer.promise;
    },

    "get a column by id":function(id){
        var defer = Q.defer()

        var db = dbs.getDB("Column");
        db.findOne({id:id},function(err,rs){
            defer.resolve(rs);
        })

        return defer.promise;
    },

    "get topic count by column's id":function(id){
        var defer = Q.defer()

        var db = dbs.getDB("Topic");
        db.count({columnId:id},function(err,rs){
            defer.resolve(rs || 0);
        })

        return defer.promise;
    },

    "get top topics by column's id":function(id){
        var defer = Q.defer()

        var db = dbs.getDB("Topic");
        db.find({columnId:id,top:true}).sort({updateTime:-1}).toArray(function(err,rs){
            defer.resolve(rs || []);
        })

        return defer.promise;
    }


}

