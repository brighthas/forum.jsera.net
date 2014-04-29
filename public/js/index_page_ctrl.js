app
    .controller("index_page_ctrl",function ($scope, $modal, $http,query) {

        $scope.openCreateDialog = function () {
            $modal.open({
                templateUrl: 'template/createColumn.html',
                controller: "createColumnCtrl"
            });
        }

        $scope.openUpdateDialog = function (id) {
            var dialog = $modal.open({
                templateUrl: 'template/updateColumn.html',
                controller: "updateColumnCtrl"
            });
            dialog.id = id;
        }

    }).controller("createColumnCtrl",function ($scope, $http, $modalInstance, core) {


        $modalInstance.opened.then(function () {
            $scope.tabindex = "1";
        })

        $scope.close = function () {
            $modalInstance.dismiss('cancel');
        }

        $scope.data = {}

        $scope.create = function () {
            $http.post("/forum/columns/create",$scope.data);
            setTimeout(function () {
                window.location.reload();
            }, 1000);
        }

    }).controller("updateColumnCtrl", function ($scope, $http, $modalInstance,core,query) {

        query("get a column by id",{id:$modalInstance.id}).then(function(column){
            $scope.data = column;
        })

        $modalInstance.opened.then(function () {
            $scope.tabindex = "1";
        })

        $scope.close = function () {
            $modalInstance.dismiss('cancel');
        }


        $scope.update = function () {
            core.call("Column.updateInfo",$modalInstance.id,[$scope.data.name,$scope.data.des]);
            setTimeout(function () {
                window.location.reload();
            }, 1000);
        }

    })