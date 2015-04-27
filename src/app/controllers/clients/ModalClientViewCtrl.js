/**
 * @ngdoc function
 * @name testClientGulp.controller:AppCtrl
 * @description
 * # AppCtrl
 * Controller of the testClientGulp
 */
angular.module('testClientGulp')
  .controller('ModalClientViewCtrl', function ($scope, client, $resource, config, callServer, close) {
    'use strict';
    var self = this;

    self.model = client;
    self.callServer = _.partial(callServer, {
      ctrl: self,
      Resource: $resource(config.API_URL + 'api/clients/' + client.id + '/providers'),
      qf: 'name,descr,address,phone',
      resultsPerPage: 4
    });

    self.on = {
      close: function (action) {
        close(action);
      }
    };

  });
