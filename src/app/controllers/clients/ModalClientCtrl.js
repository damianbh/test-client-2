/**
 * @ngdoc function
 * @name testClientGulp.controller:AppCtrl
 * @description
 * # AppCtrl
 * Controller of the testClientGulp
 */
angular.module('testClientGulp')
  .controller('ModalClientCtrl', function ($scope, $rootScope, client, providers, loader, currentForm, close) {
    'use strict';
    var
      self = this;

    $scope.providers = providers;
    if (!_.isArray(client.Providers)) {
      client.Providers = [];
    }

    self.model = client;

    self.title = (client.id ? 'Edit Client' : 'New Client');

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
        currentForm.setFrm($scope.clientForm);
        return client.$save().then(function () {
          $rootScope.$broadcast('$saved-client', client, isEdit);
          close('saved');

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
