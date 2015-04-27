/**
 * @ngdoc function
 * @name testClientGulp.controller:AppCtrl
 * @description
 * # AppCtrl
 * Controller of the testClientGulp
 */
angular.module('testClientGulp')
  .controller('ModalProviderCtrl', function ($scope, $rootScope, provider, loader, errorService, close) {
    'use strict';

    var
      self = this;

    self.model = provider;

    self.title = (provider.id ? 'Edit Provider' : 'New Provider');

    self.on = {
      close: function (action) {
        close(action);
      },
      saveData: function (valid) {
        var
          isEdit = provider.id;
        if (self.saving || !valid) {
          return;
        }

        self.saving = true;
        loader.invasiveVisible();
        return provider.$save().then(function () {
          $rootScope.$broadcast('$saved-provider', provider, isEdit);
          close('saved');
        }).catch(function (resp) {
          if (resp.status === 400) {
            errorService.formError(resp, $scope.providerForm);
          }
        }).finally(function () {
          loader.invasiveInvisible();
          self.saving = false;
        });
      }
    };


  });
