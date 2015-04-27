angular.module('testClientGulp')
  .service('errorService', function (ModalService, loader) {
    'use strict';

    var
      self = this,
      codes = {
        0: 'General Network Error. Please check your internet connection, API Server status and CAS Server status.',
        100: 'CONTINUE',
        101: 'SWITCHING_PROTOCOLS',
        200: 'OK',
        201: 'CREATED',
        202: 'ACCEPTED',
        203: 'NON-AUTHORITATIVE_INFORMATION',
        204: 'NO_CONTENT',
        205: 'RESET_CONTENT',
        206: 'PARTIAL_CONTENT',
        300: 'MULTIPLE_CHOICES',
        301: 'MOVED_PERMANENTLY',
        302: 'FOUND',
        303: 'SEE_OTHER',
        304: 'NOT_MODIFIED',
        305: 'USE_PROXY',
        306: '(UNUSED)',
        307: 'TEMPORARY_REDIRECT',
        400: 'Bad Request',
        401: 'Unauthorized',
        402: 'Payment Required',
        403: 'Forbidden',
        404: 'Not Found',
        405: 'Method Not Allowed',
        406: 'Not Acceptable',
        407: 'Proxy Authentication Required',
        408: 'Request Timeout',
        409: 'Conflict',
        410: 'Gone',
        411: 'Length Required',
        412: 'Precondition Failed',
        413: 'Request Entity Too Large',
        414: 'Request Uri Too Long',
        415: 'Unsupported Media Type',
        416: 'Requested Range Not Satisfiable',
        417: 'Expectation Failed',
        422: 'Unprocessable Entity',
        500: 'Internal Server Error',
        501: 'Not Implemented',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout',
        505: 'Http Version Not Supported'
      };

    self.formError = function (response, form, fieldTrans, errorExt) {
      var
        msg = '';

      if (_.isObject(response.data) && response.data.code === 'VALIDATION_ERROR' &&
        _.isObject(response.data.errors)) {
        fieldTrans = _.isObject(fieldTrans) ? fieldTrans : {};
        _.each(_.keys(response.data.errors), function (key) {
            _.each(_.keys(response.data.errors[key]), function (errKey) {
              var
                validator = function () {
                  return true;
                };
              if (fieldTrans[key]) {
                key = fieldTrans[key];
              }
              if (form[key]) {
                form[key].$setValidity(errKey, false);
                if (!form[key].$validators[errKey]) {
                  form[key].$validators[errKey] = validator;
                }
              } else {
                msg = msg + ' Validation ' + errKey + ' failed to field ' + key;
              }
            });
          }
        );
        if (msg !== '') {
          response.data.message = response.data.message ? response.data.message : '';
          response.data.message = response.data.message + ' ' + msg;
          self.showError(response, errorExt);
        }
      } else {
        self.showError(response, errorExt);
      }

    };

    self.showError = function (response, errorExt) {

      if (response.status === 401) {
        ModalService.showModal({
          templateUrl: '/views/modalError.html',
          controller: 'ModalCtrl',
          inputs: {
            title: 'An error has occurred',
            buttons: {
              refresh: {
                type: 'primary',
                text: 'Refresh Page'
              },
              cancel: {
                type: 'default',
                text: 'Close'
              }
            },
            message: 'It seems either your session has expired or you have been logged out of the Central Authorization Server.'
          }
        }).then(function (modal) {
          modal.close.then(function (result) {
            switch (result) {
              case 'refresh':
                loader.invasiveVisible();
                window.location = '/';
                break;

              default:

            }
          });
        });
      } else {
        var
          message;

        if (_.isObject(response.data) && response.data.message) {
          message = response.data.message;
        } else {
          if (!_.isUndefined(response.status)) {
            if (!_.isObject(errorExt)) {
              errorExt = {};
            }
            var
              codExt = _.extend({}, codes, errorExt);
            message = codExt[response.status];
          }

        }

        if (!message) {
          message = 'Unknown Error';
        }

        ModalService.showModal({
          templateUrl: '/views/modalError.html',
          controller: 'ModalCtrl',
          inputs: {
            title: 'An error has occurred',
            buttons: {
              ok: {
                type: 'primary',
                text: 'Close'
              }
            },
            message: message
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
      }

    };

  });
