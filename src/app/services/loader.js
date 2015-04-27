angular.module('testClientGulp')
  .service('loader', function () {
    'use strict';

    var
      self = this,
      nonInvasiveVisible = false,
      invasiveVisible = false;

    self.nonInvasiveVisible = function () {
      nonInvasiveVisible = true;
    };

    self.nonInvasiveInvisible = function () {
      nonInvasiveVisible = false;
    };

    self.getNonInvasiveVisible = function () {
      return nonInvasiveVisible;
    };

    self.invasiveVisible = function () {
      invasiveVisible = true;
    };

    self.invasiveInvisible = function () {
      invasiveVisible = false;
    };

    self.getInvasiveVisible = function () {
      return invasiveVisible;
    };
  });
