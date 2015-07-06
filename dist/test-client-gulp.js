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

/**
 * @ngdoc function
 * @name testClientGulp.controller:AppCtrl
 * @description
 * # AppCtrl
 * Controller of the testClientGulp
 */
angular.module('testClientGulp')
  .controller('ModalProviderCtrl', function ($scope, $rootScope, provider, loader, currentForm, close) {
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
        currentForm.setFrm($scope.providerForm);
        return provider.$save().then(function () {
          $rootScope.$broadcast('$saved-provider', provider, isEdit);
          close('saved');
        }).finally(function () {
          loader.invasiveInvisible();
          self.saving = false;
        });
      }
    };


  });

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

/**
 * @ngdoc function
 * @name testClientGulp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the testClientGulp
 */
angular.module('testClientGulp')
  .controller('HelpCtrl', function ($scope, loader) {
    'use strict';
    var
      self = this;

  });

/**
 * @ngdoc function
 * @name testClientGulp.controller:AppCtrl
 * @description
 * # AppCtrl
 * Controller of the testClientGulp
 */
angular.module('testClientGulp')
  .controller('ModalClientViewCtrl', function ($scope, client, $resource, config, callServer, close) {
    'use strict';
    var self = this;

    self.model = client;
    self.callServer = _.partial(callServer, {
      ctrl: self,
      Resource: $resource(config.API_URL + 'api/clients/' + client.id + '/providers'),
      qf: 'name,descr,address,phone',
      resultsPerPage: 4
    });

    self.on = {
      close: function (action) {
        close(action);
      }
    };

  });

/**
 * @ngdoc function
 * @name testClientGulp.controller:AppCtrl
 * @description
 * # AppCtrl
 * Controller of the testClientGulp
 */
angular.module('testClientGulp')
  .controller('ModalClientCtrl', function ($scope, $rootScope, client, providers, loader, currentForm, close) {
    'use strict';
    var
      self = this;

    $scope.providers = providers;
    if (!_.isArray(client.Providers)) {
      client.Providers = [];
    }

    self.model = client;

    self.title = (client.id ? 'Edit Client' : 'New Client');

    self.on = {
      close: function (action) {
        close(action);
      },
      saveData: function (valid) {
        var
          isEdit = client.id;
        if (self.saving || !valid) {
          return;
        }
        self.saving = true;
        loader.invasiveVisible();
        currentForm.setFrm($scope.clientForm);
        return client.$save().then(function () {
          $rootScope.$broadcast('$saved-client', client, isEdit);
          close('saved');

        }).finally(function () {
          self.saving = false;
          loader.invasiveInvisible();
        });
        //  }
        //).catch(function (resp) {
        //    errorService.showError(resp);
        //  });

      }
    };


  });

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

angular.module('testClientGulp')
  .service('security', function ($http, errorService, config) {
    'use strict';
    var
      self = this,
      securityData = $security || {};

    //self.$promise = $http.get(config.CAS_URL + '/validate', {
    //  doNotHandleErrors: true
    //}).then(function (resp) {
    //  securityData = resp.data;
    //}).catch(function (resp) {
    //  if (resp.status !== 401) {
    //    errorService.showError(resp);
    //  }
    //});

    self.setSecurityData = function (newData) {
      securityData = newData;
    };

    self.getSecurityData = function () {
      return securityData;
    };

    self.getTicket = function () {
      return securityData && securityData.ticket;
    };

    self.getSession = function () {
      return securityData && securityData.session;
    };

  });

/**
 * @ngdoc service
 * @name testClientGulp.routing
 * @description
 * # routing
 * provider in the testClientGulp.
 */
angular.module('testClientGulp')
  .provider('routing', function ($stateProvider, $locationProvider, $urlRouterProvider, DEFAULT_STATE) {
    'use strict';

    var
      self = this;

    self.routes = {

      base: {
        name: 'base',
        abstract: true,
        controller: 'BaseCtrl as Base',
        templateUrl: '/views/base.html'
        //, resolve: {
        //  resolvedSecurity: ['security', function (security) {
        //    return security.$promise
        //  }]
        //}
      },
      login: {
        name: 'base.login',
        url: '^/login',
        controller: 'LoginCtrl as Login',
        templateUrl: '/views/login/login.html'
      },
      home: {
        name: 'base.home',
        abstract: true,
        controller: 'HomeCtrl as Home',
        templateUrl: '/views/home.html'
      },
      help: {
        name: 'base.home.help',
        url: '^/help',
        controller: 'HelpCtrl as Help',
        templateUrl: '/views/help/help.html'
      },

      clients: {
        name: 'base.home.clients',
        url: '^/clients',
        controller: 'ClientsCtrl as Clients',
        templateUrl: '/views/clients/clients.html',
        roles: ['manager']
      },
      providers: {
        name: 'base.home.providers',
        url: '^/providers',
        controller: 'ProvidersCtrl as Providers',
        templateUrl: '/views/providers/providers.html',
        roles: ['human_resources']
      }
    };

    for (var route in self.routes) {
      if (self.routes.hasOwnProperty(route)) {
        $stateProvider.state(self.routes[route]);
      }
    }

    //$locationProvider.hashPrefix('!');
    $urlRouterProvider.otherwise(DEFAULT_STATE);


    self.$get = function ($state, loader, $rootScope, ModalService, security) {
      function go2State(routeName, params, options) {
        var
          currentUrl,
          toUrl;
        if (self.routes[routeName]) {

          currentUrl = $state.href($state.current.name, $state.$current.locals.globals.$stateParams);
          toUrl = $state.href(self.routes[routeName].name, params);

          if (currentUrl !== toUrl) {
            return $state.go(self.routes[routeName].name, params, options);
          }
        } else {
          throw new Error('Non existing route.');
        }

      }

      return {
        routes: self.routes,
        go2State: go2State
      };
    };
  });

angular.module('testClientGulp')
  .service('loader', function () {
    'use strict';

    var
      self = this,
      nonInvasiveVisible = false,
      invasiveVisible = false;

    self.nonInvasiveVisible = function () {
      nonInvasiveVisible = true;
    };

    self.nonInvasiveInvisible = function () {
      nonInvasiveVisible = false;
    };

    self.getNonInvasiveVisible = function () {
      return nonInvasiveVisible;
    };

    self.invasiveVisible = function () {
      invasiveVisible = true;
    };

    self.invasiveInvisible = function () {
      invasiveVisible = false;
    };

    self.getInvasiveVisible = function () {
      return invasiveVisible;
    };
  });

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

