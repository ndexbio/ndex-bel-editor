'use strict';

/**
 * @ngdoc function
 * @name belEditApp.controller:EditCtrl
 * @description
 * # EditCtrl
 * Controller of the belEditApp
 */
var cns, cm, cxLoaded, cxOutput;
cns = {};
cm = {};
cxLoaded = [];
cxOutput = [];

angular.module('belEditApp')
  .controller('EditCtrl',
  ['ndexService',
    '$routeParams',
    '$scope',
    '$http',
    'BelTranslateService',
    'BelModelService',
    function (ndexService,
              $routeParams,
              $scope,
              $http,
              BelTranslateService,
              BelModelService) {

      $scope.editor = {};
      var editor = $scope.editor;
      $scope.foo = 'this is foo';
      $scope.oneAtATime = false;
      $scope.draggedBaseTerm = false;
      editor.termScratchpad = [];
      editor.currentSupport = false;

      editor.queryErrors = [];
      editor.networkId = $routeParams.networkId;
      editor.network = {};
      editor.networkSummary = {};
      editor.cx = [];
      editor.prettyCxLoaded = 'Placeholder for Pretty CX Loaded';
      editor.model = {};
      editor.log = [];


      /*
       if (!editor.networkId) {

       editor.networkId = 'd4e31748-9ec0-11e5-9dd0-0251251672f9'; // fries test output
       //editor.networkId = 'ebc3355c-9d63-11e5-839e-0251251672f9';   // test file around BCL2 and BAD
       }
       */
      editor.ndexUri = ndexService.getNdexServerUri();

      editor.handleCheckboxClick = function (citation) {
        console.log('citation checkbox click ' + citation.identifier);
      };

      editor.log.push('in edit.js');

      console.log(editor);

      /*
       Issues:

       focus on one citation at a time - dropdown to switch

       page for new network from pmc

       add-remove support
       add blank statement
       remove statement
       clone statement
       move statement
       change statement active status - tf


       Handle unconnected nodes -> special scratchpad?

       Use the python service to manage a limited (1) set of accounts?

       Save via CX
       as bel
       as kam with redundant edges merged
       move this logic to python?
       Reach
       check handling of protein and gene product types, binding, sites, modifications, mutations, families


       Allowed Drag and Drop Cases:

       - Relationship onto Relationship -> replace
       - BT onto BT -> replace
       # Func onto Func -> replace

       - ft to scratchpad
       - bt to scratchpad

       - FT template onto FT -> map BTs onto a deep copy of the FT as best as we can
       p(?) + kin(p(X)) -> p(X)
       kin(complex(p(?), p(?)) + p(X) -> kin(complex(p(X), p(?))

       - FT onto FT -> replace

       */

      /*------------------------------------------------------------------------------------
       Methods for Drag and Drop on this page
       ------------------------------------------------------------------------------------*/

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

      editor.relationships = [
        BelTranslateService.makeRelationship('bel', 'increases'),
        BelTranslateService.makeRelationship('bel', 'decreases'),
        BelTranslateService.makeRelationship('bel', 'directlyIncreases'),
        BelTranslateService.makeRelationship('bel', 'directlyDecreases')
      ];

      editor.functionTermTemplates = BelTranslateService.makeFunctionTermTemplates();
      console.log('These are the function term templates:');
      console.log(editor.functionTermTemplates);

      /*------------------------------------------------------------------------------------
       Output CX
       ------------------------------------------------------------------------------------*/

      editor.toOutputCX = function () {
        if (editor.model) {
          editor.cxOutput = BelTranslateService.smToCx(editor.model);
          cxOutput = editor.cxOutput;
          BelModelService.cxOutput = cxOutput;
        }
      };

      /*------------------------------------------------------------------------------------
       Methods to be executed on page load
       ------------------------------------------------------------------------------------*/

      var getNetwork = function (callback) {
        ndexService.getNetworkAsCx(editor.networkId)
          .success(
          function (network) {
            editor.queryErrors = [];
            cxLoaded = network;
            editor.cxLoaded = network;
            editor.prettyCxLoaded = JSON.stringify(editor.cxLoaded, null,'   ');
            callback();
          }
        ).error(
          function (error) {
            editor.queryErrors.push(error.data.message);

          }
        );
      };

      var buildModel = function () {
        $scope.editor.model = {};
        editor.log.push('about to load bel model from ' + editor.networkSummary.name);

        cm = BelTranslateService.cxToSm(editor.cxLoaded, editor.log);
        editor.log.push('finished loading');
        $scope.editor.model = cm;
        BelModelService.statementModel = cm;
      };

      if (editor.networkId) {

        ndexService.getNetworkSummary(editor.networkId)
          .success(
          function (networkSummary) {
            cns = networkSummary;
            editor.queryErrors = [];
            editor.networkSummary = networkSummary;
            console.log('got networkSummary for ' + editor.networkSummary.name);
            getNetwork(buildModel);
          }
        ).error(
          function (error) {
            editor.queryErrors.push(error);
          }
        );
      }

    }])
;
