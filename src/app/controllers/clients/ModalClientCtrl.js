/**
 * @ngdoc function
 * @name testClientGulp.controller:AppCtrl
 * @description
 * # AppCtrl
 * Controller of the testClientGulp
 */
angular.module('testClientGulp')
  .controller('ModalClientCtrl', function ($scope, $rootScope, client, providers, loader, errorService, $timeout, $http, close) {
    'use strict';
    var
      self = this;

    $scope.providers = providers;
    if (!_.isArray(client.Providers)) {
      client.Providers = [];
    }

    self.model = client;

    self.title = (client.id ? 'Edit Client' : 'New Client');


    //self.offices = $resource(API_URL + "api/offices/:id").query();
    self.on = {
      close: function (action) {
        close(action);
      },
      saveData: function (valid) {
        var
          isEdit = client.id;
        if (self.saving || !valid) {
          return;
        }
        self.saving = true;
        loader.invasiveVisible();
        //return $http.post(config.API_URL + 'api/clients/' + client.id + '/providers', client.Providers).then(function () {
        return client.$save().then(function () {
          $rootScope.$broadcast('$saved-client', client, isEdit);
          close('saved');

        }).catch(function (resp) {
          if (resp.status === 400) {
            errorService.formError(resp, $scope.clientForm);
          }
        }).finally(function () {
          self.saving = false;
          loader.invasiveInvisible();
        });
        //  }
        //).catch(function (resp) {
        //    errorService.showError(resp);
        //  });

      }
    };


  });
