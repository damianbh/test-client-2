/**
 * @ngdoc function
 * @name testClientGulp.controller:AppCtrl
 * @description
 * # AppCtrl
 * Controller of the testClientGulp
 */
angular.module('testClientGulp')
  .controller('LoginCtrl', function ($scope, loader, $http, security, config, routing, socket, ModalService) {
    'use strict';

    var
      self = this;

    self.model = {};

    self.on = {
      doLogin: function (valid) {

        if (self.saving || !valid) {
          return;
        }

        self.saving = true;
        loader.invasiveVisible();
        return $http.post(config.CAS_URL + '/login', _.extend({ajaxCall: '1'}, self.model)).then(function (resp) {
          socket.emit('login');
          security.setSecurityData(resp.data);
          return routing.go2State('help');
        }).catch(function (resp) {
          self.model.password = '';
          switch (resp.status) {
            case 400:
              //$scope.loginForm['password'].$setValidity('invalid-credentials', false);
              //if (!$scope.loginForm['password'].$validators['invalid-credentials']) {
              //  $scope.loginForm['password'].$validators['invalid-credentials'] = function () {
              //    return true;
              //  };
              //}
              ModalService.showModal({
                templateUrl: '/views/modalError.html',
                controller: 'ModalCtrl',
                inputs: {
                  title: 'Invalid Credentials',
                  buttons: {
                    ok: {
                      type: 'primary',
                      text: 'Close'
                    }
                  },
                  message: 'Please provide a valid combination of User and Password in order to successfully login into the system'
                }
              }).then(function (modal) {
                modal.close.then(function (result) {
                  switch (result) {
                    case 'ok':

                      break;

                    default:

                  }
                });
              });
              break;
            default:

              break;
          }
        }).finally(function () {
          self.saving = false;
          loader.invasiveInvisible();
        });
      }
    };


  });
