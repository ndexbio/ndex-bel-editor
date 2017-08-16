'use strict';

/**
 * @ngdoc function
 * @name netWorkBenchApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the netWorkBenchApp
 */
angular.module('netWorkBenchApp')
  .controller(
  'MainCtrl',
  ['ndexService', '$location', '$scope', '$http', 'sharedProperties',
    function (ndexService, $location, $scope, $http, sharedProperties) {


      //---------------------------------------------
      // Network Display
      //
      // Finding and displaying networks
      //---------------------------------------------


      $scope.networkDisplay = {};
      var networkDisplay = $scope.networkDisplay;

      //networks
      networkDisplay.accountName = 'rembel';
      networkDisplay.foo = 'debugging variable foo';
      networkDisplay.permission = 'READ';
      networkDisplay.networkSearchResults = [];
      networkDisplay.skip = 0;
      networkDisplay.blockSize = 10000;
      networkDisplay.includeGroups = false;
      networkDisplay.searchString = '';
      networkDisplay.allSelected = false;
      networkDisplay.atLeastOneSelected = false;
      networkDisplay.myNdex = ndexService.client;
      networkDisplay.summary = null;

      networkDisplay.editNetwork = function (networkId) {
        $location.path('/edit/' + networkId);
      };

      networkDisplay.searchNetworks = function () {
        networkDisplay.networkSearchResults = null;
        networkDisplay.error = null;

        // searchString, accountName, permission, includeGroups, skipBlocks, blockSize

        ndexService.searchNetworks(
          networkDisplay.searchString,
          networkDisplay.accountName,
          networkDisplay.permission,
          networkDisplay.includeGroups,
          networkDisplay.skip,
          networkDisplay.blockSize)
          .success(
          function (networks) {
            networkDisplay.networkSearchResults = networks;
            console.log('networkSearchResults = ' + networks);
          })
          .error(
          function (error) {
            networkDisplay.error = error;
            console.log('search error = ' + error);
          });
      };

      ndexService.client.getNetworkSummary("aa07df5d-6187-11e5-8ac5-06603eb7f303",
        function(responseJSON) {
        },
        function(error){
        });
      //---------------------------------------------
      // SignIn Handler
      //---------------------------------------------
/*
      $scope.signIn = {};
      $scope.signIn.newUser = {};
      $scope.loggedIn = false;
      // hardwire rembel for now
      $scope.signIn.password = 'rembel';
      $scope.signIn.accountName = 'rembel';

      $scope.signIn.submitSignIn = function () {
        ndexService.clearUserCredentials();
        $scope.loggedIn = false;
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
            sharedProperties.setCurrentUser(data.externalId, data.accountName); //this info will have to be sent via emit if we want dynamic info on the nav bar
            ndexService.setUserCredentials(data.accountName, data.externalId, $scope.signIn.password);
            //$scope.$emit('LOGGED_IN'); //Angular service capability, shoot a signal up the scope tree notifying parent scopes this event occurred, see mainController
            //$location.path('/user/' + data.externalId);
            $scope.loggedIn = true;
            $scope.signIn.accountName = null;
            $scope.signIn.password = null;
            networkDisplay.searchNetworks();
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


      if(!sharedProperties.getCurrentUserId()){
        // if have not yet established the current user, log in, which will cause a search to happen
        $scope.signIn.submitSignIn();
      } else {
        // if we reload and we have a current user, go ahead and search
        networkDisplay.searchNetworks();
      }
*/
      console.log(networkDisplay);


    }]);