angular.module('testClientGulp')
  .service('errorService', function (ModalService, loader, currentForm) {
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

    //self.formError = function (response, form, fieldTrans, errorExt) {
    //  var
    //    msg = '';
    //
    //  if (_.isObject(response.data) && response.data.code === 'VALIDATION_ERROR' &&
    //    _.isObject(response.data.errors)) {
    //    fieldTrans = _.isObject(fieldTrans) ? fieldTrans : {};
    //    _.each(_.keys(response.data.errors), function (key) {
    //        _.each(_.keys(response.data.errors[key]), function (errKey) {
    //          var
    //            validator = function () {
    //              return true;
    //            };
    //          if (fieldTrans[key]) {
    //            key = fieldTrans[key];
    //          }
    //          if (form[key]) {
    //            form[key].$setValidity(errKey, false);
    //            if (!form[key].$validators[errKey]) {
    //              form[key].$validators[errKey] = validator;
    //            }
    //          } else {
    //            msg = msg + ' Validation ' + errKey + ' failed to field ' + key;
    //          }
    //        });
    //      }
    //    );
    //    if (msg !== '') {
    //      response.data.message = response.data.message ? response.data.message : '';
    //      response.data.message = response.data.message + ' ' + msg;
    //      self.showError(response, errorExt);
    //    }
    //  } else {
    //    self.showError(response, errorExt);
    //  }
    //
    //};

    self.showError = function (response, errorExt) {
      var
        form,
        fieldTrans,
        msg = '';

      if (response.status === 400) {
        form = currentForm.getFrm();
        fieldTrans = currentForm.getFieldTrans();
        if (_.isObject(response.data)) {
          if (response.data.code === 'VALIDATION_ERROR' &&
            _.isObject(response.data.errors) && form) {
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
            } else {
              return;
            }
          }

          if (response.data.code === 'CONSTRAINT_ERROR') {
            response.data.message = 'Changes you are currently trying to do are restricted because of a database constraint. Most probably you are trying' +
              ' to delete data that is being used in another area of the System. More info: ' +
              response.data.message;
          }
        }


      }

      if (response.status === 401) {
        return ModalService.showModal({
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
      }
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


    };

  });

angular.module('testClientGulp')
  .factory('currentForm', function () {
    'use strict';
    var currentForm,
      fieldTrans;
    return {
      setFrm: function (newFrm) {
        currentForm = newFrm;
      },
      getFrm: function () {
        return currentForm;
      },
      setFieldTrans: function (newFieldTrans) {
        fieldTrans = newFieldTrans;
      },
      getFieldTrans: function () {
        return fieldTrans;
      }
    };

  });

angular.module('testClientGulp')
  .factory('config', function () {
    'use strict';

    return $config;

  });

//var
//  self = this;
//
//self.$promise = $http.get('/assets/config.json', {doNotHandleErrors: true}).then(function (resp) {
//  _.extend(self, resp.data);
//  return self;
//}).catch(function (resp) {
//  errorService.showError(resp, {
//    404: 'System Configuration Not Found ' + resp.config.url
//  });
//  throw new Error('Error Loading System Configuration');
//});

//, deferred = $q.defer(),
//oReq = new XMLHttpRequest();
//self.$promise = deferred.promise;
//
//function reqListener() {
//  if (oReq.status === 200) {
//    _.extend(self, angular.fromJson(this.responseText));
//    deferred.resolve(self);
//  } else {
//    deferred.reject('Error Loading System Configuration');
//  }
//
//}

//function errorListener() {
//  deferred.reject('Error Loading System Configuration');
//}

//oReq.addEventListener('error', errorListener, false);
//oReq.addEventListener('load', reqListener, false);
//oReq.open("get", "/assets/config.json", true);
//oReq.send();

angular.module('testClientGulp')
  .factory('callServer', function (config) {
    'use strict';

    return function (opts, tableState, api) {
      var
        ctrl = opts.ctrl,
        Resource = opts.Resource,
        qf = opts.qf,
        extraParams = opts.extraParams || {},
        resultsPerPage = opts.resultsPerPage || config.RESULTS_PER_PAGE;

      tableState.pagination.number = resultsPerPage;
      tableState.pagination.start = tableState.pagination.start || 0;

      ctrl.smartTable = ctrl.smartTable ? ctrl.smartTable : {};

      ctrl.smartTable.isLoading = true;

      var pagination = tableState.pagination,
        offset = pagination.start || 0,     // This is NOT the page number, but the index of item in the list that you want to use to display the table.
        limit = pagination.number || resultsPerPage,   // Number of entries showed per page.
        params = {
          q: tableState.search.predicateObject && tableState.search.predicateObject.$,
          offset: offset,
          limit: limit,
          qf: qf
        };

      if (tableState.sort.predicate) {
        params.sort = tableState.sort.predicate;
        if (tableState.sort.reverse) {
          params.sort = '-' + params.sort;
        }
      }
      Resource.query(_.extend({}, params, extraParams), function (data, headersFn) {
        var
          headers = headersFn(),
          total = headers['content-range'].split('/')[1];

        total = parseInt(total);

        ctrl.smartTable.contentRange = headers['content-range'];
        api.rowCollection = data;
        ctrl.smartTable.rowCollection = data;
        ctrl.smartTable.isLoading = false;
        ctrl.smartTable.api = api;
        ctrl.smartTable.resultsPerPage = resultsPerPage;
        tableState.pagination.numberOfPages = Math.ceil(total / limit);

        //$rootScope.$apply();
        if (ctrl.smartTable.rowCollection.length) {
          ctrl.smartTable.rowCollection[0].$isSelected = true;
        }

      }).$promise.catch(function (resp) {
          ctrl.smartTable.isLoading = false;
          tableState.pagination.numberOfPages = 0;
          //errorService.showError(resp);
        });
    };
  });

angular.module('testClientGulp')
  .factory('ProviderModel', function ($resource, config) {
    'use strict';

    return $resource(config.API_URL + 'api/providers/:id', {id: '@id'});
  });

angular.module('testClientGulp')
  .factory('OfficeModel', function ($resource, config) {
    'use strict';

    return $resource(config.API_URL + 'api/offices/:id', {id: '@id'});
  });

angular.module('testClientGulp')
  .factory('EmployeeModel', function ($resource, config) {
    'use strict';

    return $resource(config.API_URL + 'api/employees/:id', {id: '@id'});
  });

angular.module('testClientGulp')
  .factory('ClientModel', function ($resource, config) {
    'use strict';

    return $resource(config.API_URL + 'api/clients/:id', {id: '@id'});
  });

/**
 * Created by damian on 4/12/2015.
 */
angular.module('testClientGulp').filter('propsFilter', function () {
  'use strict';
  return function (items, props) {

    var out = [];

    if (angular.isArray(items)) {
      items.forEach(function (item) {
        var itemMatches = false;

        var keys = Object.keys(props);
        for (var i = 0; i < keys.length; i++) {
          var prop = keys[i];
          var text = props[prop].toLowerCase();
          if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
            itemMatches = true;
            break;
          }
        }

        if (itemMatches) {
          out.push(item);
        }
      });
    } else {
      // Let the output be the input untouched
      out = items;
    }

    return out;
  };
});

