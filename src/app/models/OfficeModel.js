angular.module('testClientGulp')
  .factory('OfficeModel', function ($resource, config) {
    'use strict';

    return $resource(config.API_URL + 'api/offices/:id', {id: '@id'});
  });
