app
    .factory("token",function($http){
        return $http.get("/token");
    })
    .controller("userCtrl",
    function ($modal, $rootScope, $scope, $http, $timeout, $upload, $tooltip, $sce, core, query,token) {

        $scope.targetTag = window.location.hash;
        if ($scope.targetTag) {
            $scope.targetTag = $scope.targetTag.substr(1);
        }

        $scope.hasFollow = function () {
            var has = false;
            var follows = $rootScope.loginUser ? $rootScope.loginUser.follows || [] : [];
            for (var i = 0, len = follows.length; i < len; i++) {
                if ($scope.userId === follows[i]) {
                    has = true;
                    break;
                }
            }
            return has;
        }

        // 给该用户发私信
        $scope.sendMessage = function () {
            var sc = $scope.$new();
            sc.userId = $scope.userId;
            $modal.open({
                scope: sc,
                templateUrl: '/template/message.html',
                controller: "messageCtrl"
            });
        }

        // 关注该用户
        $scope.follow = function () {
            core.call("User.follow", $rootScope.loginUser.id, [$scope.userId]);
            $rootScope.loginUser.follows.push($scope.userId);
        }

        // 取消关注该用户
        $scope.unfollow = function () {
            this.showcode = false;
            core.call("User.unfollow", $rootScope.loginUser.id, [$scope.userId]);
            for (var i = 0, len = $rootScope.loginUser.follows.length; i < len; i++) {
                if ($scope.userId === $rootScope.loginUser.follows[i]) {
                    $rootScope.loginUser.follows.splice(i, 1);
                }
            }
        }


        // 用户回复的信息
        $scope.replys = [];

        // 用户发表的主题
        $scope.topics = [];

        // 初始化用户信息
        $scope.$watch("userId", function (uid) {
            if (uid) {
                query("get a user by id", [uid]).then(function (user) {
                    $scope.user = user;
                })
            }
        })

        // 更改用户信息
        $scope.updateUser = function () {

            $http.post("/forum/users/" + $scope.userId + "/updateInfo", $scope.user);
        }

        $scope.$watch("user.isCustomLogo", function (v) {
            if (typeof v !== "undefined") {
                $scope.updateUser();
            }
        })

        var tok;

        token.then(function(t){
            tok = t.data;
        })

        // 上传用户头像
        $scope.onFileSelect = function ($files) {
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];
                $scope.upload = $upload.upload({
                    url: 'http://up.qiniu.com/',
                    data: {myObj: $scope.myModelObj,token:tok,key:"logo/"+$scope.user.username},
                    file: file
                }).progress(function (evt) {
                    }).success(function (data, status, headers, config) {
                        if (data.errors) {
                            // 提示错误信息
                            setTimeout(function () {
                                alert(data);
                            });
                        } else {
                            setTimeout(function () {
                                window.location.reload()
                            }, 1000);
                        }
                    });
            }
        };

        // 设置用户为某个板块的管理员
        $scope.setManager = function (uid, cid) {
            $http.post("/forum/columns/"+cid+"/setManager",{managerId:uid});
            setTimeout(function () {
                window.location.reload()
            }, 1000);
        }

        $scope.selectTopicPage = function (page) {

            query("get topics by user's id", [$scope.userId, page]).then(function (rs) {
                $scope.topicTitles = rs;
            })

        }

        $scope.selectReplyPage = function (page) {

            query("get replys by user's id", [$scope.userId, page]).then(function (rs) {
                $scope.replys = rs;
                for (var i = 0, len = rs.length; i < len; i++) {
                    query("get a topic by id", [rs[i].topicId]).then(function (t) {
                        if (t) {
                            $scope.topics[t.id] = t;
                        }
                    })
                }
            });

        }

        $scope.loadTopicList = function () {

            query("get topic count by user's id", [$scope.userId]).then(function (rs) {
                $scope.bigTotalItems = rs.count;
                $scope.bigCurrentPage = 1;
                $scope.perPage = 10;
            })

            $scope.selectTopicPage(1);

        }

        $scope.loadReplyList = function () {

            query("get reply count by user's id", [$scope.userId]).then(function (rs) {
                $scope.bigTotalItems2 = rs.count;
                $scope.bigCurrentPage2 = 1;
                $scope.perPage2 = 10;
            })

            $scope.selectReplyPage(1);
        }

        var messagePage = 0;
        $scope.messageList = [];
        $scope.showMessageMoreButton = true;

        $scope.loadMessageList = function () {
            messagePage += 1;
            query("get messages by user's id", [$scope.userId, messagePage]).then(function (rs) {
                if (rs.length <= $scope.messageList.length) {
                    $scope.showMessageMoreButton = false;
                } else {
                    $scope.messageList = rs;
                }
            })
        }

        var infoPage = 0;
        $scope.infoList = [];
        $scope.showInfoMoreButton = true;

        $scope.loadInfoList = function () {
            infoPage += 1;
            query("get infos by user's id", [$scope.userId, infoPage]).then(function (rs) {
                if (rs.length <= $scope.infoList.length) {
                    $scope.showInfoMoreButton = false;
                } else {
                    $scope.infoList = rs;
                }
            })
        }

        $scope.sce = function (htmltxt) {
            return $sce.trustAsHtml(htmltxt);
        }

    })
