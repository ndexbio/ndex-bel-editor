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
  ['ndexService', '$location', '$scope', '$http', '$modal',
  function (ndexService, $location, $scope, $http, $modal) {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
    //---------------------------------------------
    // SignIn / SignUp Handler
    //---------------------------------------------

    $scope.signIn = {};
    $scope.signIn.newUser = {};

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
          $scope.$emit('LOGGED_IN'); //Angular service capability, shoot a signal up the scope tree notifying parent scopes this event occurred, see mainController
          $location.path('/user/' + data.externalId);
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

    $scope.signIn.openSignUp = function () {
      $scope.signIn.modalInstance = $modal.open({
        templateUrl: 'signUp.html',
        scope: $scope,
        backdrop: 'static'
      });
    };

    $scope.signIn.cancelSignUp = function () {
      $scope.signIn.newUser = {};
      $scope.signIn.modalInstance.close();
      $scope.signIn.modalInstance = null;
      delete $scope.signIn.signUpErrors;
    };

    $scope.$watch('signIn.newUser.password', function () {
      delete $scope.signIn.signUpErrors;
    });
    $scope.$watch('signIn.newUser.passwordConfirm', function () {
      delete $scope.signIn.signUpErrors;
    });

    $scope.signIn.signUp = function () {
      if ($scope.isProcessing){
        return;
      }
      $scope.isProcessing = true;
      //check if passwords match, else throw error
      if ($scope.signIn.newUser.password !== $scope.signIn.newUser.passwordConfirm) {
        $scope.signIn.signUpErrors = 'Passwords do not match';
        $scope.isProcessing = false;
        return;
      }

      ndexService.createUser($scope.signIn.newUser,
        function (userData) {
          //sharedProperties.setCurrentUser(userData.externalId, userData.accountName);
          ndexService.setUserInfo(userData.accountName, userData.externalId);
          $scope.$emit('LOGGED_IN');
          $scope.signIn.cancelSignUp();// doesn't really cancel
          $location.path('user/' + userData.externalId);
          $scope.isProcessing = false;
        },
        function (error) {
          $scope.signIn.signUpErrors = error.data.message;
          $scope.isProcessing = false;
          //console.log(error)
        });
    };

    $scope.forgot = {};

    $scope.forgotPassword = function () {
      var modalInstance = $modal.open({
        templateUrl: 'forgotPassword.html',
        controller: function ($scope, $modalInstance, $log, forgot) {
          $scope.forgot = forgot;
          $scope.resetPassword = function () {
            var url = ndexService.getNdexServerUri() + '/user/forgot-password';
            $http.post(url, $scope.forgot.accountName).
              success(function () // data, status, headers, config
              {
                forgot.done = true;
                forgot.errorMsg = null;
                forgot.successMsg = 'A new password has been sent to the email of record.';
              }).
              error(function (data) // , status, headers, config
              {
                forgot.errorMsg = data.message;
              });
          };

          $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
          };
        },
        resolve: {
          forgot: function () {
            return $scope.forgot;
          }
        }
      });

      modalInstance.result.finally(function () {
        $scope.forgot = {};
      });

    };

  }]);
