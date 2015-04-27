
/**
 * @ngdoc function
 * @name testClientGulp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the testClientGulp
 */
angular.module('testClientGulp')
  .controller('BaseCtrl', function ($scope, loader) {
    'use strict';
    var
      self = this;

    self.loaderSvc = loader;
  });
