'use strict';

/**
 * @ngdoc service
 * @name netWorkBenchApp.CyjsService
 * @description
 * # CyjsService
 * Factory in the netWorkBenchApp.
 */
angular.module('netWorkBenchApp')
  .factory('CyjsService', function () {
    // Service logic
    // ...

    var meaningOfLife = 42;

    // Public API here
    return {
      someMethod: function () {
        return meaningOfLife;
      }
    };
  });
