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
