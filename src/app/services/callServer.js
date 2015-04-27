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
