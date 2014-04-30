var app = angular.module('jseraApp', ['ui.bootstrap', 'angularFileUpload'])

    .run(function ($rootScope, $http) {

        $http.get("/template/usercode.html").then(function (rs) {
            $rootScope.usercode_template = rs.data;
        })

        $rootScope.users = {}

        $rootScope.refreshNum = function () {
            this.time = Date.now();
        }

        $rootScope.checkLogined = function () {
            var self = this;
            $http.post("/user/logined").success(function (data) {
                if (data) {
                    $rootScope.loginUser = data;
                    $rootScope.users[data.id] = data;
                }
            })
        }

        $rootScope.refreshNum();
        $rootScope.checkLogined();

    })

    .filter('markdown', function ($sce) {
        return function (value) {
            var html = marked(value || '');
            return $sce.trustAsHtml(html);
        };
    })

    .directive("editor", function ($sce) {
        return {
            scope: {
                content: "=",
                height: "@"
            },
            templateUrl: "/template/editor.html",
            link: function (scope, elem, attrs) {
                scope.editing = true;
                scope.top = function () {
                    elem[0].scrollIntoView(false);
                }
            }
        }
    })

    .directive("usercode", function ($http, $compile, $timeout, $modal, $offset, $rootScope, core, query) {

        return {

            scope: {
                "userId": "@"
            },

            link: function (scope, elem) {

                var userId;

                scope.hasFollow = function () {
                    var has = false;
                    var follows = $rootScope.loginUser ? $rootScope.loginUser.follows || [] : [];
                    for (var i = 0, len = follows.length; i < len; i++) {
                        if (scope.userId === follows[i]) {
                            has = true;
                            break;
                        }
                    }
                    return has;
                }

                scope.sendMessage = function () {
                    $modal.open({
                        scope: scope,
                        templateUrl: '/template/message.html',
                        controller: "messageCtrl"
                    });
                }

                scope.follow = function () {
                    core.call("User.follow", $rootScope.loginUser.id, [userId]);
                    $rootScope.loginUser.follows.push(userId);
                }

                scope.unfollow = function () {
                    this.showcode = false;
                    core.call("User.unfollow", $rootScope.loginUser.id, [userId]);
                    $timeout(function () {
                        for (var i = 0, len = $rootScope.loginUser.follows.length; i < len; i++) {
                            if (scope.userId === scope.loginUser.follows[i]) {
                                $rootScope.loginUser.follows.splice(i, 1);
                            }
                        }
                    })
                }

                scope.refreshNum = function () {
                    scope.time = new Date().getTime();
                }

                $rootScope.$watch("loginUser", function (loginUser) {
                    scope.loginUser = loginUser;
                })

                scope.$watch("userId", function (_userId) {
                    if (_userId) {

                        userId = _userId;

                        scope.user = $rootScope.users[userId];

                        if (!scope.user) {
                            query("get a user by id", {id: userId}).then(function (u) {

                                if (u) {
                                    scope.user = u;
                                    $rootScope.users[userId] = u;
                                }
                            })
                        }
                    }
                })

                var code;

                $rootScope.$watch("usercode_template", function (usercode_template) {
                    if (usercode_template) {
                        code = $compile(angular.element($rootScope.usercode_template))(scope);
                        angular.element(document.body).append(code);
                    }
                })

                var toid2;

                elem.bind("mouseleave", function () {
                    clearTimeout(toid2);
                })

                elem.bind("mouseenter", function (event) {

                    var toid = setTimeout(function () {
                        scope.showcode = false;
                        scope.$apply();
                    }, 1000);

                    code.bind("mouseenter", function (event) {
                        clearTimeout(toid);
                        code.bind("mouseleave", function () {
                            scope.showcode = false;
                            scope.$apply();
                        })
                    });

                    clearTimeout(toid2);

                    toid2 = setTimeout(function () {
                        scope.showcode = true;
                        scope.$apply();
                        var pos = $offset(elem);
                        code.css("left", pos.left + "px").css("top", pos.top + 17 + "px");
                    }, 100);


                })

            }
        }
    })

    .directive("focus", function ($timeout) {
        return {
            scope: {
                trigger: '@focus'
            },
            link: function (scope, element) {
                var els = element[0].querySelectorAll("[tabindex]");
                var len = els.length;
                var currentIndex;
                element.bind("keydown", function (e) {
                    if (e.keyCode === 13) {
                        var t = angular.element(element[0].querySelector(":focus")).attr("tabindex");
                        var t = parseInt(t);

                        var next;
                        if (t === len) {
                            next = 1;
                        } else {
                            next = t + 1;
                        }
                        scope.trigger = next;
                        scope.$apply();
                    }
                });
                scope.$watch('trigger', function (value) {
                    currentIndex = parseInt(value);
                    $timeout(function () {
                        element[0].querySelector("[tabindex=\"" + value + "\"]").focus();
                    });
                });
            }
        };
    })

    .filter('time', function ($filter) {

        return function (time) {

            var date = new Date();
            date.setTime(time);
            var now = new Date();

            if (date.getFullYear() !== now.getFullYear()) {
                return $filter('date')(date, "yyyy");
            }

            if (date.getMonth() !== now.getMonth() || date.getDate() !== now.getDate()) {
                return $filter('date')(date, "MM/dd");
            }

            return $filter('date')(date, "H:m");

        }
    })

    .factory('$offset', function ($document, $window) {
        return function (element) {
            var boundingClientRect = element[0].getBoundingClientRect();
            return {
                width: boundingClientRect.width || element.prop('offsetWidth'),
                height: boundingClientRect.height || element.prop('offsetHeight'),
                top: boundingClientRect.top + ($window.pageYOffset || $document[0].documentElement.scrollTop),
                left: boundingClientRect.left + ($window.pageXOffset || $document[0].documentElement.scrollLeft)
            };
        }
    })

    .factory("query", function ($http, $q, $rootScope) {

        function query(name, params_) {

            var params;
            try{
                params = JSON.stringify(params_);
            }catch(err){}

            var defer = $q.defer();
            var args = {
                name:name
            }

            if(params){
                args.params = params;
            }

            $http.get("/query", {params: args}).success(function (rs) {
                defer.resolve(rs);
            });
            return defer.promise;
        }

        return query;
    })

    .factory("core", function ($http, $q) {

        var core = {
            exec: function (commandName, args) {
                var defer = $q.defer();
                args = args || {};
                $http.post("/exec", args, {params: {commandName: commandName}}).success(function (rs) {
                    defer.resolve(rs);
                })
                return defer.promise;
            },
            call: function (methodName, id, args) {
                var defer = $q.defer();
                args = args || [];
                $http.post("/call", args, {params: {methodName: methodName, id: id}}).success(function (rs) {
                    defer.resolve(rs);
                })
                return defer.promise;
            }
        }

        return core;
    })

    .controller("navbar_ctrl", function ($scope, $modal, $http, $rootScope) {

        $scope.openLoginDialog = function () {
            $modal.open({
                templateUrl: '/template/login.html',
                controller: "loginCtrl"
            });
        };

        $scope.openRegDialog = function () {
            $modal.open({
                templateUrl: '/template/reg.html',
                controller: "regCtrl"
            });
        };

        $scope.logout = function () {
            $http.post("/identity/logout").success(function () {
                $rootScope.loginUser = null;
            })
        };

    })

    .controller("loginCtrl", function ($scope, $modalInstance, $http, $rootScope) {

        $scope.data = {}

        $modalInstance.opened.then(function () {
            $scope.tabindex = "1";
        })

        $scope.close = function () {
            $modalInstance.dismiss('cancel');
        }

        $scope.login = function () {
            $http.post("/identity/login", $scope.data).success(function (result) {
                if (result.errors) {
                    $rootScope.refreshNum();
                    $scope.errors = result.errors;
                } else {
                    $scope.close();
                    $rootScope.checkLogined();
                }
            });
        }

        $scope.findPassword = function () {
            $http.post("/user/find_password", {
                email: $scope.data.email
            }).success(function (data) {
                    if(data){
                        alert(data);
                    }else{
                        alert("请到"+$scope.data.email+"查看")
                    }
                })
        }
    })

    .controller("regCtrl", function ($scope, $modalInstance, $http, $rootScope) {

        $scope.data = {}

        $modalInstance.opened.then(function () {
            $scope.tabindex = "1";
        });

        $scope.close = function () {
            $modalInstance.dismiss('cancel');
        }

        $scope.reg = function () {
            $http.post("/identity/reg", $scope.data).success(function (result) {
                if (result.errors) {
                    $rootScope.refreshNum();
                    $scope.errors = result.errors;
                } else {
                    $scope.close();
                    $rootScope.checkLogined();
                }
            });
        }

    })

    .controller("messageCtrl", function ($scope, $http, $modalInstance, core, $rootScope, query) {

        $scope.data = {};

        $scope.close = function () {
            $modalInstance.dismiss('cancel');
        }

        $scope.send = function () {

            var target = $rootScope.users[$scope.userId];
            if (!target) {
                query("get a user by id", {id: $scope.userId}).then(function (u) {
                    if (u) {
                        target = u;
                        $rootScope.users[u.id] = u;
                        done()
                    } else {
                        $scope.close();
                    }
                })
            } else {
                done();
            }

            function done() {
                $scope.data.body += " @" + target.nickname;
                core.exec("send message", $scope.data);
                $scope.close();
                setTimeout(function () {
                    alert("私信发送成功！")
                })
            }
        }
    })