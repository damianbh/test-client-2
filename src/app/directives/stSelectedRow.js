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
