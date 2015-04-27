angular.module('testClientGulp')
  .service('socket', function (config, security, ModalService, loader) {
    'use strict';

    var
      self = this,
      socket,
      loginDlgActive = false;

    self.init = function () {
      socket = io.connect(config.CAS_URL);
      socket.on('connect', function () {
        socket.emit('new_connection', {session: security.getSession()});
      });

      socket.on('login', function () {
        if (!loginDlgActive) {
          loginDlgActive = true;
          ModalService.showModal({
            templateUrl: '/views/modalConfirm.html',
            controller: 'ModalCtrl',
            inputs: {
              title: 'Login Detected',
              buttons: {
                yes: {
                  type: 'primary',
                  text: 'Yes, refresh page now'
                },
                no: {
                  type: 'default',
                  text: 'No, I will refresh page manually later'
                }
              },
              message: 'It seems you have logged into the Central Authorization Server.' +
              'Do you want to refresh the page to be according your user rights?'
            }
          }).then(function (modal) {
            modal.close.then(function (result) {
              switch (result) {
                case 'yes':
                  loader.invasiveVisible();
                  window.location = '/';
                  break;

                default:

              }
            });
          });
        }

      });

      socket.on('logout', function () {
        window.location = '/';
      });
    };

    self.emit = function (event) {
      var data = {
        session: security.getSession()
      };
      socket.emit(event, data);
    };
  });
