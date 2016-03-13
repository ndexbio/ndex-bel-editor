'use strict';

/**
 * @ngdoc service
 * @name belEditApp.BelModelService
 * @description
 * # BelModelService
 * Service in the belEditApp.
 */
angular.module('belEditApp')
  .service('BelModelService', function () {

    // This service holds the current data models representing the network that is being edited

    var BelModel = {
      statementModel: {},
      bkn: {},
      cxOutput: []

    };

    return BelModel;
  });
