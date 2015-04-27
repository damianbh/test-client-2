/**
 * @ngdoc function
 * @name testClientGulp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the testClientGulp
 */
angular.module('testClientGulp')
  .controller('HomeCtrl', function ($scope, $http, loader, ModalService, security, config, socket) {
    'use strict';
    var
      self = this,
      roles = security.getSecurityData().roles || [];

    self.security = security;
    self.CAS_URL = config.CAS_URL;
    self.list = [{
      state: 'help',
      iconCls: 'icon-question',
      label: 'Help'
    }];
    if (_.intersection(['manager'], roles).length) {
      self.list.push({
        state: 'clients',
        iconCls: 'icon-user-tie',
        label: 'Clients'
      });
    }

    if (_.intersection(['human_resources'], roles).length) {
      self.list.push(
        {
          state: 'providers',
          iconCls: 'icon-truck',
          label: 'Providers'
        }
      );
    }

    self.on = {
      doLogout: function () {
        ModalService.showModal({
          templateUrl: '/views/modalConfirm.html',
          controller: 'ModalCtrl',
          inputs: {
            title: 'Are you sure you want to logout?',
            buttons: {
              yes: {
                type: 'primary',
                text: 'Yes'
              },
              no: {
                type: 'default',
                text: 'No'
              }
            },
            message: 'You will be logged out of the Central Authorization Server which means' +
            ' your session will be terminated in this and all other Applications linked to Authorization Server.'
          }
        }).then(function (modal) {
          modal.close.then(function (result) {
            switch (result) {
              case 'yes':
                loader.invasiveVisible();
                $http.get(config.CAS_URL + '/logout').then(
                  function () {
                    loader.invasiveInvisible();
                    socket.emit('logout');
                    window.location = '/';
                  }
                );
                break;

              default:

            }
          });
        });

      }
    };

  });
