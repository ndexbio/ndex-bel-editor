'use strict';

/**
 * @ngdoc function
 * @name belPlus2App.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the belPlus2App
 */
angular.module('belPlus2App')
  .controller(
  'MainCtrl',
  ['ndexService', '$location', '$scope', '$http',
  function (ndexService, $location, $scope, $http) {

    //---------------------------------------------
    // SignIn Handler
    //---------------------------------------------

    $scope.signIn = {};
    $scope.signIn.newUser = {};
    $scope.loggedIn = false;

    $scope.signIn.submitSignIn = function () {
      ndexService.clearUserCredentials();
      var url = ndexService.getNdexServerUri() + '/user/authenticate';
      var config =
      {
        headers: {
          'Authorization': 'Basic ' + btoa($scope.signIn.accountName + ':' + $scope.signIn.password)
        }
      };
      $http.get(url, config).
        success(function (data) // ,status, headers, config, statusText
        {
          //sharedProperties.setCurrentUser(data.externalId, data.accountName); //this info will have to be sent via emit if we want dynamic info on the nav bar
          ndexService.setUserCredentials(data.accountName, data.externalId, $scope.signIn.password);
          //$scope.$emit('LOGGED_IN'); //Angular service capability, shoot a signal up the scope tree notifying parent scopes this event occurred, see mainController
          //$location.path('/user/' + data.externalId);
          $scope.loggedIn = true;
          $scope.signIn.accountName = null;
          $scope.signIn.password = null;
        }).
        error(function (data, status) // , headers, config, statusText
        {
          if (status === 401) {
            $scope.signIn.message = 'Invalid password for user ' + $scope.signIn.accountName + '.';
          } else if (status === 404) {
            $scope.signIn.message = 'User ' + $scope.signIn.accountName + ' is not known.';
          } else {
            $scope.signIn.message = 'Unexpected error during sign-in with status ' + status + '.';
          }
        });
    };



    $scope.signIn.cancel = function () {
      $scope.main.showSignIn = false;
    };

    $scope.$watch('signIn.newUser.password', function () {
      delete $scope.signIn.signUpErrors;
    });
    $scope.$watch('signIn.newUser.passwordConfirm', function () {
      delete $scope.signIn.signUpErrors;
    });





  }]);
