app
    .controller("topic_page_ctrl", function ($scope, $http, $rootScope, query, core, $q, $timeout) {

        $scope.author = null; // 作者信息
        $scope.topic = null;  // 主题贴
        $scope.replys = {};  // 回帖库
        $scope.main_reply_ids = []; // 主贴id列表
        $scope.sub_reply_ids_repo = {};  // 子贴id库

        // 初始化
        $scope.$watch("topicId", function (topicId) {
            if (topicId) {

                query("get a column by topic's id", {id: topicId}).then(function (column) {
                    $scope.column = column;
                });

                query("get a topic by id", {id: topicId}).then(function (topic) {

                    $scope.topic = topic;
                    $scope.reply_tree = topic.replyTree;

                    $scope.main_reply_ids = topic.replyTree.childIdsList;

                    function getSubIdsList(child) {
                        var rs = child.childIdsList.concat([]);
                        child.childIdsList.forEach(function (rid) {
                            rs = rs.concat(getSubIdsList(child.childs[rid]));
                        })
                        return rs;
                    }

                    $scope.main_reply_ids.forEach(function (rid) {
                        $scope.sub_reply_ids_repo[rid] = getSubIdsList(topic.replyTree.childs[rid]);
                        sub_reply_show_count_repo[rid] = 0;
                    });

                    $scope.moreMainReply();

                    query("get a user by id", {id: topic.authorId}).then(function (author) {
                        $scope.author = author;
                    });
                });
            }
        })

        var show_main_reply_num = 3; //主回复贴显示数量
        var show_sub_reply_num = 3; // 子回复帖显示数量

        // 主回复贴已经显示了几个
        var main_reply_show_count = 0;

        // 子回复贴已经显示了几个
        var sub_reply_show_count_repo = {}

        // 删除一个回帖
        $scope.removeReply = function (rid) {
            var bool = window.confirm("是否删除这个回复？");
            if (bool) {
                core.call("Topic.removeReply", $scope.topicId, [rid]);
                delete $scope.replys[rid];
            }
        }

        // 删除一个主题帖
        $scope.removeTopic = function () {
            var bool = window.confirm("是否删除这个主题？");
            if (bool) {
                core.exec("remove a topic", {id:$scope.topicId});
                setTimeout(function(){
                    window.location.href = "/column?id="+$scope.topic.columnId;
                },1000)
            }
        }

        // 判断是否可以删除此主题
        $scope.canRemoveTopic = function () {
            try {
                if (
                    $rootScope.loginUser.role === 1 ||
                        $rootScope.loginUser.id === $scope.author.id ||
                        $scope.column.managerId === $rootScope.loginUser.id) {
                    return true;
                }
            } catch (e) {

            }
        }

        // 判断是否可以删除一个回复贴
        $scope.canRemoveReply = function (replyId) {
            try {
                if ($rootScope.loginUser.role === 1 ||
                    $rootScope.loginUser.id === $scope.author.id ||
                    $scope.column.managerId === $rootScope.loginUser.id ||
                    $rootScope.loginUser.id === $scope.replys[replyId].authorId
                    ) {
                    return true;
                }
            } catch (e) {

            }
        }

        // 置顶该主题
        $scope.top = function () {
            core.exec("top topic", {id: $scope.topicId});
            $timeout(function () {
                window.location.reload();
            }, 1000)
        }

        // 取消置顶该主题
        $scope.untop = function () {
            core.exec("down topic", {id: $scope.topicId});
            $timeout(function () {
                window.location.reload();
            }, 1000)
        }

        // 加载回复贴和其用户信息
        function loadReply(ids) {
            // 加载要显示的贴
            var qs = []
            for (var i = 0, len = ids.length; i < len; i++) {
                qs.push(query("get a reply by id", {id: ids[i]}));
            }

            $q.all(qs).then(function (rs) {
                if (rs) {
                    for (var i = 0, len = rs.length; i < len; i++) {
                        $scope.replys[rs[i].id] = rs[i];

                        // 得到该回复的作者
                        query("get a user by id", {id: rs[i].authorId}).then(function (u) {
                            $scope.users[u.id] = u;
                        })
                    }
                }
            })
        }

        // 展开更多主回复帖
        $scope.moreMainReply = function () {

            var ids = $scope.main_reply_ids.slice(main_reply_show_count, main_reply_show_count+show_main_reply_num);

            main_reply_show_count += show_main_reply_num;

            if (main_reply_show_count > $scope.main_reply_ids.length){
                main_reply_show_count = $scope.main_reply_ids.length;
            }

            for(var i= 0,len=ids.length;i<len ;i++){
                $scope.moreSubReply(ids[i]);
            }

            loadReply(ids);
        }

        // 展开主回复下的更多子回复
        $scope.moreSubReply = function (mainReplyId) {

            var ids = $scope.sub_reply_ids_repo[mainReplyId].slice(sub_reply_show_count_repo[mainReplyId], show_sub_reply_num+sub_reply_show_count_repo[mainReplyId]);

            sub_reply_show_count_repo[mainReplyId] += show_sub_reply_num

            if (sub_reply_show_count_repo[mainReplyId] > $scope.sub_reply_ids_repo[mainReplyId].length)
                sub_reply_show_count_repo[mainReplyId] = $scope.sub_reply_ids_repo[mainReplyId].length;

            loadReply(ids);

        }

        // 判断是否该显示 主回帖下的 ［更多］ 按钮
        $scope.showMainMore = function () {
            return main_reply_show_count < $scope.main_reply_ids.length
        }

        // 判断是否该显示 子回帖下的 ［更多］ 按钮
        $scope.showSubMore = function (mainReplyId) {
            return sub_reply_show_count_repo[mainReplyId] && sub_reply_show_count_repo[mainReplyId] < $scope.sub_reply_ids_repo[mainReplyId].length;
        }


        $scope.moveEditor = function (cid, parentId) {
            $scope.errors = null;
            $scope.body = "";
            if (cid === "createReply") {
                $scope.editorContainerId = cid;
                $scope.parentId = null;
            } else {
                $scope.editorContainerId = cid;
                $scope.parentId = parentId || cid;
            }
        }

        $scope.createReply = function () {

            var parentId = $scope.parentId;

            var data = {
                body: $scope.body,
                topicId: $scope.topicId,
                parentId: $scope.parentId
            }

            $http.post("/reply/create", data).success(function (result) {

                if (result.errors) {
                    $scope.errors = result.errors;
                } else {

                    // 清除信息
                    $scope.errors = null;
                    $scope.body = "";

                    var newReply = result.data && result.data.reply;

                    $scope.replys[newReply.id] = newReply;


                    // 添加信息到UI
                    if($scope.editorContainerId){
                        var ids = $scope.sub_reply_ids_repo[$scope.editorContainerId];
                        if(ids){
                            ids.splice(sub_reply_show_count_repo[$scope.editorContainerId],0,newReply.id);
                        }else{
                            $scope.sub_reply_ids_repo[$scope.editorContainerId] = [newReply.id];
                        }
                        if(sub_reply_show_count_repo[$scope.editorContainerId]){
                            sub_reply_show_count_repo[$scope.editorContainerId] += 1;
                        }else{
                            sub_reply_show_count_repo[$scope.editorContainerId] = 1;
                        }
                    }else{
                        $scope.main_reply_ids.splice(main_reply_show_count,0,newReply.id);
                        main_reply_show_count += 1;

                    }

                }
            })
        }

    })

    .directive("replyEditor", function ($rootScope) {

        return {

            templateUrl: "/template/reply.html",
            restrict: "E",
            link: function (scope, elem, attrs) {

                scope.$watch("editorContainerId", function (v) {
                    if (v) {
                        var parent = document.querySelector("#" + v);
                        parent.appendChild(elem[0]);
                        elem[0].scrollIntoView()
                    }
                    $rootScope.refreshNum();
                })

            }
        }

    })