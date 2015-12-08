'use strict';

/**
 * @ngdoc service
 * @name belPlus2App.PMCService
 * @description
 * # PMCService
 * Service in the belPlus2App.
 */
/*
angular.module('belPlus2App')
  .service('PMCService', ['$http', function ($http) {
    // AngularJS will instantiate a singleton by calling "new" on this function


    this.getPMCXML = function(pmcId, text, error){
        //var pmcUrl = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=text&rettype=abstract&id=' + pmid;
      //var pmcBase = 'http://www.ncbi.nlm.nih.gov/pmc/oai/oai.cgi';
      //var verb = 'GetRecord';
      //var identifier = 'oai:pubmedcentral.nih.gov:' + pmcId;
      //var metadataPrefix = 'pmc';
      $http({
        method: 'GET',
        url: '/someUrl',
        params: {
          verb: 'GetRecord',
          identifier:'oai:pubmedcentral.nih.gov:' + pmcId,
          metadataPrefix: 'pmc'
        }
      }).then(function(response) {
        // this callback will be called asynchronously
        // when the response is available
        text = response.text;
      }, function (response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
      });

        $http.get(abstractUrl).then(
          function (response) {
            console.log(response);
            return response.data;
          },
          function (error) {
            editor.queryErrors.push(error);
          });

      }
    }

    // get the XML for a PMC article based on a PMC id
    this.getPMCXML = function (pmcId) {
      var params = {
        verb: 'GetRecord',
        identifier:'oai:pubmedcentral.nih.gov:' + pmcId,
        metadataPrefix: 'pmc'
      };
      var config = {
        method: 'GET',
        url: 'http://www.ncbi.nlm.nih.gov/pmc/oai/oai.cgi',
        data: JSON.stringify(params),
        headers:{}
      };
      return $http(config);
    };

  }]);
     */
