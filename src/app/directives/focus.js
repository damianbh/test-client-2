/**
 * @ngdoc directive
 * @name testClientGulp.directive:msSref
 * @description
 * # msFocus
 */
angular.module('testClientGulp')
  .directive('msFocus', function ($timeout) {
    'use strict';

    return {
      restrict: 'A',

      link: function (scope, element, attrs) {
        scope.$watch(function () {
          return scope.$eval(attrs.msFocus);
        }, function (newValue) {
          if (newValue == true) {
            $timeout(function () {
              element[0].focus();
            });
          }
        });
      }
    };
  });
