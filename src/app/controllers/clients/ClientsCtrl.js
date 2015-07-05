/**
 * @ngdoc function
 * @name testClientGulp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the testClientGulp
 */
angular.module('testClientGulp')
  .controller('ClientsCtrl', function ($scope, callServer, ClientModel, loader, ModalService, ProviderModel, $q) {
    'use strict';
    var ctrl = this;


    $scope.$on('$saved-client', function (event, client, isEdit) {
      if (isEdit) {
        var index = _.findIndex(ctrl.smartTable.rowCollection, function (item) {
          return (item.id === client.id);
        });
        if (index !== -1) {
          ctrl.smartTable.rowCollection.splice(index, 1, client);
        }
      } else {
        ctrl.smartTable.rowCollection.splice(0, 0, client);
      }
      client.$isSelected = true;
    });

    ctrl.callServer = _.partial(callServer, {ctrl: ctrl, Resource: ClientModel, qf: 'name,email,phone'});
    ctrl.on = {
      newOptsClick: function () {
        var providers = ProviderModel.query();
        loader.invasiveVisible();
        providers.$promise.then(function () {
          ModalService.showModal({
            templateUrl: '/views/clients/clientDlg.html',
            controller: 'ModalClientCtrl as ModalClient',
            inputs: {
              client: new ClientModel(),
              providers: providers
            }
          });
        }).finally(function () {
          loader.invasiveInvisible();
        });

      },
      viewOptsClick: function (row) {
        var
          client = ClientModel.get({id: row.id});

        loader.invasiveVisible();
        client.$promise.then(function () {
          ModalService.showModal({
            templateUrl: '/views/clients/clientViewDlg.html',
            controller: 'ModalClientViewCtrl as ModalClientView',
            inputs: {
              client: client
            }
          });
        })
        //  .catch(function (resp) {
        //  errorService.showError(resp);
        //})
          .finally(function () {
          loader.invasiveInvisible();
        });
      },
      editOptsClick: function (row) {
        var
          client = ClientModel.get({id: row.id}),
          providers = ProviderModel.query();
        loader.invasiveVisible();
        $q.all([client.$promise, providers.$promise]).then(function () {
          ModalService.showModal({
            templateUrl: '/views/clients/clientDlg.html',
            controller: 'ModalClientCtrl as ModalClient',
            inputs: {
              client: client,
              providers: providers
            }
          });
        })
        //  .catch(function (resp) {
        //  errorService.showError(resp);
        //})
          .finally(function () {
          loader.invasiveInvisible();
        });

      },
      deleteOptsClick: function (client) {
        ModalService.showModal({
          templateUrl: '/views/modalConfirm.html',
          controller: 'ModalCtrl',
          inputs: {
            title: 'Are you sure you want to delete client?',
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
            message: 'Once Deleted, you will not be able to recover it.'
          }
        }).then(function (modal) {
          modal.close.then(function (result) {
            switch (result) {
              case 'yes':
                loader.invasiveVisible();
                client.$delete().then(function () {
                  ctrl.smartTable.api.slice(0, ctrl.smartTable.resultsPerPage);
                }).finally(function () {
                  loader.invasiveInvisible();
                });
                break;

              default:

            }
          });
        });
      }
    };
  });
