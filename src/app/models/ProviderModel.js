angular.module('testClientGulp')
  .factory('ProviderModel', function ($resource, config) {
    'use strict';

    return $resource(config.API_URL + 'api/providers/:id', {id: '@id'});
  });
