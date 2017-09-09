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
        $scope.cyRestAvailable = null;
        $scope.cyNDExVersion = null;
        //$scope.editor = {};
        //var editor = $scope.editor;
        $scope.ndexServer = null;

        var init = function () {
          console.log("initializing");
          $http({
              method: "GET",
              url: 'http://localhost:1234/v1'
            }
          ).then(
            function () {
              //console.log(JSON.stringify(response));
              console.log("CyRest present, checking cyndex2");
              $http({
                method: "GET",
                url: 'http://localhost:1234/cyndex2/v1'
              }).then(
                function (response) {
                  console.log(response);
                  $scope.cyNDExVersion = response.data.appVersion;
                  $scope.cyRestAvailable = true;
                  console.log("cyndex2 " + $scope.cyNDExVersion + " present");
                  $scope.getNetworksInCytoscape();
                },
                function () {
                  console.log("CyNdex2 not present");
                }
              );
            },
            function () {
              $scope.cyRestAvailable = null;
              console.log("CyRest not present");
            }
          );
        };

        /*
         get the networks in Cytoscape, display for selection.
         */
        $scope.networksInCytoscape = [];
        $scope.getNetworksInCytoscape = function () {
          $http({
            method: 'GET',
            url: "http://localhost:1234/v1/networks.names"
          }).then(function (response) {
            $scope.networksInCytoscape = response.data;
            console.log($scope.networksInCytoscape);
            //$scope.$apply();
          });
        };


        $scope.currentNetworkObject = null;
        $scope.currentNetworkSUID = null;
        $scope.currentNetworkName = null;
        $scope.currentNetwork = null;
        $scope.edges = {};
        $scope.nodes = {};


        /*
         called when a network is selected for editing
         TODO: refactor, seems unneccessary

         */
        $scope.getCurrentNetwork = function () {
          $scope.currentNetworkSUID = $scope.currentNetworkObject['SUID'];
          $scope.currentNetworkName = $scope.currentNetworkObject.name;
          $scope.getNetwork($scope.currentNetworkSUID);
        };

        /*
         get the network in cyjs format and populate the edges and nodes maps
         */
        $scope.getNetwork = function (networkSuid) {
          console.log("getting network" + networkSuid);
          $http({
            method: "GET",
            url: "http://localhost:1234/v1/networks.json?column=SUID&query=" + networkSuid
          }).then(
            function (response) {
              //console.log(response);
              var network = response.data[0].elements;
              $scope.currentNetwork = network;
              console.log($scope.currentNetwork);
              var nodelist = network.nodes;
              var edgelist = network.edges;
              for (var n = 0; n < nodelist.length; n++) {
                var node = nodelist[n].data;
                $scope.nodes[node['SUID']] = node;
              }
              for (var e = 0; n < edgelist.length; n++) {
                var edge = edgelist[e].data;
                $scope.edges[edge['SUID']] = edge;
              }
            },
            function (response) {
              console.log("error in getting network");
              console.log(response);
            });
        };

        $scope.getSourceNode = function (edge) {
          return $scope.nodes[edge.source];
        };

        $scope.getTargetNode = function (edge) {
          return $scope.nodes[edge.target];
        };


        /*          $http({
         method: 'GET',
         url: "http://localhost:1234/v1/networks/" + networkId + "/tables/defaultnode"
         }).then(function (response) {
         // load the map of node SUIDs to nodes
         var nodelist = response.data;
         for (var n = 0; n < nodelist.length; n++) {
         var node = nodelist[n];
         $scope.nodes[node.SUID] = node;
         }
         $http({
         url: "http://localhost:1234/v1/networks/" + networkId + "/edges",
         method: 'GET'
         }).then(function (response) {
         // now get the edge SUIDs, get the corresponding edge, and fill the edge map.
         $scope.edgeSUIDs = response.data;
         for (var e = 0; e < $scope.edgeSUIDs.length; e++) {
         var edgeSUID = $scope.edgeSUIDs[e];
         $http({
         method: 'GET',
         url: "http://localhost:1234/v1/networks/" + networkId + "/edges/" + edgeSUID
         }).then(function (response) {
         var edge = response.data;
         $scope.edges[edge.SUID] = edge;
         })
         }
         });

         });


         };
         */
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
         $scope.$scope.termScratchpad.push(angular.copy(dragged));
         }
         };

         $scope.setCurrentSupport = function (support) {
         $scope.$scope.currentSupport = support;
         };


         */


        init();
      }])
;
