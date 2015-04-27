/**
 * @ngdoc function
 * @name testClientGulp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the testClientGulp
 */
angular.module('testClientGulp')
  .controller('ProvidersCtrl', function ($scope, $resource, callServer, ProviderModel, ModalService, loader, errorService) {
    'use strict';

    var ctrl = this;

    ctrl.callServer = _.partial(callServer, {ctrl: ctrl, Resource: ProviderModel, qf: 'name,descr,phone,address'});

    $scope.$on('$saved-provider', function (event, provider, isEdit) {
      if (isEdit) {
        var index = _.findIndex(ctrl.smartTable.rowCollection, function (item) {
          return (item.id === provider.id);
        });
        if (index !== -1) {
          ctrl.smartTable.rowCollection.splice(index, 1, provider);
        }
      } else {
        ctrl.smartTable.rowCollection.splice(0, 0, provider);
      }
      provider.$isSelected = true;
    });

    ctrl.on = {
      newOptsClick: function () {
        //console.log($scope);
        ModalService.showModal({
          templateUrl: '/views/providers/providerDlg.html',
          controller: 'ModalProviderCtrl as ModalProvider',
          inputs: {
            provider: new ProviderModel()
          }
        });
      },
      editOptsClick: function (row) {
        var
          provider = ProviderModel.get({id: row.id});
        loader.invasiveVisible();
        provider.$promise.then(function () {
          ModalService.showModal({
            templateUrl: '/views/providers/providerDlg.html',
            controller: 'ModalProviderCtrl as ModalProvider',
            inputs: {
              provider: provider
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
      deleteOptsClick: function (row) {
        ModalService.showModal({
          templateUrl: '/views/modalConfirm.html',
          controller: 'ModalCtrl',
          inputs: {
            title: 'Are you sure you want to delete provider?',
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
                row.$delete().then(function () {
                  ctrl.smartTable.api.slice(0, ctrl.smartTable.resultsPerPage);
                }).catch(function (resp) {
                  if (resp.status === 400)  {
                    if (_.isObject(resp.data) && resp.data.code === 'CONSTRAINT_ERROR'){
                      resp.data.message = 'Provider cannot be deleted because it has clients assigned';
                    }
                    errorService.showError(resp);
                  }

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
