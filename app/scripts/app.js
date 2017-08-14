'use strict';

/**
 * @ngdoc overview
 * @name netWorkBenchApp
 * @description
 * # netWorkBenchApp
 *
 * Main module of the application.
 */

var netWorkBenchApp = angular
  .module('netWorkBenchApp', [
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
      .when('/nlp', {
        templateUrl: '../views/nlp.html',
        controller: 'NLPCtrl',
        controllerAs: 'nlp'
      })
      .otherwise({
        redirectTo: '/'
      });
  }
);


//Internet Explorer solution???
netWorkBenchApp.config(['$httpProvider', function ($httpProvider) {

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

}
]);


netWorkBenchApp.service('sharedProperties', function () {
  // this service is going to act as a general global variable throughout the application
  // should consider implementing some degree of relationship with localStorage to guard against
  // refreshes. In fact, we might just use cookies or something else because we may not want this to be permanent


  return {
    getCurrentNetworkId: function () {
      //if (!this.currentNetworkId) this.currentNetworkId = "C25R1174";   // hardwired for testing
      return this.currentNetworkId;
    },
    setCurrentNetworkId: function (value) {
      //should save in local storage
      this.currentNetworkId = value;
    },
    getCurrentUserId: function () {
      //if (!this.currentUserId) this.currentUserId = "C31R4";   // hardwired for testing
      return this.currentUserId;
    },
    setCurrentUserId: function (currentUserId) {
      this.currentUserId = currentUserId;
    },
    getCurrentUserAccountName: function () {
      return this.accountName;
    },
    setCurrentUser: function (value, accountName) {
      this.currentUserId = value;
      this.accountName = accountName;
    }
  };
});

