'use strict';

/**
 * @ngdoc service
 * @name belPlus2App.ReachService
 * @description
 * # ReachService
 * Service in the belPlus2App.
 */
/*
angular.module('belPlus2App')
  .service('ReachService',  ['$http', function ($http) {
*/
/*    Send NXML File
    Description: Send an NXML file for processing via an HTTP POST.
      URL: /odinweb/api/nxml
    Method: POST
    Required Argument: nxml
    Optional Argument: [ output=fries | output=indexcard ]
    Curl Example: curl -XPOST -F 'nxml=<PMC1240239.nxml' 'http://agathon:8080/odinweb/api/nxml'
    Curl Example: curl -XPOST -F 'nxml=<PMC1240239.nxml' 'http://agathon:8080/odinweb/api/nxml?output=indexcard'*/
/*
    this.processNXML = function(nxml, outputType){
      var config = {
        method: 'POST',
        url: 'http://agathon.sista.arizona.edu:8080/odinweb/api/nxml',
        data: angular.toJson({nxml: nxml, output: outputType})
      };
      return $http(config);
    };
*/

/*    Send Plain Text
    Description: Send a plain text snippet for processing via an HTTP POST.
      URL: /odinweb/api/text
    Method: POST
    Required Argument: text
    Optional Argument: [ output=fries | output=indexcard ]
    Curl Example: curl -XPOST 'http://agathon:8080/odinweb/api/text' -d 'text=A Sos-1-E3b1 complex directs Rac activation by entering into a tricomplex with Eps8.'
    Curl Example: curl -XPOST 'http://agathon:8080/odinweb/api/text' -d 'text=A Sos-1-E3b1 complex directs Rac activation by entering into a tricomplex with Eps8.' -d 'output=indexcard'*/




//  }]);
