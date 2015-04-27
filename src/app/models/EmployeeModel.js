angular.module('testClientGulp')
  .factory('EmployeeModel', function ($resource, config) {
    'use strict';

    return $resource(config.API_URL + 'api/employees/:id', {id: '@id'});
  });
