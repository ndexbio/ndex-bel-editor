'use strict';

/**
 * @ngdoc function
 * @name networkbenchApp.controller:EditCtrl
 * @description
 * # EditCtrl
 * Controller of the networkbenchApp
 */

angular.module('networkbenchApp')
  .controller('EditCtrl',
    ['$routeParams',
      '$scope',
      '$http',
      function ($routeParams,
                $scope,
                $http) {

        /*
         Test cytoscape_status   If it is 'cyRest', then we display network selector
         If network selected, display editor
         get nodes + edges
         display edge table and node table
         if edge predicate - or other property - is modified, use table method to update
         if node property is modified, use table meho
         */
        $scope.tester = {};
        var tester = $scope.tester;
        tester.cyrest_available = null;
        tester.cyndex_version = null;
        tester.test = "test";

        tester.get_cytoscape_status = function () {

        };

        var init = function () {
          console.log("initializing");
          $.get({
            url: 'http://localhost:1234/v1',
            success: function (data) {
              console.log(JSON.stringify(data));
              $scope.tester.cyrest_available = "blah";
              $.get({
                url: 'http://localhost:1234/cyndex2/v1',
                success: function (data) {
                  console.log(JSON.stringify(data));
                  console.log(tester.test);
                  $scope.$apply();
                  editor.getNetworksInCytoscape();
                }
              });
            },
            error: function () {
              tester.cyrest_available = null;
            }
          });

        };

        //-------------------------

        $scope.editor = {};
        var editor = $scope.editor;
        editor.ndexServer = null;

        /*
         get the networks in Cytoscape, display for selection.
         */
        editor.networksInCytoscape = [];
        editor.getNetworksInCytoscape = function () {
          $http({
            method: 'GET',
            url: "http://localhost:1234/v1/networks.names"
          }).then(function (response) {
            editor.networksInCytoscape = response.data;
            console.log(editor.networksInCytoscape);
            //$scope.$apply();
          });
        };

        /*
         select the network and get the edges and nodes
         */
        editor.currentNetworkObject = null;
        editor.currentNetworkSUID = null;
        editor.currentNetworkName = null;
        editor.currentNetwork = null;
        /*
         when we have a current network, we will display the editor
         and get the information from Cytoscape
         */
        editor.nodeSUIDs = [];
        editor.edgeSUIDs = [];
        editor.edges = {};
        editor.nodes = {};

        editor.getCurrentNetwork = function () {
          editor.currentNetworkSUID = editor.currentNetworkObject['SUID'];
          editor.currentNetworkName = editor.currentNetworkObject.name;
          editor.getNetwork(editor.currentNetworkSUID);
        };

        editor.getNetwork = function (networkId) {
          console.log("trying to get network");
          editor.currentNetwork = editor.CurrentNetworkName;

          $http({
            method: 'GET',
            url: "http://localhost:1234/v1/networks/" + networkId + "/tables/defaultnode"
          }).then(function (response) {
            // load the map of node SUIDs to nodes
            var nodelist = response.data;
            for (var n = 0; n < nodelist.length; n++) {
              var node = nodelist[n];
              editor.nodes[node.SUID] = node;
            }
            $http({
              url: "http://localhost:1234/v1/networks/" + networkId + "/edges",
              method: 'GET'
            }).then(function (response) {
              // now get the edge SUIDs, get the corresponding edge, and fill the edge map.
              editor.edgeSUIDs = response.data;
              for (var e = 0; e < editor.edgeSUIDs.length; e++) {
                var edgeSUID = editor.edgeSUIDs[e];
                $http({
                  method: 'GET',
                  url: "http://localhost:1234/v1/networks/" + networkId + "/edges/" + edgeSUID
                }).then(function (response) {
                  var edge = response.data;
                  editor.edges[edge.SUID] = edge;
                })
              }
            });

          });


        };

        /*------------------------------------------------------------------------------------
         Actions

         Change predicate -> modify edge table
         Change source or target node -> add modified edge, mark it as edited. Delete old edge
         Change edge status -> modify edge table
         accepted
         insufficient evidence
         irrelevant to task
         edited
         Clone edge -> add copied edge, insert in displayed edges adjacent to original
         Add node by name -> find identifier for name, check to see if already exists, add node
         Add edge - only update cytoscape once required fields are set
         Move edge in table

         ------------------------------------------------------------------------------------*/

        /*------------------------------------------------------------------------------------
         Methods for Drag and Drop on this page
         ------------------------------------------------------------------------------------*/

        $scope.draggedNode = false;

        /*

         $scope.onDropTerm = function (draggedTerm, targetTerm) {
         if (draggedTerm && targetTerm && draggedTerm !== targetTerm) {
         console.log('dropped term ' + draggedTerm.toString('SHORT') + ' on ' + targetTerm.toString('SHORT'));
         if (draggedTerm instanceof BelTranslateService.BaseTerm && targetTerm instanceof BelTranslateService.BaseTerm) {
         copyTerm(draggedTerm, targetTerm);
         } else if (draggedTerm instanceof BelTranslateService.Func && targetTerm instanceof BelTranslateService.Func) {
         copyTerm(draggedTerm, targetTerm);
         } else if (draggedTerm instanceof BelTranslateService.Relationship && targetTerm instanceof BelTranslateService.Relationship) {
         copyTerm(draggedTerm, targetTerm);
         }
         }
         };

         var copyTerm = function (dragged, target) {
         target.prefix = dragged.prefix;
         target.name = dragged.name;
         };

         var copyFunctionTerm = function (dragged, target) {
         var copy = angular.copy(dragged);
         target.function = copy.function;
         target.parameters = copy.parameters;
         };

         var copyFunctionTermTemplate = function (dragged, target) {
         var copy = angular.copy(dragged);
         var baseTerms = [];
         gatherBaseTerms(target, baseTerms);
         applyBaseTerms(baseTerms, copy);
         target.function = copy.function;
         target.parameters = copy.parameters;
         };

         var gatherBaseTerms = function (ft, baseTerms) {
         angular.forEach(ft.parameters, function (parameter) {
         if (parameter instanceof BelTranslateService.BaseTerm) {
         baseTerms.push(parameter);
         } else if (parameter instanceof BelTranslateService.FunctionTerm) {
         gatherBaseTerms(parameter, baseTerms);
         }
         });
         };

         var applyBaseTerms = function (baseTerms, ft) {
         angular.forEach(ft.parameters, function (parameter) {
         if (parameter instanceof BelTranslateService.BaseTerm && parameter.name === '?' && parameter.prefix === '?') {
         var bt = baseTerms.pop();
         parameter.name = bt.name;
         parameter.prefix = bt.prefix;
         } else if (parameter instanceof BelTranslateService.FunctionTerm) {
         applyBaseTerms(baseTerms, parameter);
         }
         });
         };

         $scope.onDropFT = function (draggedFunctionTerm, targetFunctionTerm) {
         if (draggedFunctionTerm) {
         console.log('dropped FT ' + draggedFunctionTerm.toString('SHORT') + ' on ' + targetFunctionTerm.toString('SHORT'));
         if (draggedFunctionTerm instanceof BelTranslateService.FunctionTerm && draggedFunctionTerm !== targetFunctionTerm) {
         if (draggedFunctionTerm instanceof BelTranslateService.FunctionTermTemplate) {
         copyFunctionTermTemplate(draggedFunctionTerm, targetFunctionTerm);
         } else {
         copyFunctionTerm(draggedFunctionTerm, targetFunctionTerm);
         }
         }
         }
         };

         $scope.onDropToScratchpad = function (dragged) {
         if (dragged && dragged instanceof BelTranslateService.BaseTerm) {
         $scope.editor.termScratchpad.push(angular.copy(dragged));
         }
         };

         $scope.setCurrentSupport = function (support) {
         $scope.editor.currentSupport = support;
         };


         */


        init();
      }])
;
