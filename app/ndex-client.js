/**
 * Created by dexter on 8/13/17.
 */
// Thanks to http://ourcodeworld.com/
// for the tutorial and code example
// about creating javascript libraries

// ??? do we really need this?
// This library depends on lodash.js

(function(window){
  'use strict';

  // This function creates an ndex client object
  function ndexClient(){
    var _ndexClientObject = {};

    /*---------------------------------------------------------------------*
    * Client settings
    *---------------------------------------------------------------------*/

    // this is a private variable visible in the scope ndexClient
    var clientSettings = {
      ndexServerUri:"www.ndexbio.org",
      bar:false
    };

    // this is a public function to set a private variable
    _ndexClientObject.ndexServerUri = function(uri){
      // TODO - verify that the string is a valid uri
      clientSettings.ndexServerUri = uri;
      return clientSettings.ndexServerUri;
    };

    // this is a public function to return a private variable value
    _ndexClientObject.ndexServerUri = function(){
      return clientSettings.ndexServerUri;
    };

    /*---------------------------------------------------------------------*
     * Errors
     *---------------------------------------------------------------------*/

    var ndexError = function(string){
      console.log(string);
    };

    /*---------------------------------------------------------------------*
     * ID, Authentication, Credentials, Abort
     *---------------------------------------------------------------------*/

    // public functions

    _ndexClientObject.clearUserCredentials = function () {
      localStorage.setItem('loggedInUser', null);
    };

    _ndexClientObject.setUserCredentials = function (accountName, externalId, token) {
      if (localStorage) {
        var loggedInUser = {};
        loggedInUser.accountName = accountName;
        loggedInUser.token = token;
        loggedInUser.externalId = externalId;
        localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
      }
    };

    _ndexClientObject.getUserCredentials = function () {
      if (localStorage) {
        var loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        if (loggedInUser === null) {
          return null;
        }
        return {
          accountName: loggedInUser.accountName,
          externalId: loggedInUser.externalId,
          token: loggedInUser.token
        };
      }
    };

    // private functions

    var setUserAuthToken = function (token) {
      var loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
      if (!loggedInUser) {
        loggedInUser = {};
      }
      loggedInUser.token = token;
      localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
    };

    var setUserInfo = function (accountName, externalId) {
      var loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
      if (!loggedInUser) {
        loggedInUser = {};
      }
      loggedInUser.accountName = accountName;
      loggedInUser.externalId = externalId;
      localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
    };
    /*
     var getLoggedInUserExternalId = function () {
     var loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
     if (!loggedInUser) {
     loggedInUser = {};
     }
     return loggedInUser.externalId;
     };
     */
    var getLoggedInUserAccountName = function () {
      var loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
      if (!loggedInUser) {
        loggedInUser = {};
      }
      return loggedInUser.accountName;
    };

    var getLoggedInUserAuthToken = function () {
      var loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
      if (!loggedInUser) {
        loggedInUser = {};
      }
      return loggedInUser.token;
    };

    /*---------------------------------------------------------------------*
     * Returns the user's credentials as required by Basic Authentication base64
     * encoded.
     *---------------------------------------------------------------------*/

    var getEncodedUser = function () {
      if (getLoggedInUserAccountName() !== undefined && getLoggedInUserAccountName() !== null) {
        return btoa(getLoggedInUserAccountName() + ':' + getLoggedInUserAuthToken());
      } else {
        return null;
      }
    };

    /*
    var requestWithAbort = function (config) {
      // The $http timeout property takes a deferred value that can abort AJAX request
      var deferredAbort = $q.defer();

      config.timeout = deferredAbort.promise;

      // We keep a reference ot the http-promise. This way we can augment it with an abort method.
      var request = $http(config);

      // The $http service uses a deferred value for the timeout. Resolving the value will abort the AJAX request
      request.abort = function () {
        deferredAbort.resolve();
      };

      // Make garbage collection smoother by forcing the request.abort to an empty function
      // and then set the deferred abort and the request to null
      // This cleanup is performed once the request is finished.
      request.finally(
        function () {
          request.abort = angular.noop; // angular.noop is an empty function
          deferredAbort = request = null;
        }
      );

      return request;
    };
    */

    /*---------------------------------------------------------------------*
     * Convenient NDEx wrappers around XHR - private functions
     *---------------------------------------------------------------------*/

    var ndexGet = function (url_tail){
      var xhr = new XMLHttpRequest(),
        method = "GET",
        url = "https://" + clientSettings.ndexServerUri + url_tail;
      xhr.open(method,url,true);
      xhr.send();
      return xhr;
    };

    /*---------------------------------------------------------------------*
     * ****  NDEx REST API  ****
     * public functions
     *---------------------------------------------------------------------*/

    /*---------------------------------------------------------------------*
     * Networks
     *---------------------------------------------------------------------*/

    _ndexClientObject.getNetworkSummary = function (networkId) {
      return ndexGet('/network/' + networkId);
    };

    /*---------------------------------------------------------------------*
     * ****  NiceCX  ****
     *---------------------------------------------------------------------*/

    /*---------------------------------------------------------------------*
     * ****  Finally, return the client object  ****
     *---------------------------------------------------------------------*/
    return _ndexClientObject;
  }

  /*---------------------------------------------------------------------*
   * the window variable 'ndex' is set to an instance of _ndexClientObject
   * returned by ndexClient unless 'ndex' is already defined
   * in which case we throw an error
   *---------------------------------------------------------------------*/

  if(typeof(window.ndex) === 'undefined'){
    window.ndex = ndexClient();
  }

})(window); // execute this closure on the global window
