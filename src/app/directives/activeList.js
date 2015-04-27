/**
 * Created by damian on 2/23/2015.
 */
angular.module('testClientGulp')
  .directive('activeList', function () {
    'use strict';

    return {
      controller: function ($scope, routing) {

        $scope.click = function (item) {
          //var promise =
          routing.go2State(item.state);
          //if (promise) {
          //  promise.then(function () {
          //    $scope.itemList.forEach(function (item) {
          //      item.active = false;
          //    });
          //    item.active = true;
          //
          //  });
          //}
        };

        $scope.$on('$stateChangeSuccess',
          function (event, toState, toParams, fromState, fromParams) {

            for (var name in routing.routes) {
              if (routing.routes.hasOwnProperty(name) && (routing.routes[name].name == toState.name)) {
                $scope.itemList.forEach(function (item) {
                  item.active = (item.state === name);
                });
              }
            }

          }
        );
      },
      replace: true,
      template: '<ul class="{{ maincls }}">' +
      '<li ng-repeat="item in itemList" ng-class="{active:item.active,standard:!item.active}">' +
      '<a ng-click="click(item)">' +
      '<i class="{{ item.iconCls }}" ng-if="item.iconCls"></i> ' +
      '<span ng-if="item.label">{{ item.label }}</span>' +
      '</a>' +
      '</li>' +

      '<img ng-if="imgSrc" class="pull-right" style="margin-right: 20px;margin-top: -3px;" height="55px" ng-src="{{imgSrc}}" alt=""/>' +

      '</ul>',
      restrict: 'E',
      scope: {
        itemList: '=list',
        maincls: '=maincls',
        imgSrc: '=imgSrc'
      }
    };
  });
