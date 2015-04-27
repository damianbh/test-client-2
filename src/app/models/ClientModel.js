angular.module('testClientGulp')
  .factory('ClientModel', function ($resource, config) {
    'use strict';

    return $resource(config.API_URL + 'api/clients/:id', {id: '@id'});
  });
