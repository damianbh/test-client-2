angular.module('testClientGulp')
  .service('security', function ($http, errorService, config) {
    'use strict';
    var
      self = this,
      securityData = $security || {};

    //self.$promise = $http.get(config.CAS_URL + '/validate', {
    //  doNotHandleErrors: true
    //}).then(function (resp) {
    //  securityData = resp.data;
    //}).catch(function (resp) {
    //  if (resp.status !== 401) {
    //    errorService.showError(resp);
    //  }
    //});

    self.setSecurityData = function (newData) {
      securityData = newData;
    };

    self.getSecurityData = function () {
      return securityData;
    };

    self.getTicket = function () {
      return securityData && securityData.ticket;
    };

    self.getSession = function () {
      return securityData && securityData.session;
    };

  });
