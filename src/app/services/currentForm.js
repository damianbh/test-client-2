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