angular.module('testClientGulp')
  .directive('stSelectedRow', ['stConfig', function (stConfig) {
    'use strict';
    return {
      restrict: 'A',
      require: '^stTable',
      scope: {
        row: '=stSelectedRow'
      },
      link: function (scope, element, attr, ctrl) {

        function doSelect(newValue) {
          if (newValue === true) {
            _.each(_.without(ctrl.rowCollection, scope.row), function (item) {
              if (!_.isUndefined(item.$isSelected)) {
                item.$isSelected = false;
              }
            });
            element.addClass(stConfig.select.selectedClass);
          } else {
            element.removeClass(stConfig.select.selectedClass);
          }
        }

        element.bind('click', function () {
          scope.$apply(function () {
            scope.row.$isSelected = true;
          });
        });

        doSelect(scope.row.$isSelected);

        scope.$watch('row.$isSelected', function (newValue) {
          doSelect(newValue);
        });
      }
    };
  }]);

/**
 * @ngdoc directive
 * @name testClientGulp.directive:msSref
 * @description
 * # msFocus
 */
angular.module('testClientGulp')
  .directive('msFocus', function ($timeout) {
    'use strict';

    return {
      restrict: 'A',

      link: function (scope, element, attrs) {
        scope.$watch(function () {
          return scope.$eval(attrs.msFocus);
        }, function (newValue) {
          if (newValue == true) {
            $timeout(function () {
              element[0].focus();
            });
          }
        });
      }
    };
  });

/**
 * Created by damian on 2/23/2015.
 */
angular.module('testClientGulp')
  .directive('activeList', function () {
    'use strict';

    return {
      controller: function ($scope, routing) {

        $scope.click = function (item) {
          //var promise =
          routing.go2State(item.state);
          //if (promise) {
          //  promise.then(function () {
          //    $scope.itemList.forEach(function (item) {
          //      item.active = false;
          //    });
          //    item.active = true;
          //
          //  });
          //}
        };

        $scope.$on('$stateChangeSuccess',
          function (event, toState, toParams, fromState, fromParams) {

            for (var name in routing.routes) {
              if (routing.routes.hasOwnProperty(name) && (routing.routes[name].name == toState.name)) {
                $scope.itemList.forEach(function (item) {
                  item.active = (item.state === name);
                });
              }
            }

          }
        );
      },
      replace: true,
      template: '<ul class="{{ maincls }}">' +
      '<li ng-repeat="item in itemList" ng-class="{active:item.active,standard:!item.active}">' +
      '<a ng-click="click(item)">' +
      '<i class="{{ item.iconCls }}" ng-if="item.iconCls"></i> ' +
      '<span ng-if="item.label">{{ item.label }}</span>' +
      '</a>' +
      '</li>' +

      '<img ng-if="imgSrc" class="pull-right" style="margin-right: 20px;margin-top: -3px;" height="55px" ng-src="{{imgSrc}}" alt=""/>' +

      '</ul>',
      restrict: 'E',
      scope: {
        itemList: '=list',
        maincls: '=maincls',
        imgSrc: '=imgSrc'
      }
    };
  });


/**
 * @ngdoc function
 * @name testClientGulp.controller:ModalCtrl
 * @description
 * # AppCtrl
 * Controller of the testClientGulp
 */
angular.module('testClientGulp')
  .controller('ModalCtrl', function ($scope, title, buttons, message, close) {
    'use strict';
    var self = this;
    $scope.title = title;
    $scope.message = message;
    $scope.buttons = [];

    _.each(_.keys(buttons), function (key) {
      $scope.buttons.push(angular.extend({
        result: key
      }, buttons[key]));
    });

    $scope.close = function (action) {
      close(action);
    };

  });

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


/**
 * @ngdoc function
 * @name testClientGulp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the testClientGulp
 */
angular.module('testClientGulp')
  .controller('BaseCtrl', function ($scope, loader) {
    'use strict';
    var
      self = this;

    self.loaderSvc = loader;
  });

//  angularModalService.js
//
//  Service for showing modal dialogs.

/***** JSLint Config *****/
/*global angular  */
(function () {

  'use strict';

  var module = angular.module('angularModalService', []);

  module.factory('ModalService', ['$document', '$compile', '$controller', '$http', '$rootScope', '$q', '$timeout', '$templateCache',
    function ($document, $compile, $controller, $http, $rootScope, $q, $timeout, $templateCache) {

      //  Get the body of the document, we'll add the modal to this.
      var body = $document.find('body');

      function ModalService() {

        var self = this,
          closeFns = [],
          zIndex = 100;

        //  Returns a promise which gets the template, either
        //  from the template parameter or via a request to the
        //  template url parameter.
        var getTemplate = function (template, templateUrl) {
          var deferred = $q.defer();
          if (template) {
            deferred.resolve(template);
          } else if (templateUrl) {
            // check to see if the template has already been loaded
            var cachedTemplate = $templateCache.get(templateUrl);
            if (cachedTemplate !== undefined) {
              deferred.resolve(cachedTemplate);
            }
            // if not, let's grab the template for the first time
            else {
              $http({method: 'GET', url: templateUrl, cache: true})
                .then(function (result) {
                  // save template into the cache and return the template
                  $templateCache.put(templateUrl, result.data);
                  deferred.resolve(result.data);
                })
                .catch(function (error) {
                  deferred.reject(error);
                });
            }
          } else {
            deferred.reject('No template or templateUrl has been specified.');
          }
          return deferred.promise;
        };

        self.closeAll = function () {
          _.each(closeFns, function (fn) {
            fn();
          });
        };

        self.showModal = function (options) {

          //  Create a deferred we'll resolve when the modal is ready.
          var deferred = $q.defer();

          //  Validate the input parameters.
          var controller = options.controller;
          if (!controller) {
            deferred.reject('No controller has been specified.');
            return deferred.promise;
          }

          //  Get the actual html of the template.
          getTemplate(options.template, options.templateUrl)
            .then(function (template) {

              //  Create a new scope for the modal.
              var modalScope = $rootScope.$new();

              //  Create the inputs object to the controller - this will include
              //  the scope, as well as all inputs provided.
              //  We will also create a deferred that is resolved with a provided
              //  close function. The controller can then call 'close(result)'.
              //  The controller can also provide a delay for closing - this is
              //  helpful if there are closing animations which must finish first.
              var closeDeferred = $q.defer(),
                fnClose = function (result, delay) {
                  if (delay === undefined || delay === null) delay = 0;
                  $timeout(function () {
                    closeDeferred.resolve(result);
                  }, delay);
                };
              var inputs = {
                $scope: modalScope,
                close: fnClose
              };
              closeFns.push(fnClose);
              zIndex++;

              //  If we have provided any inputs, pass them to the controller.
              if (options.inputs) {
                for (var inputName in options.inputs) {
                  inputs[inputName] = options.inputs[inputName];
                }
              }

              if (!inputs['zIndex']) {
                inputs['zIndex'] = zIndex;
              }

              modalScope.zIndexStyle = {
                'z-index': inputs['zIndex']
              };


              //  Create the controller, explicitly specifying the scope to use.
              var modalController = $controller(controller, inputs),

              //  Parse the modal HTML into a DOM element (in template form).
                modalElementTemplate = angular.element(template),

              //  Compile then link the template element, building the actual element.
              //  Set the $element on the inputs so that it can be injected if required.
                linkFn = $compile(modalElementTemplate),

                modalElement = linkFn(modalScope);

              modalScope.modalElement = modalElement;
              //inputs.$element = modalElement;

              //  Finally, append the modal to the dom.
              if (options.appendElement) {
                // append to custom append element
                options.appendElement.append(modalElement);
              } else {
                // append to body when no custom append element is specified
                body.append(modalElement);
              }

              //  We now have a modal object.
              var modal = {
                controller: modalController,
                scope: modalScope,
                element: modalElement,
                close: closeDeferred.promise
              };

              //  When close is resolved, we'll clean up the scope and element.
              modal.close.then(function (result) {
                //  Clean up the scope
                modalScope.$destroy();
                //  Remove the element from the dom.
                modalElement.remove();

                closeFns = _.without(closeFns, fnClose);
                zIndex--;
              });

              deferred.resolve(modal);

            })
            .catch(function (error) {
              deferred.reject(error);
            });

          return deferred.promise;
        };

      }

      return new ModalService();
    }]);

}());

