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
