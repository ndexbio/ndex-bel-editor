'use strict';

/**
 * @ngdoc service
 * @name netWorkBenchApp.BelModelService
 * @description
 * # BelModelService
 * Service in the netWorkBenchApp.
 */
angular.module('netWorkBenchApp')
  .service('BelModelService', function () {

    // This service holds the current data models representing the network that is being edited

    var BelModel = {
      statementModel: {},
      bkn: {},
      cxOutput: []

    };

    return BelModel;
  });