(function(module) {
try {
  module = angular.module('testClientGulp');
} catch (e) {
  module = angular.module('testClientGulp', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/views/base.html',
    '<div class="non-invasive-loader" ng-if="Base.loaderSvc.getNonInvasiveVisible()"></div><div class="invasive-loader" ng-if="Base.loaderSvc.getInvasiveVisible()"><i class="icon-spinner10"></i></div><div ui-view></div><div class="main-footer"><span class="main-footer-text pull-left">&copy; 2015 All Rights Reserved</span></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('testClientGulp');
} catch (e) {
  module = angular.module('testClientGulp', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/views/errors.html',
    '<div class="error" ng-message="required"><span popover-append-to-body="true" popover-trigger="mouseenter" popover="This field is mandatory, please fill it with proper information" class="label label-danger">Required</span></div><div class="error" ng-message="email"><span popover-append-to-body="true" popover-trigger="mouseenter" popover="This field is an email, please fill it with proper information" class="label label-danger">Invalid email address</span></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('testClientGulp');
} catch (e) {
  module = angular.module('testClientGulp', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/views/home.html',
    '<div class="main-header"><span class="user-photo"><img ng-src="{{Home.CAS_URL + Home.security.getSecurityData().image}}" alt=""></span> <span class="welcome">Welcome {{Home.security.getSecurityData().name}}</span> <i popover-trigger="mouseenter" popover="Logout" popover-placement="bottom" class="icon-cancel-circle" ng-click="Home.on.doLogout()"></i></div><active-list maincls="\'main-bar list-inline\'" list="Home.list" img-src="\'/assets/logo.png\'"></active-list><div ui-view></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('testClientGulp');
} catch (e) {
  module = angular.module('testClientGulp', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/views/modalConfirm.html',
    '<div class="modal-fade" ng-style="zIndexStyle"><div class="modal-overlay modal-confirm animated zoomIn"><div class="row"><div class="col-xs-12"><i ng-click="close(\'cancel\')" class="icon-cross"></i></div></div><div class="row"><div class="col-xs-10 margin-title"><span class="title">{{title}}</span></div></div><div class="row message-margin"><div class="col-xs-12"><span class="message">{{message}}</span></div></div><div class="row toolbar"><div class="col-xs-12"><button ng-repeat="button in buttons" class="btn pull-right btn-{{button.type}}" ms-focus="$index == 0" ng-click="close(\'{{button.result}}\')" style="margin-left: 10px">{{ button.text }}</button></div></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('testClientGulp');
} catch (e) {
  module = angular.module('testClientGulp', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/views/modalError.html',
    '<div class="modal-fade" ng-style="zIndexStyle"><div class="modal-overlay modal-error animated zoomIn"><div class="row"><div class="col-xs-12"><i ng-click="close(\'cancel\')" class="icon-cross"></i></div></div><div class="row"><div class="col-xs-12 margin-title"><span class="title-error">{{title}}</span></div></div><div class="row message-margin"><div class="col-xs-12"><div class="alert alert-danger">{{message}}</div></div></div><div class="row"><div class="col-xs-12"><button ng-repeat="button in buttons" class="btn pull-right btn-{{button.type}}" ms-focus="$index == 0" ng-click="close(\'{{button.result}}\')" style="margin-left: 10px">{{ button.text }}</button></div></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('testClientGulp');
} catch (e) {
  module = angular.module('testClientGulp', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/views/clients/clientDlg.html',
    '<div class="modal-fade" ng-style="zIndexStyle"><div class="modal-overlay animated zoomIn modify-dialog"><div class="row"><div class="col-xs-10 main-title">{{ ModalClient.title}}</div><div class="col-xs-2"><i ng-click="ModalClient.on.close(\'cancel\')" class="icon-cross"></i></div></div><form name="clientForm" role="form" novalidate ng-submit="ModalClient.on.saveData(clientForm.$valid)"><div class="form-group" ng-class="{\'has-error\': ((clientForm.$submitted || clientForm.name.$touched) && clientForm.name.$invalid),\'has-success\':clientForm.name.$valid}"><div class="errors" ng-messages="clientForm.name.$error" ng-if="clientForm.$submitted || clientForm.name.$touched" ng-messages-include="/views/errors.html"></div><label class="control-label" for="name">Name</label><input ms-focus="true" class="form-control" id="name" name="name" placeholder="Please enter First Name" ng-model="ModalClient.model.name" required></div><div class="form-group" ng-class="{\'has-error\': ((clientForm.$submitted || clientForm.email.$touched) && clientForm.email.$invalid),\'has-success\':clientForm.email.$valid}"><div class="errors" ng-messages="clientForm.email.$error" ng-if="clientForm.$submitted || clientForm.email.$touched" ng-messages-include="/views/errors.html"></div><label class="control-label" for="email">Email</label><input type="email" class="form-control" id="email" name="email" placeholder="Please enter Last Name" ng-model="ModalClient.model.email" required></div><div class="form-group" ng-class="{\'has-error\': ((clientForm.$submitted || clientForm.phone.$touched) && clientForm.phone.$invalid),\'has-success\':clientForm.phone.$valid}"><div class="errors" ng-messages="clientForm.phone.$error" ng-if="clientForm.$submitted || clientForm.phone.$touched" ng-messages-include="/views/errors.html"><div class="error" ng-message="pattern"><span popover-append-to-body="true" popover-trigger="mouseenter" popover="This field only allow numbers, please fill it with proper information" class="label label-danger">Only numbers allowed</span></div></div><label class="control-label" for="phone">Phone</label><input class="form-control" id="phone" name="phone" placeholder="Please enter Phone Number" pattern="^[0-9]*$" ng-model="ModalClient.model.phone" required></div><div class="form-group" ng-class="{\'has-error\': ((clientForm.$submitted || clientForm.Providers.$touched) && clientForm.Providers.$invalid),\'has-success\':clientForm.Providers.$valid}"><div class="errors" ng-messages="clientForm.Providers.$error" ng-if="clientForm.$submitted || clientForm.Providers.$touched" ng-messages-include="/views/errors.html"></div><label class="control-label" for="Providers">Providers</label><ui-select multiple id="Providers" name="Providers" ng-model="ModalClient.model.Providers" theme="bootstrap" close-on-select="false"><ui-select-match><div class="provider-item" popover="{{$item.address}}, Phone {{$item.phone}}" popover-trigger="mouseenter" popover-append-to-body="true"><i class="icon-truck"></i>{{$item.name}}, {{$item.descr}}</div></ui-select-match><ui-select-choices repeat="provider.id as provider in filteredProviders = (providers | propsFilter: {name: $select.search, descr: $select.search,address:$select.search, phone:$select.search} | orderBy: \'name\')"><div ng-bind-html="provider.name | highlight: $select.search"></div><small style="display:block">Description: <span ng-bind-html="\'\'+provider.descr | highlight: $select.search"></span></small> <small style="display:block">Phone: <span ng-bind-html="\'\'+provider.phone | highlight: $select.search"></span></small> <small style="display:block">Address: <span ng-bind-html="\'\'+provider.address | highlight: $select.search"></span></small></ui-select-choices></ui-select></div><div class="row toolbar"><div class="col-xs-12"><button type="submit" class="btn btn-primary pull-right">Save</button> <button type="button" class="btn btn-default pull-right" style="margin-right: 10px" ng-click="ModalClient.on.close(\'cancel\')">Cancel</button></div></div></form></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('testClientGulp');
} catch (e) {
  module = angular.module('testClientGulp', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/views/clients/clientViewDlg.html',
    '<div class="modal-fade" ng-style="zIndexStyle"><div class="modal-overlay animated zoomIn client-view-dialog"><div class="row"><div class="col-xs-10 main-title">View Client</div><div class="col-xs-2"><i ng-click="ModalClientView.on.close(\'cancel\')" class="icon-cross"></i></div></div><form name="clientForm" role="form" novalidate><div class="row"><div class="col-xs-6"><div class="form-group"><label class="control-label" for="name">Name</label><input class="form-control" id="name" name="name" disabled ng-model="ModalClientView.model.name" required></div></div><div class="col-xs-6"><div class="form-group"><label class="control-label" for="email">Email</label><input class="form-control" id="email" name="email" disabled ng-model="ModalClientView.model.email" required></div></div></div><div class="row"><div class="col-xs-6"><div class="form-group"><label class="control-label" for="phone">Phone</label><input class="form-control" id="phone" name="phone" disabled ng-model="ModalClientView.model.phone" required></div></div></div><table class="table table-striped" st-pipe="ModalClientView.callServer" st-table="ModalClientView.smartTable.rowCollection"><thead><tr><th colspan="3"><span class="main-tab-title">Providers</span></th><th colspan="2"><div class="input-group search-ctrol"><input st-search placeholder="Search" class="input-sm form-control" ng-model="globalSearch" type="search"> <span class="input-group-addon"><i class="icon-search"></i></span></div></th></tr><tr><th width="23%"><span st-sort="name" class="col-header">Name</span></th><th width="23%"><span st-sort="descr" class="col-header">Description</span></th><th width="23%"><span st-sort="phone" class="col-header">Phone</span></th><th width="23%"><span st-sort="address" class="col-header">Address</span></th><th width="8%"></th></tr></thead><tbody ng-if="!ModalClientView.smartTable.isLoading"><tr ng-repeat="row in ModalClientView.smartTable.rowCollection"><td ng-bind-html="row.name | highlight: globalSearch"></td><td ng-bind-html="row.descr | highlight: globalSearch"></td><td ng-bind-html="row.phone | highlight: globalSearch"></td><td colspan="2" ng-bind-html="row.address | highlight: globalSearch"></td></tr><tr ng-if="!ModalClientView.smartTable.rowCollection.length"><td colspan="5" class="text-center"><span>No Providers found</span></td></tr></tbody><tbody ng-if="ModalClientView.smartTable.isLoading"><tr><td colspan="5"><i class="icon-spinner10 grid-loader"></i></td></tr></tbody><tfoot ng-if="!ModalClientView.smartTable.isLoading"><tr><td colspan="5"><div class="text-center" st-pagination="" st-items-by-page="ModalClientView.smartTable.resultsPerPage"></div><small ng-if="ModalClientView.smartTable.rowCollection.length" class="content-range text-center">{{ModalClientView.smartTable.contentRange}}</small></td></tr></tfoot></table><div class="row toolbar"><div class="col-xs-12"><button type="button" ms-focus="true" class="btn btn-primary pull-right" ng-click="ModalClientView.on.close(\'cancel\')">Close</button></div></div></form></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('testClientGulp');
} catch (e) {
  module = angular.module('testClientGulp', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/views/clients/clients.html',
    '<div class="main-tab"><table class="table table-striped" st-pipe="Clients.callServer" st-table="Clients.smartTable.rowCollection"><thead><tr><th colspan="3"><span class="main-tab-title">Clients</span> <a class="add-btn" popover-trigger="mouseenter" popover="New Client" ng-click="Clients.on.newOptsClick()"><i class="icon-plus"></i></a></th><th colspan="2"><div class="input-group search-ctrol"><input st-search placeholder="Search" class="input-sm form-control" ng-model="globalSearch" type="search"> <span class="input-group-addon"><i class="icon-search"></i></span></div></th></tr><tr><th width="23%"><span st-sort="name" class="col-header">Name</span></th><th width="23%"></th><th width="23%"><span st-sort="email" class="col-header">Email</span></th><th width="23%"><span st-sort="phone" class="col-header">Phone</span></th><th width="8%"></th></tr></thead><tbody ng-if="!Clients.smartTable.isLoading"><tr ng-repeat="row in Clients.smartTable.rowCollection" st-selected-row="row"><td colspan="2" ng-bind-html="row.name | highlight: globalSearch"></td><td ng-bind-html="row.email | highlight: globalSearch"></td><td ng-bind-html="row.phone | highlight: globalSearch"></td><td><span class="dropdown" dropdown><i class="dropdown-toggle icon-menu3" dropdown-toggle></i><ul class="dropdown-menu grid-menu"><li><a href ng-click="Clients.on.editOptsClick(row)"><i class="icon-pencil"></i> <span>Edit</span></a></li><li><a href ng-click="Clients.on.deleteOptsClick(row)"><i class="icon-bin"></i> <span>Delete</span></a></li><li><a href ng-click="Clients.on.viewOptsClick(row)"><i class="icon-eye"></i> <span>View</span></a></li></ul></span></td></tr><tr ng-if="!Clients.smartTable.rowCollection.length"><td colspan="5" class="text-center"><span>No Clients found</span></td></tr></tbody><tbody ng-if="Clients.smartTable.isLoading"><tr><td colspan="5"><i class="icon-spinner10 grid-loader"></i></td></tr></tbody><tfoot ng-if="!Clients.smartTable.isLoading"><tr><td colspan="5"><div class="text-center" st-pagination="" st-items-by-page="Clients.smartTable.resultsPerPage"></div><small ng-if="Clients.smartTable.rowCollection.length" class="content-range text-center">{{Clients.smartTable.contentRange}}</small></td></tr></tfoot></table></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('testClientGulp');
} catch (e) {
  module = angular.module('testClientGulp', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/views/employees/employeeDlg.html',
    '<div class="modal-fade" ng-style="zIndexStyle"><div class="modal-overlay animated zoomIn modify-dialog"><div class="row"><div class="col-xs-10 main-title">{{ ModalEmployee.title}}</div><div class="col-xs-2"><i ng-click="ModalEmployee.on.close(\'cancel\')" class="icon-cross"></i></div></div><form name="employeeForm" role="form" novalidate ng-submit="ModalEmployee.on.saveData(employeeForm.$valid)"><div class="form-group" ng-class="{\'has-error\': ((employeeForm.$submitted || employeeForm.firstName.$touched) && employeeForm.firstName.$invalid),\'has-success\':employeeForm.firstName.$valid}"><div class="errors" ng-messages="employeeForm.firstName.$error" ng-if="employeeForm.$submitted || employeeForm.firstName.$touched" ng-messages-include="/views/errors.html"></div><label class="control-label" for="firstName">First Name</label><input ms-focus="true" class="form-control" id="firstName" name="firstName" placeholder="Please enter First Name" ng-model="ModalEmployee.model.firstName" required></div><div class="form-group" ng-class="{\'has-error\': ((employeeForm.$submitted || employeeForm.lastName.$touched) && employeeForm.lastName.$invalid),\'has-success\':employeeForm.lastName.$valid}"><div class="errors" ng-messages="employeeForm.lastName.$error" ng-if="employeeForm.$submitted || employeeForm.lastName.$touched" ng-messages-include="/views/errors.html"></div><label class="control-label" for="lastName">Last Name</label><input class="form-control" id="lastName" name="lastName" placeholder="Please enter Last Name" ng-model="ModalEmployee.model.lastName" required></div><div class="form-group" ng-class="{\'has-error\': ((employeeForm.$submitted || employeeForm.initials.$touched) && employeeForm.initials.$invalid),\'has-success\':employeeForm.initials.$valid}"><div class="errors" ng-messages="employeeForm.initials.$error" ng-if="employeeForm.$submitted || employeeForm.initials.$touched" ng-messages-include="/views/errors.html"><div class="error" ng-message="pattern"><span popover-append-to-body="true" popover-trigger="mouseenter" popover="This field allows only uppercase letters, no spaces, please fill it with proper information" class="label label-danger">Only uppercase letters allowed (No spaces)</span></div></div><label class="control-label" for="initials">Initials</label><input class="form-control" id="initials" name="initials" placeholder="Please enter Initials" pattern="^[A-Z]*$" ng-model="ModalEmployee.model.initials" required></div><div class="form-group" ng-class="{\'has-error\': ((employeeForm.$submitted || employeeForm.officeId.$touched) && employeeForm.officeId.$invalid),\'has-success\':employeeForm.officeId.$valid}"><div class="errors" ng-messages="employeeForm.officeId.$error" ng-if="employeeForm.$submitted || employeeForm.officeId.$touched" ng-messages-include="/views/errors.html"></div><label class="control-label" for="officeId">Office</label><ui-select id="officeId" name="officeId" required ng-model="ModalEmployee.model.officeId" theme="bootstrap" reset-search-input="false"><ui-select-match placeholder="Search Offices"><i class="icon-cross" ng-click="$event.stopPropagation();ModalEmployee.model.officeId = undefined;"></i> <span>{{$select.selected.name}}</span></ui-select-match><ui-select-choices repeat="office.id as office in offices" refresh="ModalEmployee.on.refreshOffices($select.search)" refresh-delay="0"><div ng-bind-html="office.name | highlight: $select.search"></div></ui-select-choices></ui-select></div><div class="row toolbar"><div class="col-xs-12"><button type="submit" class="btn btn-primary pull-right">Save</button> <button type="button" class="btn btn-default pull-right" style="margin-right: 10px" ng-click="ModalEmployee.on.close(\'cancel\')">Cancel</button></div></div></form></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('testClientGulp');
} catch (e) {
  module = angular.module('testClientGulp', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/views/employees/employees.html',
    '<div class="main-tab"><table class="table table-striped" st-pipe="Employees.callServer" st-table="Employees.smartTable.rowCollection"><thead><tr><th colspan="3"><span class="main-tab-title">Employees</span> <a class="add-btn" popover-trigger="mouseenter" popover="New Employee" ng-click="Employees.on.newOptsClick()"><i class="icon-plus"></i></a></th><th colspan="2"><div class="input-group search-ctrol"><input st-search placeholder="Search" class="input-sm form-control" ng-model="globalSearch" type="search"> <span class="input-group-addon"><i class="icon-search"></i></span></div></th></tr><tr><th width="23%"><span st-sort="firstName" class="col-header">First Name</span></th><th width="23%"><span st-sort="lastName" class="col-header">Last Name</span></th><th width="23%"><span st-sort="initials" class="col-header">Initials</span></th><th width="23%"><span>Office</span></th><th width="8%"></th></tr></thead><tbody ng-if="!Employees.smartTable.isLoading"><tr ng-repeat="row in Employees.smartTable.rowCollection" st-selected-row="row"><td ng-bind-html="row.firstName | highlight: globalSearch"></td><td ng-bind-html="row.lastName | highlight: globalSearch"></td><td ng-bind-html="row.initials | highlight: globalSearch"></td><td ng-bind-html="row.Office.name | highlight: globalSearch"></td><td><span class="dropdown" dropdown><i class="dropdown-toggle icon-menu3" dropdown-toggle></i><ul class="dropdown-menu grid-menu"><li><a href ng-click="Employees.on.editOptsClick(row)"><i class="icon-pencil"></i> <span>Edit</span></a></li><li><a href ng-click="Employees.on.deleteOptsClick(row)"><i class="icon-bin"></i> <span>Delete</span></a></li></ul></span></td></tr><tr ng-if="!Employees.smartTable.rowCollection.length"><td colspan="5" class="text-center"><span>No Employees found</span></td></tr></tbody><tbody ng-if="Employees.smartTable.isLoading"><tr><td colspan="5"><i class="icon-spinner10 grid-loader"></i></td></tr></tbody><tfoot ng-if="!Employees.smartTable.isLoading"><tr><td colspan="5"><div class="text-center" st-pagination="" st-items-by-page="Employees.smartTable.resultsPerPage"></div><small ng-if="Employees.smartTable.rowCollection.length" class="content-range text-center">{{Employees.smartTable.contentRange}}</small></td></tr></tfoot></table></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('testClientGulp');
} catch (e) {
  module = angular.module('testClientGulp', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/views/help/help.html',
    '<div class="help-tab"><div class="row"><div class="col-xs-12"><span class="help-tab-title">Help</span></div></div><div class="container"><p>This application has two main functionalities, Clients and Providers. Users having <code>"manager"</code> role can access Clients and Users having <code>"human_resources"</code> role can access Providers. Here are all posible users and their passwords and roles.</p></div><div class="col-xs-12"><pre class="prettyprint">\n' +
    '        [\n' +
    '          \'nestor.urquiza@gmail.com\': {\n' +
    '              password: \'nestor\',\n' +
    '              roles: [\'director\', \'human_resources\']\n' +
    '          },\n' +
    '          \'lgutierrezvalencia@krfs.com\': {\n' +
    '              password: \'lilia\',\n' +
    '              roles: [\'director\', \'human_resources\', \'manager\']\n' +
    '          },\n' +
    '          \'wmedina@krfs.com\': {\n' +
    '              password: \'williams\',\n' +
    '              roles: [\'director\', \'human_resources\', \'manager\']\n' +
    '          },\n' +
    '          \'damianbh@gmail.com\': {\n' +
    '              password: \'damianbh\',\n' +
    '              roles: [\'human_resources\', \'manager\']\n' +
    '          },\n' +
    '          \'alejandro@gmail.com\': {\n' +
    '              password: \'alejandro\',\n' +
    '              roles: [\'director\', \'manager\']\n' +
    '          }\n' +
    '        ]\n' +
    '      </pre></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('testClientGulp');
} catch (e) {
  module = angular.module('testClientGulp', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/views/offices/officeDlg.html',
    '<div class="modal-fade" ng-style="zIndexStyle"><div class="modal-overlay animated zoomIn modify-dialog"><div class="row"><div class="col-xs-10 main-title">{{ ModalOffice.title}}</div><div class="col-xs-2"><i ng-click="ModalOffice.on.close(\'cancel\')" class="icon-cross"></i></div></div><form name="officeForm" role="form" novalidate ng-submit="ModalOffice.on.saveData(officeForm.$valid)"><div class="form-group" ng-class="{\'has-error\': ((officeForm.$submitted || officeForm.name.$touched) && officeForm.name.$invalid),\'has-success\':officeForm.name.$valid}"><div class="errors" ng-messages="officeForm.name.$error" ng-if="officeForm.$submitted || officeForm.name.$touched" ng-messages-include="/views/errors.html"><div class="error" ng-message="name_must_be_unique"><span popover-append-to-body="true" popover-trigger="mouseenter" popover="Office name already exists. Please provide an Office name that\'s not already registered" class="label label-danger">Office name must be unique</span></div></div><label class="control-label" for="name">Name</label><input ms-focus="true" class="form-control" id="name" name="name" placeholder="Please enter Office Name" ng-model="ModalOffice.model.name" required></div><div class="row toolbar"><div class="col-xs-12"><button type="submit" class="btn btn-primary pull-right">Save</button> <button type="button" class="btn btn-default pull-right" style="margin-right: 10px" ng-click="ModalOffice.on.close(\'cancel\')">Cancel</button></div></div></form></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('testClientGulp');
} catch (e) {
  module = angular.module('testClientGulp', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/views/offices/offices.html',
    '<div class="main-tab"><table class="table table-striped" st-pipe="Offices.callServer" st-table="Offices.smartTable.rowCollection"><thead><tr><th colspan="3"><span class="main-tab-title">Offices</span> <a class="add-btn" popover-trigger="mouseenter" popover="New Office" ng-click="Offices.on.newOptsClick()"><i class="icon-plus"></i></a></th><th colspan="2"><div class="input-group search-ctrol"><input st-search placeholder="Search" class="input-sm form-control" ng-model="globalSearch" type="search"> <span class="input-group-addon"><i class="icon-search"></i></span></div></th></tr><tr><th width="23%"><span st-sort="id" class="col-header">Id</span></th><th width="23%"><span st-sort="name" class="col-header">Name</span></th><th width="23%"></th><th width="23%"></th><th width="8%"></th></tr></thead><tbody ng-if="!Offices.smartTable.isLoading"><tr ng-repeat="row in Offices.smartTable.rowCollection" st-selected-row="row"><td>{{row.id}}</td><td colspan="3" ng-bind-html="row.name | highlight: globalSearch"></td><td><span class="dropdown" dropdown><i class="dropdown-toggle icon-menu3" dropdown-toggle></i><ul class="dropdown-menu grid-menu"><li><a href ng-click="Offices.on.editOptsClick(row)"><i class="icon-pencil"></i> <span>Edit</span></a></li><li><a href ng-click="Offices.on.deleteOptsClick(row)"><i class="icon-bin"></i> <span>Delete</span></a></li></ul></span></td></tr><tr ng-if="!Offices.smartTable.rowCollection.length"><td colspan="5" class="text-center"><span>No Offices found</span></td></tr></tbody><tbody ng-if="Offices.smartTable.isLoading"><tr><td colspan="5"><i class="icon-spinner10 grid-loader"></i></td></tr></tbody><tfoot ng-if="!Offices.smartTable.isLoading"><tr><td colspan="5"><div class="text-center" st-pagination="" st-items-by-page="Offices.smartTable.resultsPerPage"></div><small ng-if="Offices.smartTable.rowCollection.length" class="content-range text-center">{{Offices.smartTable.contentRange}}</small></td></tr></tfoot></table></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('testClientGulp');
} catch (e) {
  module = angular.module('testClientGulp', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/views/providers/providerDlg.html',
    '<div class="modal-fade" ng-style="zIndexStyle"><div class="modal-overlay animated zoomIn modify-dialog"><div class="row"><div class="col-xs-10 main-title">{{ ModalProvider.title}}</div><div class="col-xs-2"><i ng-click="ModalProvider.on.close(\'cancel\')" class="icon-cross"></i></div></div><form name="providerForm" role="form" novalidate ng-submit="ModalProvider.on.saveData(providerForm.$valid)"><div class="form-group" ng-class="{\'has-error\': ((providerForm.$submitted || providerForm.name.$touched) && providerForm.name.$invalid),\'has-success\':providerForm.name.$valid}"><div class="errors" ng-messages="providerForm.name.$error" ng-if="providerForm.$submitted || providerForm.name.$touched" ng-messages-include="/views/errors.html"><div class="error" ng-message="name_must_be_unique"><span popover-append-to-body="true" popover-trigger="mouseenter" popover="Provider name already exists. Please provide a Provider name that\'s not already registered" class="label label-danger">Provider name must be unique</span></div></div><label class="control-label" for="name">Name</label><input ms-focus="true" class="form-control" id="name" name="name" placeholder="Please enter Provider Name" ng-model="ModalProvider.model.name" required></div><div class="form-group" ng-class="{\'has-error\': ((providerForm.$submitted || providerForm.descr.$touched) && providerForm.descr.$invalid),\'has-success\':providerForm.descr.$valid}"><div class="errors" ng-messages="providerForm.descr.$error" ng-if="providerForm.$submitted || providerForm.descr.$touched" ng-messages-include="/views/errors.html"></div><label class="control-label" for="descr">Description</label><input class="form-control" id="descr" name="descr" placeholder="Please enter Provider Description" ng-model="ModalProvider.model.descr" required></div><div class="form-group" ng-class="{\'has-error\': ((providerForm.$submitted || providerForm.phone.$touched) && providerForm.phone.$invalid),\'has-success\':providerForm.phone.$valid}"><div class="errors" ng-messages="providerForm.phone.$error" ng-if="providerForm.$submitted || providerForm.phone.$touched" ng-messages-include="/views/errors.html"></div><label class="control-label" for="phone">Phone</label><input class="form-control" id="phone" name="phone" placeholder="Please enter Provider Phone" ng-model="ModalProvider.model.phone" required></div><div class="form-group" ng-class="{\'has-error\': ((providerForm.$submitted || providerForm.address.$touched) && providerForm.address.$invalid),\'has-success\':providerForm.address.$valid}"><div class="errors" ng-messages="providerForm.address.$error" ng-if="providerForm.$submitted || providerForm.address.$touched" ng-messages-include="/views/errors.html"></div><label class="control-label" for="address">Address</label><input class="form-control" id="address" name="address" placeholder="Please enter Provider Address" ng-model="ModalProvider.model.address" required></div><div class="row toolbar"><div class="col-xs-12"><button type="submit" class="btn btn-primary pull-right">Save</button> <button type="button" class="btn btn-default pull-right" style="margin-right: 10px" ng-click="ModalProvider.on.close(\'cancel\')">Cancel</button></div></div></form></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('testClientGulp');
} catch (e) {
  module = angular.module('testClientGulp', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/views/providers/providers.html',
    '<div class="main-tab"><table class="table table-striped" st-pipe="Providers.callServer" st-table="Providers.smartTable.rowCollection"><thead><tr><th colspan="3"><span class="main-tab-title">Providers</span> <a class="add-btn" popover-trigger="mouseenter" popover="New Provider" ng-click="Providers.on.newOptsClick()"><i class="icon-plus"></i></a></th><th colspan="2"><div class="input-group search-ctrol"><input st-search placeholder="Search" class="input-sm form-control" ng-model="globalSearch" type="search"> <span class="input-group-addon"><i class="icon-search"></i></span></div></th></tr><tr><th width="23%"><span st-sort="name" class="col-header">Name</span></th><th width="23%"><span st-sort="descr" class="col-header">Description</span></th><th width="23%"><span st-sort="phone" class="col-header">Phone</span></th><th width="23%"><span st-sort="address" class="col-header">Address</span></th><th width="8%"></th></tr></thead><tbody ng-if="!Providers.smartTable.isLoading"><tr ng-repeat="row in Providers.smartTable.rowCollection" st-selected-row="row"><td ng-bind-html="row.name | highlight: globalSearch"></td><td ng-bind-html="row.descr | highlight: globalSearch"></td><td ng-bind-html="row.phone | highlight: globalSearch"></td><td ng-bind-html="row.address | highlight: globalSearch"></td><td><span class="dropdown" dropdown><i class="dropdown-toggle icon-menu3" dropdown-toggle></i><ul class="dropdown-menu grid-menu"><li><a href ng-click="Providers.on.editOptsClick(row)"><i class="icon-pencil"></i> <span>Edit</span></a></li><li><a href ng-click="Providers.on.deleteOptsClick(row)"><i class="icon-bin"></i> <span>Delete</span></a></li></ul></span></td></tr><tr ng-if="!Providers.smartTable.rowCollection.length"><td colspan="5" class="text-center"><span>No Providers found</span></td></tr></tbody><tbody ng-if="Providers.smartTable.isLoading"><tr><td colspan="5"><i class="icon-spinner10 grid-loader"></i></td></tr></tbody><tfoot ng-if="!Providers.smartTable.isLoading"><tr><td colspan="5"><div class="text-center" st-pagination="" st-items-by-page="Providers.smartTable.resultsPerPage"></div><small ng-if="Providers.smartTable.rowCollection.length" class="content-range text-center">{{Providers.smartTable.contentRange}}</small></td></tr></tfoot></table></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('testClientGulp');
} catch (e) {
  module = angular.module('testClientGulp', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/views/login/login.html',
    '<div class="login-page"><div class="row margin-top"><div class="col-xs-9 col-xs-offset-3 title"><h2>Please enter your Credentials</h2></div></div><div class="row margin"><div class="col-xs-3"><span class="lock"><i class="icon-lock"></i></span></div><div class="col-xs-6"><form name="loginForm" role="form" novalidate ng-submit="Login.on.doLogin(loginForm.$valid)"><div class="form-group" ng-class="{\'has-error\': ((loginForm.$submitted || loginForm.name.$touched) && loginForm.name.$invalid),\'has-success\':loginForm.name.$valid}"><div class="errors" ng-messages="loginForm.name.$error" ng-if="loginForm.$submitted || loginForm.name.$touched" ng-messages-include="/views/errors.html"><div class="error" ng-message="invalid-credentials"><span popover-append-to-body="true" popover-trigger="mouseenter" popover="Please, enter a valid User/Password combination" class="label label-danger">Invalid Credentials</span></div></div><label class="control-label" for="name">User</label><div class="input-group"><input ms-focus="true" class="form-control" id="name" name="name" placeholder="Please enter User Name" ng-model="Login.model.name" required> <span class="input-group-addon"><i class="icon-user"></i></span></div></div><div class="form-group" ng-class="{\'has-error\': ((loginForm.$submitted || loginForm.password.$touched) && loginForm.password.$invalid),\'has-success\':loginForm.password.$valid}"><div class="errors" ng-messages="loginForm.password.$error" ng-if="loginForm.$submitted || loginForm.password.$touched" ng-messages-include="/views/errors.html"></div><label class="control-label" for="password">Password</label><div class="input-group"><input type="password" class="form-control" id="password" name="password" placeholder="Please enter Password" ng-model="Login.model.password" required> <span class="input-group-addon"><i class="icon-key"></i></span></div></div><div class="row toolbar"><div class="col-xs-12"><button type="submit" class="btn btn-primary pull-right">Login</button></div></div></form></div></div></div>');
}]);
})();
