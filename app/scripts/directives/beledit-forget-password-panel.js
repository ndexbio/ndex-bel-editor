'use strict';

/**
 * @ngdoc directive
 * @name belPlus2App.directive:beleditForgetPasswordPanel
 * @description
 * # beleditForgetPasswordPanel
 */
angular.module('belPlus2App')
  .directive('beleditForgetPasswordPanel', function () {
    return {
      template: '<div></div>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        element.text('this is the beleditForgetPasswordPanel directive with attrs = ' + attrs);
      }
    };
  });
