'use strict';

/**
 * @ngdoc function
 * @name belPlus2App.controller:ReachCtrl
 * @description
 * # ReachCtrl
 * Controller of the belPlus2App
 */
angular.module('belPlus2App')
  .controller('ReachCtrl', ['$scope', '$http', function ($scope, $http) {
    $scope.pmcXML = false;
    $scope.reachJSON = false;
    $scope.reachError = false;
    $scope.pmcError = false;
    $scope.pmcFile = false;

    $scope.pmcId = '';
    $scope.getPMC = function(){
      // Problem: this service does not support CORS, so this query fails

      $http({
        method: 'GET',
        url: 'http://www.ncbi.nlm.nih.gov/pmc/oai/oai.cgi',
        params: {
          verb: 'GetRecord',
          identifier:'oai:pubmedcentral.nih.gov:' + $scope.pmcId,
          metadataPrefix: 'pmc'
        }
      }).then(function(response) {
        // this callback will be called asynchronously
        // when the response is available
        console.log(response);
        $scope.pmcXML = response.data;
      }, function (response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        $scope.pmcError = response;
      });
    };

    //http://www.ebi.ac.uk/europepmc/webservices/rest/PMC3257301/fullTextXML
    $scope.getEuropeanPMC = function(){
      // This service supports CORS
      $http({
        method: 'GET',
        url: 'http://www.ebi.ac.uk/europepmc/webservices/rest/PMC' + $scope.pmcId + '/fullTextXML',
      }).then(function(response) {
        // this callback will be called asynchronously
        // when the response is available
        console.log(response);
        $scope.pmcXML = response.data;
      }, function (response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        $scope.pmcError = response;
      });
    };

    $scope.resetPMC = function(){
      $scope.pmcId = '';
    };

    $scope.processNXML = function(nxml, outputType){
      // Problem: this service does not support CORS, so this query fails
      $http({
        method: 'POST',
        url: 'http://agathon.sista.arizona.edu:8080/odinweb/api/nxml',
        data: angular.toJson({nxml: nxml, output: outputType})
      }).then(function(response) {
        // this callback will be called asynchronously
        // when the response is available
        console.log(response);
        $scope.reachJSON = response.json;
      }, function (response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        $scope.reachError = response;
      });
    };

    // http://localhost:5603/test/fries
    $scope.getFriesTestData = function(){
      $http.get('http://localhost:5603/test/fries')
        .then(function(response) {
          // this callback will be called asynchronously
          // when the response is available

          $scope.reachJSON = response.data;
          console.log(response);
        }, function (response) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          $scope.reachError = response;
        });
    };

    $scope.processXMLAsFile = function(){
      var fd = new FormData();
      var uploadURL = 'http://agathon.sista.arizona.edu:8080/odinweb/api/ingestNxml';
      fd.append('file', $scope.pmcFile);
      $http.post(uploadURL, fd, {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
      })
        .success(function(response){
          console.log(response);
          $scope.reachJSON = response.json;
        })
        .error(function(response){
          $scope.reachError = response;
        });
    };

  }]);
