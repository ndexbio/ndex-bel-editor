'use strict';

/**
 * @ngdoc service
 * @name belEditApp.CyjsService
 * @description
 * # CyjsService
 * Factory in the belEditApp.
 */
angular.module('belEditApp')
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
