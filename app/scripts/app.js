'use strict';

/**
 * @ngdoc overview
 * @name networkbenchApp
 * @description
 * # networkbenchApp
 *
 * Main module of the application.
 */
angular
  .module('networkbenchApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/edit.html',
        controller: 'EditCtrl',
        controllerAs: 'edit'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
