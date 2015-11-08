'use strict';

/**
 * @ngdoc function
 * @name belPlus2App.controller:EditCtrl
 * @description
 * # EditCtrl
 * Controller of the belPlus2App
 */
var cns, cn, cm;
cns = {};
cn = {};
cm = {};

angular.module('belPlus2App')
  .controller('EditCtrl', ['ndexService', '$routeParams', '$scope',  function (ndexService, $routeParams, $scope) {

    $scope.editor = {};

    var editor = $scope.editor;
    editor.queryErrors = [];
    editor.networkId = $routeParams.networkId;
    editor.network = {};
    editor.networkSummary = {};
    if (!editor.networkId) {
      editor.networkId = '55c84fa4-01b4-11e5-ac0f-000c29cb28fb';
    }

    editor.ndexUri = ndexService.getNdexServerUri();

    console.log(editor);

    var getSummary = function (callback) {
      ndexService.getNetworkSummary(editor.networkId)
        .success(
        function (networkSummary) {
          cns = networkSummary;
          editor.queryErrors = [];
          editor.networkSummary = networkSummary;
          console.log('success for networkSummary = ' + editor.networkSummary.name);
          callback();
        }
      ).error(
        function (error) {
          editor.queryErrors.push(error.data.message);

        }
      );


    };

    var getNetwork = function(callback){
      ndexService.getCompleteNetwork(editor.networkId)
        .success(
        function (network) {
          cn = network;
          editor.queryErrors = [];
          editor.network = network;
          callback();
        }
      ).error(
        function (error) {
          editor.queryErrors.push(error.data.message);

        }
      );
    };




    var BelLib = {};

    BelLib.debug = null;



    /*
     The model is based around a set of citations
     Each citation may have statements and supports
     supports can have statements
     a statement can only belong to one parent, either a citation or a support
     each statement is either a term - a BEL function term with context properties
     OR it is a relationship between terms, with context properties.
     */


    BelLib.Model = function () {
      this.citations = [];
      this.properties = {};
      this.namespaces = {};
    };

    BelLib.Model.prototype = {

      constructor: BelLib.Model,

      fromJdex: function (jdex) {
        console.log('loading ' + jdex.name);
        var ns = this.namespaces;
        console.log(Object.keys(jdex.namespaces).length + ' namespaces in source');
        angular.forEach(jdex.namespaces, function (jdexNamespace) {
          var prefix = jdexNamespace.prefix;
          var uri = jdexNamespace.uri;
          //console.log('ns: ' + prefix + ' ' + uri);
          if (prefix && uri) {
            ns[prefix] = uri;
          }
        });
        var edgeIds = [];
        var nodeIds = [];
        var model = this;
        console.log(Object.keys(jdex.citations).length + ' citations in source');
        angular.forEach(jdex.citations, function (jdexCitation, jdexCitationId) {
          var citation = new BelLib.Citation(model);
          citation.fromJdex(jdexCitationId, jdexCitation, jdex, edgeIds, nodeIds);
          model.citations.push(citation);
        });
      }
    };

    /*------------------------------------------------
     Citation
     ------------------------------------------------*/
    BelLib.Citation = function (model) {
      this.model = model;
      this.supports = [];
      this.statements = [];
      this.type = null;
      this.uri = '';
      this.identifier = '';
    };

    BelLib.Citation.prototype = {

      constructor: BelLib.Citation,

      setInfo: function (identifier, uri, type, contributors) {
        this.contributors = contributors;
        this.type = type;
        this.uri = uri;
        this.identifier = identifier;
      },

      addStatement: function (statement) {
        this.statements.push(statement);
        statement.parent = this;
      },

      addSupport: function (support) {
        this.supports.push(support);
        support.parent = this;
      },

      fromJdex: function (jdexCitationId, jdexCitation, jdex, edgeIds, nodeIds) {
        // add the properties from the jdexCitation

        // find the supports that reference the citation id.
        // add each support to the citation

        this.type = jdexCitation.type;
        this.uri = jdexCitation.uri;
        this.identifier = jdexCitation.identifier;
        var cit = this;

        console.log('cit: ' + jdexCitationId + ' ' + cit.identifier);

        angular.forEach(jdex.supports, function (jdexSupport, jdexSupportId) {

          if (jdexSupport.citationId === jdexCitationId) {
            console.log('matched ' + jdexCitationId + ' vs ' + jdexSupport.citationId);
            var support = new BelLib.Support();
            support.fromJdex(jdexSupportId, jdexSupport, jdex, edgeIds, nodeIds);
            support.parent = cit;
            cit.supports.push(support);
          }

        });

        // find the edges that reference the citation id
        // add each edge as a statement unless it has already
        // been handled
        angular.forEach(jdex.edges, function (jdexEdge, jdexEdgeId) {
          if (!edgeIds.contains(jdexEdgeId)) {
            // this was not already handled when processing a statement
            if (jdexEdge.citationIds.contains(jdexCitationId)) {
              var statement = new BelLib.Statement();
              statement.fromJdexEdge = (jdexEdgeId, jdexEdge, jdex, edgeIds);
              statement.parent = cit;
              cit.statements.push(statement);
            }
          }

        });

        // find the nodes that reference the citation id
        // add each node as a statement unless it has already
        // been handled

        angular.forEach(jdex.nodes, function (jdexNode, jdexNodeId) {
          if (!nodeIds.contains(jdexNodeId)) {
            // this was not already handled when processing a support
            if (jdexNode.citationIds.contains(jdexCitationId)) {
              var statement = new BelLib.Statement();
              statement.fromJdexNode = (jdexNodeId, jdexNode, jdex, nodeIds);
              statement.parent = cit;
              cit.statements.push(statement);
            }
          }

        });
      },

      toJdex: function () {
        /*
         var jdex = {identifier: this.identifier, type: this.type};
         if (this.title) jdex['title'] = this.title;
         if (this.citation) jdex['citation'] = this.citation;
         if (this.edges && this.edges.length > 0) {
         var edge_ids = [];
         $.each(this.edges, function (index, edge) {
         edge_ids.push(edge.id);
         });
         jdex['edges'] = edge_ids;
         }
         jdex['contributors'] = [];
         $.each(this.contributors, function (index, contributors) {
         jdex.contributors.push(contributors);
         });
         return jdex;
         */
      }

    };

    /*------------------------------------------------
     Support
     ------------------------------------------------*/
    BelLib.Support = function () {
      this.citation = null;
      this.statements = [];
      this.text = '';
    };

    BelLib.Support.prototype = {

      constructor: BelLib.Support,

      setText: function (text) {
        this.text = text;
      },

      addStatement: function (statement) {
        this.statements.push(statement);
        statement.parent = this;
      },

      fromJdex: function (jdexSupportId, jdexSupport, jdex, edgeIds, nodeIds) {

        this.text = jdexSupport.text;
        var sup = this;

        console.log('sup: ' + jdexSupportId + ' ' + sup.text);

        // find the edges that reference the support id
        // add each edge as a statement
        angular.forEach(jdex.edges, function (jdexEdge, jdexEdgeId) {
          if (jdexEdge.supportIds.contains(jdexSupportId)) {
            var statement = new BelLib.Statement();
            statement.fromJdexEdge = (jdexEdgeId, jdexEdge, jdex, edgeIds);
            statement.parent = sup;
            sup.statements.push(statement);
          }
        });

        // find the nodes that reference the support id
        // add each node as a statement
        angular.forEach(jdex.nodes, function (jdexNode, jdexNodeId) {
          if (jdexNode.supportIds.contains(jdexSupportId)) {
            var statement = new BelLib.Statement();
            statement.fromJdexNode = (jdexNodeId, jdexNode, jdex, nodeIds);
            statement.parent = sup;
            sup.statements.push(statement);
          }
        });

      }
    };

    /*------------------------------------------------
     Statement
     ------------------------------------------------*/

    BelLib.Statement = function () {
      this.subject = null;
      this.relationship = null;
      this.object = null;
      this.parent = null;
      this.properties = {};
    };

    BelLib.Statement.prototype = {

      constructor: BelLib.Statement,

      setSubject: function (functionTerm) {
        this.subject = functionTerm;
      },

      setRelationship: function (term) {
        this.relationship = term;
      },

      setObject: function (functionTerm) {
        this.object = functionTerm;
      },

      setContext: function (context, value) {
        this.properties[context] = value;
      },

      fromJdexEdge: function (jdexEdgeId, jdexEdge, jdex, edgeIds) {
        this.subject = BelLib.functionTermFromJdexNodeId(jdexEdge.subjectId, jdex);
        this.relationship = BelLib.termFromJdexBaseTermId(jdexEdge.predicateId, jdex);
        this.object = BelLib.functionTermFromJdexNodeId(jdexEdge.objectId, jdex);
        this.properties = BelLib.propertiesFromJdex(jdexEdge.properties);
        edgeIds.push(jdexEdgeId);
      },

      fromJdexNode: function (jdexNodeId, jdexNode, jdex, nodeIds) {
        // This populates only the subject of the statement and its context properties
        this.subject = BelLib.functionTermFromJdexNodeId(jdexNodeId, jdex);
        this.properties = BelLib.propertiesFromJdex(jdexNode.properties);
        nodeIds.push(jdexNodeId);
      }
    };

    BelLib.propertiesFromJdex = function (jdexProperties) {
      var props = {};
      angular.forEach(jdexProperties, function (jdexProperty) {
        props[jdexProperty.name] = jdexProperty.valueString;
      });
      return props;
    };

    /*------------------------------------------------
     FunctionTerm
     ------------------------------------------------*/

    BelLib.FunctionTerm = function () {
      this.function = null;
      this.parameters = [];
    };

    BelLib.FunctionTerm.prototype = {

      constructor: BelLib.FunctionTerm,

      setFunction: function (term) {
        this.function = term;
      },

      setParameters: function (parameters) {
        this.parameters = parameters;
      },

      // Stopped here!!!
      fromJdex: function (jdexFunctionTerm, jdex) {
        var functionId = jdexFunctionTerm.functionTermId;
        var parameterIds = jdexFunctionTerm.functionTermId;
        this.function = BelLib.termFromJdexBaseTermId(functionId, jdex);
        var params = this.parameters;
        angular.forEach(parameterIds, function(id){
          var p = BelLib.termFromJdexTermId(id);
          params.push(p);
        });

      },

      toJdex: function () {
        var params = {};
        angular.forEach(this.parameters, function (value, key) {
          if (typeof(value) === 'object') {
            params[key] = {term: value.id};
          } else {
            params[key] = value;
          }
        });
        return {termFunction: this.termFunction.id, parameters: params};
      },

      identifier: function () {
        return BelLib.functionTermIdentifier(this.termFunction, this.parameters);
      }

    };

    BelLib.functionTermFromJdexNodeId = function (jdexNodeId, jdex) {
      // get the node
      var jdexNode = jdex.nodes[jdexNodeId];
      // get the represented term and check that it is a function term
      if (jdexNode.represents) {
        var jdexFunctionTermId = jdex.functionTerms[jdexNode.represents];
        if (jdexFunctionTermId) {
          return BelLib.functionTermFromJdexTermId(jdexFunctionTermId, jdex);
        }
      }
      return null;
    };

    BelLib.functionTermFromJdexTermId = function(jdexTermId, jdex){
      var jdexFunctionTerm = jdex.functionTerms.jdexTermId;
      if (jdexFunctionTerm){
        var functionTerm = new BelLib.FunctionTerm();
        // create a function term and populate it from jdex
        functionTerm.fromJdex(jdexFunctionTerm, jdex);
        return functionTerm;
      }
      return false;

    };

    BelLib.functionTermIdentifier = function (termFunction, parameters) {
      var params = [];
      angular.forEach(parameters, function (parameter) {
        if (parameter.termFunction || parameter.name) {
          params.push(parameter.identifier());
        } else {
          params.push(parameter);
        }
      });
      return termFunction.identifier() + '(' + params.join(', ') + ')';
    };


    /*------------------------------------------------
     Term
     ------------------------------------------------*/
    BelLib.Term = function () {
      this.prefix = null;
      this.name = null;
    };

    BelLib.Term.prototype = {

      constructor: BelLib.Term,

      setName: function (string) {
        this.name = string;
      }


    };

    BelLib.objectFromJdexTermId = function(jdexTermId, jdex){
      var object = BelLib.termFromJdexBaseTermId(jdexTermId, jdex);
      if (object){
        return object;
      }
      object = BelLib.functionTermFromJdexTermId(jdexTermId, jdex);
      if (object){
        return object;
      }
      object = BelLib.statementFromJdexTermId(jdexTermId, jdex);
      return object;
    };

    BelLib.termFromJdexBaseTermId = function (jdexBaseTermId, jdex) {
      var term = null;
      var jdexTerm = jdex.baseTerms[jdexBaseTermId];
      if (jdexTerm) {
        term = new BelLib.Term();
        term.name = jdexTerm.name;
        if (jdexTerm.namespaceId) {
          var namespace = jdex.namespaces[jdexTerm.namespaceId];
          if (namespace.prefix) {
            term.prefix = namespace.prefix;
          }
        }
      }
      return term;
    };


    /*------------------------------------------------
     Namespace
     ------------------------------------------------*/

    BelLib.Namespace = function () {
      this.uri = null;
      this.prefix = null;
    };

    BelLib.Namespace.prototype = {

      constructor: BelLib.Namespace,

      setPrefix: function (string) {
        this.prefix = string;
      },

      setUri: function (string) {
        this.uri = string;
      }
    };

    var buildModel = function(){
      cm = new BelLib.Model();
      console.log('got summary ' + editor.networkSummary.name);
      console.log('got network ' + editor.network.name);
      console.log('about to load bel model from ' + editor.network.name);
      cm.fromJdex(editor.network);
    };

    getSummary(getNetwork(buildModel));


  }]);
