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
      'responseError': function (resp) {
        var
          errorService = $injector.get('errorService');
        switch (resp.status) {
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
