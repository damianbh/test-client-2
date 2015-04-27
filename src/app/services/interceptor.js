angular.module('testClientGulp')
  .factory('httpInterceptor', function ($q, $injector) {
    'use strict';

    return {
      // optional method
      'request': function (config) {
        // do something on success
        var
          security = $injector.get('security'),
          ticket = security.getTicket(),
          sysConfig = $injector.get('config');
        if (config.url.indexOf(sysConfig.API_URL) === 0 || config.url.indexOf(sysConfig.CAS_URL) === 0) {
          config.withCredentials = true;
          if (ticket) {
            config.headers['Authorization'] = ticket;
            //config.headers['Authorization'] = 'Bearer ' + ticket;
          }
        }
        return config;
      },

      // optional method
      //'requestError': function(rejection) {
      // do something on error
      //if (canRecover(rejection)) {
      //  return responseOrNewPromise
      //}
      //return $q.reject(rejection);
      //},


      // optional method
      //'response': function(response) {
      // do something on success
      //return response;
      //},

      // optional method
      'responseError': function (resp) {
        // do something on error
        //if (canRecover(rejection)) {
        //  return responseOrNewPromise
        //}
        var
          //ModalService = $injector.get('ModalService'),
          errorService = $injector.get('errorService');
          //$http = $injector.get('$http'),
        //  canClose = (resp.config.loginDlgConf && resp.config.loginDlgConf.canClose);
        //if (_.isUndefined(canClose)) {
        //  canClose = true;
        //}
        switch (resp.status) {
          //case 401:
          //  return ModalService.showModal({
          //    templateUrl: '/views/modalLogin.html',
          //    controller: 'ModalLoginCtrl as ModalLogin',
          //
          //    inputs: {
          //      canClose: canClose
          //    }
          //  }).then(function (modal) {
          //    return modal.close.then(function (result) {
          //      switch (result) {
          //        case 'logged':
          //          return $http(resp.config);
          //          break;
          //
          //        default:
          //          return $q.reject(resp);
          //          break;
          //      }
          //    });
          //  });
          //  break;
          case 400:
            return $q.reject(resp);
            break;
          default:
            if (!resp.config.doNotHandleErrors) {
              errorService.showError(resp);
            }
            return $q.reject(resp);
            break;
        }


      }
    };
  });
