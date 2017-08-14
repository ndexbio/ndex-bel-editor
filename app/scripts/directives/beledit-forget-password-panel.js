'use strict';

/**
 * @ngdoc directive
 * @name netWorkBenchApp.directive:beleditForgetPasswordPanel
 * @description
 * # beleditForgetPasswordPanel
 */
angular.module('netWorkBenchApp')
  .directive('beleditForgetPasswordPanel', function () {
    return {
      template: '<div></div>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        element.text('this is the beleditForgetPasswordPanel directive with attrs = ' + attrs);
      }
    };
  });
