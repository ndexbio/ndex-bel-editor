'use strict';

/**
 * @ngdoc overview
 * @name belPlus2App
 * @description
 * # belPlus2App
 *
 * Main module of the application.
 */



var belPlus2App = angular
  .module('belPlus2App', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ui.bootstrap',
    'ngDraggable'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .when('/edit', {
        templateUrl: 'views/edit.html',
        controller: 'EditCtrl',
        controllerAs: 'edit'
      })
      .when('/edit/:networkId', {
        templateUrl: 'views/edit.html',
        controller: 'EditCtrl',
        controllerAs: 'edit'
      })
      .when('/reach', {
        templateUrl: 'views/reach.html',
        controller: 'ReachCtrl',
        controllerAs: 'reach'
      })
      .otherwise({
        redirectTo: '/'
      });
  }

);

//Internet Explorer solution???
belPlus2App.config(['$httpProvider', function ($httpProvider) {

  $httpProvider.defaults.useXDomain = true;

  //First, test if this is IE. If it is not, don't mess with caching.
  var ua = window.navigator.userAgent;
  var msie = ua.indexOf('MSIE ');

  if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))      // If Internet Explorer, return version number
  {
    //initialize get if not there
    if (!$httpProvider.defaults.headers.get) {
      $httpProvider.defaults.headers.get = {};
    }
    //disable IE ajax request caching
    $httpProvider.defaults.headers.get['If-Modified-Since'] = '0';
  }

}]);

