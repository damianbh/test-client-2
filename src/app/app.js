angular.module('testClientGulp', [
  'ngAnimate',
  'ngSanitize',
  'ngTouch',
  'ngResource',
  'ngMessages',
  'ui.router',
  'ui.bootstrap',
  'angularModalService',
  'smart-table',
  'ui.select'
])
  .constant('DEFAULT_STATE', 'help')
  .config(function ($httpProvider) {
    'use strict';
    $httpProvider.interceptors.push('httpInterceptor');

  })
  .run(function ($rootScope, routing, security, ModalService, loader, DEFAULT_STATE, socket) {
    'use strict';
    $rootScope.$on('$stateChangeStart',
      function (event, toState, toParams, fromState, fromParams) {
        ModalService.closeAll();

        if (toState.name !== 'base.login') {
          if (!security.getTicket()) {
            event.preventDefault();
            routing.go2State('login');
          } else {
            var
              roles = security.getSecurityData().roles;

            if (_.isArray(toState.roles) && (_.intersection(roles, toState.roles).length === 0)) {
              event.preventDefault();
              routing.go2State(DEFAULT_STATE);
            } else {
              loader.nonInvasiveVisible();
            }

          }
        }
      });

    $rootScope.$on('$stateChangeSuccess',
      function (event, toState, toParams, fromState, fromParams) {
        loader.nonInvasiveInvisible();
      }
    );

    $rootScope.$on('$stateChangeError',
      function (event, toState, toParams, fromState, fromParams) {
        loader.nonInvasiveInvisible();
      }
    );

    socket.init();
  });

(function bootstrap() {
  function createXMLHttpRequest() {
    try {
      return new XMLHttpRequest();
    } catch (e) {
    }
    try {
      return new ActiveXObject('Msxml2.XMLHTTP');
    } catch (e) {
    }
    alert('XMLHttpRequest not supported');
    return null;
  }

  function bootstrapApplication() {
    angular.element(document).ready(function () {
      angular.bootstrap(document, ['testClientGulp']);
    });
  }

  var xhReqConfig = createXMLHttpRequest();
  xhReqConfig.open('GET', '/assets/config.json', true);
  xhReqConfig.onreadystatechange = function () {
    if (xhReqConfig.readyState != 4) {
      return;
    }

    if (xhReqConfig.status != 200) {
      alert('Error Loading System Configuration');
      return;
    }
    $config = angular.fromJson(xhReqConfig.responseText);

    var xhReqSecurity = createXMLHttpRequest();
    xhReqSecurity.open('GET', $config.CAS_URL + '/validate', true);
    xhReqSecurity.withCredentials = true;

    xhReqSecurity.onreadystatechange = function () {
      if (xhReqSecurity.readyState != 4) {
        return;
      }
      $security = {};
      switch (xhReqSecurity.status) {
        case 200:
          $security = angular.fromJson(xhReqSecurity.responseText);
          bootstrapApplication();
          break;
        case 401:
          $security = {
            session: angular.fromJson(xhReqSecurity.responseText).session
          };
          bootstrapApplication();
          break;
        default:
          alert('Error Communicating with CAS Server. Please check your internet connection and CAS Server status. Also check if this Application is in CAS Server allowed Origins.');
          break;
      }
    };
    xhReqSecurity.send(null);
  };
  xhReqConfig.send(null);
})();
