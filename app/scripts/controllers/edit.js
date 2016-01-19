'use strict';

/**
 * @ngdoc function
 * @name belEditApp.controller:EditCtrl
 * @description
 * # EditCtrl
 * Controller of the belEditApp
 */
var cns, cn, cm, cx;
cns = {};
cn = {};
cm = {};
cx = [];

angular.module('belEditApp')
  .controller('EditCtrl', ['ndexService', '$routeParams', '$scope', '$http', function (ndexService, $routeParams, $scope, $http) {

    $scope.editor = {};
    $scope.foo = 'this is foo';
    $scope.oneAtATime = false;
    $scope.draggedBaseTerm = false;
    $scope.editor.termScratchpad = [];
    $scope.editor.currentSupport = false;

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

    $scope.onDropTerm = function (draggedTerm, targetTerm) {
      if (draggedTerm && targetTerm && draggedTerm !== targetTerm) {
        console.log('dropped term ' + draggedTerm.toString('SHORT') + ' on ' + targetTerm.toString('SHORT'));
        if (draggedTerm instanceof BelLib.BaseTerm && targetTerm instanceof BelLib.BaseTerm) {
          copyTerm(draggedTerm, targetTerm);
        } else if(draggedTerm instanceof BelLib.Func && targetTerm instanceof BelLib.Func) {
          copyTerm(draggedTerm, targetTerm);
        } else if (draggedTerm instanceof BelLib.Relationship && targetTerm instanceof BelLib.Relationship) {
          copyTerm(draggedTerm, targetTerm);
        }
      }
    };

    var copyTerm = function(dragged, target){
      target.prefix = dragged.prefix;
      target.name = dragged.name;
    };

    var copyFunctionTerm = function(dragged, target){
      var copy = angular.copy(dragged);
      target.function = copy.function;
      target.parameters = copy.parameters;
    };

    var copyFunctionTermTemplate = function(dragged, target){
      var copy = angular.copy(dragged);
      var baseTerms = [];
      gatherBaseTerms(target, baseTerms);
      applyBaseTerms(baseTerms, copy);
      target.function = copy.function;
      target.parameters = copy.parameters;
    };

    var gatherBaseTerms = function(ft, baseTerms){
      angular.forEach(ft.parameters, function (parameter) {
        if (parameter instanceof BelLib.BaseTerm){
          baseTerms.push(parameter);
        } else if (parameter instanceof BelLib.FunctionTerm){
          gatherBaseTerms(parameter, baseTerms);
        }
      });
    };

    var applyBaseTerms = function(baseTerms, ft){
      angular.forEach(ft.parameters, function (parameter) {
        if (parameter instanceof BelLib.BaseTerm && parameter.name === '?' && parameter.prefix === '?'){
          var bt = baseTerms.pop();
          parameter.name = bt.name;
          parameter.prefix = bt.prefix;
        } else if (parameter instanceof BelLib.FunctionTerm){
          applyBaseTerms(baseTerms,parameter);
        }
      });
    };

    $scope.onDropFT = function (draggedFunctionTerm, targetFunctionTerm) {
      if (draggedFunctionTerm) {
        console.log('dropped FT ' + draggedFunctionTerm.toString('SHORT') + ' on ' + targetFunctionTerm.toString('SHORT'));
        if (draggedFunctionTerm instanceof BelLib.FunctionTerm && draggedFunctionTerm !== targetFunctionTerm) {
           if (draggedFunctionTerm instanceof BelLib.FunctionTermTemplate){
             copyFunctionTermTemplate(draggedFunctionTerm, targetFunctionTerm);
           } else {
             copyFunctionTerm(draggedFunctionTerm, targetFunctionTerm);
           }
        }
      }
    };

    $scope.onDropToScratchpad = function(dragged){
      if (dragged && dragged instanceof BelLib.BaseTerm){
        $scope.editor.termScratchpad.push(angular.copy(dragged));
      }
    };

    $scope.setCurrentSupport = function(support){
      $scope.editor.currentSupport = support;
    };

    var editor = $scope.editor;
    editor.queryErrors = [];
    editor.networkId = $routeParams.networkId;
    editor.network = {};
    editor.networkSummary = {};
    editor.cx = [];

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

    console.log('in edit.js');

    console.log(editor);


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
      this.props = {};
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
        //var edgeIds = Object.keys(jdex.edges);
        var citationEdgeMap = {};
        var supportEdgeMap = {};
        angular.forEach(jdex.edges, function (jdexEdge, jdexEdgeId) {
          angular.forEach(jdexEdge.citationIds, function (citationId) {
            var entry = citationEdgeMap[citationId];
            if (!entry) {
              entry = [];
              citationEdgeMap[citationId] = entry;
            }
            entry.push(jdexEdgeId);
          });
          angular.forEach(jdexEdge.supportIds, function (supportId) {
            var entry = supportEdgeMap[supportId];
            if (!entry) {
              entry = [];
              supportEdgeMap[supportId] = entry;
            }
            entry.push(jdexEdgeId);
          });
        });
        console.log('computed citationEdgeMap and supportEdgeMap');
        var citationSupportMap = {};
        angular.forEach(jdex.supports, function (jdexSupport, jdexSupportId) {
          var citationId = jdexSupport.citationId;
          if (citationId) {
            var entry = citationSupportMap[citationId];
            if (!entry) {
              entry = [];
              citationSupportMap[citationId] = entry;
            }
            entry.push(jdexSupportId);
          }
        });
        console.log('computed citationSupportMap');
        jdex.citationEdgeMap = citationEdgeMap;
        jdex.supportEdgeMap = supportEdgeMap;
        jdex.citationSupportMap = citationSupportMap;

        var model = this;
        console.log(Object.keys(jdex.citations).length + ' citations in source');
        angular.forEach(jdex.citations, function (jdexCitation, jdexCitationId) {
          //console.log('citation: ' + jdexCitationId + ' ' + jdexCitation.identifier);
          var citation = new BelLib.Citation(model);
          citation.fromJdex(jdexCitationId, jdexCitation, jdex);
          model.citations.push(citation);
        });
      },

      toJSON: function(){
        return angular.toJson(this.toCX());

      },

      toCX: function () {
        var cx = new BelLib.CX();

        cx.start();

        angular.forEach(this.namespaces, function (uri, prefix) {
          cx.outputNamespace(prefix, uri);

        });

        angular.forEach(this.citations, function (citation) {
          console.log('citation to CX: ' + citation.identifier);
          cx.outputCitation(citation);
        });

        cx.end();

        return cx.output;
      }
    };

    BelLib.CX = function (model) {
      this.model = model;
      this.contexts = {};
      this.output = [];
      this.functionTermNodeIdMap = {};
      this.nodeIdCounter = 0;
      this.edgeIdCounter = 0;
      this.citationIdCounter = 0;
      this.supportIdCounter = 0;

    };

    /*
     To output a BelLib.Model as CX, create a CX object to translate the model elements to CX
     For each element type in the model, there is an 'output' method - but to use the CX object,
     one only needs to call the following:
     - myCX.start()
     [create pre-metadata]

     - myCX.outputNamespace(namespace)   <repeat for all namespaces>
     - myCX.outputCitation(citation)     <repeat for all selected citations>

     - myCX.end()
     [create post-metadata]
     - myCX.toString()
     [return string to be streamed]

     Internal methods correspond to CX aspects.
     For each aspect required by BEL, there is a method to output an aspect element as a fragment
     These methods all have the form 'emitCXFoo' where 'Foo' is the aspect type
     */
    BelLib.CX.prototype = {

      constructor: BelLib.CX,

      start: function () {
        this.emitNumberVerification();
        this.emitPreMetadata();

      },

      end: function () {
        this.emitCXContext();
        this.emitPostMetadata();

      },

      toJSON: function () {
        return angular.toJson(this.output);
      },

      outputCitation: function (citation) {
        var cxCitationId = this.emitCXCitation(citation.type, citation.uri, citation.title, citation.contributors, citation.identifier, citation.description);
        var cx = this;
        angular.forEach(citation.supports, function (support) {
          cx.outputSupport(cxCitationId, support);
        });

      },

      outputNamespace: function (prefix, uri) {
        this.addCXContext(prefix, uri);
      },

      outputSupport: function (cxCitationId, support) {
        var cxSupportId = this.emitCXSupport(cxCitationId, support.text);
        var cx = this;
        angular.forEach(support.statements, function (statement) {
          cx.outputStatement(statement, cxSupportId);
        });

      },


      outputStatement: function (statement) {
        // case: subject only statement


        // case: subject - object statement
        var sourceId = this.outputTerm(statement.s);
        var targetId = this.outputTerm(statement.o);
        var interaction = statement.r;
        console.log('todo emit edge ' + statement.s + sourceId + ' ' + interaction + ' ' + statement.o + targetId);
        //var edgeId = this.emitCXEdge(sourceId, targetId, interaction);
        //console.log('emitted edge ' + edgeId);
      },

      outputTerm: function (term) {
        console.log('todo output term ' + term);
        return 1;
      },

      // Accumulate Contexts
      addCXContext: function (prefix, uri) {
        this.contexts[prefix] = uri;
        return 2;
      },

      // Numeric Check
      emitNumberVerification: function () {
        this.output.push(
          {
            'numberVerification': [{
              'longNumber': 281474976710655
            }]
          });
      },

      // Pre-Metadata
      emitPreMetadata: function () {
        console.log('todo emit pre-metadata');

      },

      emitPostMetadata: function () {
        console.log('todo emit post-metadata');
      },

      // Aspect Element Methods

      emitCXFragment: function (aspectName, body) {
        var fragment = {};
        fragment[aspectName] = body;
        this.output.push(fragment);
      },

      emitCXContext: function () {
        this.emitCXFragment(
          '@context',
          this.contexts
          );
      },

      emitCXCitation: function (type, title, contributors, identifier, description) {
        this.citationIdCounter = this.citationIdCounter + 1;
        var id = this.citationIdCounter;
        this.emitCXFragment(
          'citations', {
            '@id': id,
            'dc:title': title,
            'dc:contributor': contributors,
            'dc:identifier': identifier,
            'dc:type': type,
            'dc:description': description,
            'attributes': []
          });
        return id;
      },

      emitCXSupport: function (cxCitationId, text) {
        this.supportIdCounter = this.supportIdCounter + 1;
        var id = this.supportIdCounter;
        this.emitCXFragment(
          'supports', {
            '@id': id,
            'citation': cxCitationId,
            'text': text,
            'attributes': []
          });
        return id;
      },

      emitCXEdge: function (sourceId, targetId, interaction) {
        this.edgeIdCounter = this.edgeIdCounter + 1;
        var id = this.edgeIdCounter;
        this.emitCXFragment(
          'edges', {
            '@id': id,
            's': sourceId,
            't': targetId,
            'i': interaction
          });
        return id;
      },

      emitCXEdgeAttribute: function (edgeId, name, value) {
        this.emitCXFragment(
          'edgeAttributes', {
            'po': edgeId,
            'n': name,
            'v': value
          });
      },

      emitCXNode: function (nodeName) {
        this.nodeIdCounter = this.nodeIdCounter + 1;
        var id = this.nodeIdCounter;
        this.emitCXFragment(
          'nodes', {
            '@id': id,
            'name': nodeName
          });
        return id;
      },

      emitCXNodeAttribute: function (nodeId, name, value) {
        this.emitCXFragment(
          'nodeAttributes', {
            'po': nodeId,
            'n': name,
            'v': value
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
      this.title = null;
      this.contributors = [];
      this.identifier = '';
      this.selected = false;
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
        statement.p = this;
      },

      addSupport: function (support) {
        this.supports.push(support);
        support.p = this;
      },

      getAbstract: function () {
        if (this.identifier && this.identifier.indexOf('pmid:') === 0) {
          var pmid = this.identifier.substring('pmid'.length);
          var abstractUrl = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=text&rettype=abstract&id=' + pmid;
          var cit = this;
          $http.get(abstractUrl).then(
            function (response) {
              cit.abstract = response.data;
            },
            function (error) {
              editor.queryErrors.push(error);
            });

        }
      },

      fromJdex: function (jdexCitationId, jdexCitation, jdex) {
        // add the properties from the jdexCitation

        // find the supports that reference the citation id.
        // add each support to the citation

        this.type = jdexCitation.type;
        this.uri = jdexCitation.uri;
        this.identifier = jdexCitation.identifier;
        this.title = jdexCitation.title;
        var contribs = this.contributors;
        if (jdexCitation.contributors) {
          angular.forEach(jdexCitation.contributors, function (contributor) {
            contribs.push(contributor);
          });
        }
        var cit = this;

        console.log('citation: ' + jdexCitationId + ' ' + cit.identifier + ' ' + jdex.name);

        var supportIds = jdex.citationSupportMap[jdexCitationId];
        angular.forEach(supportIds, function (supportId) {
          var support = new BelLib.Support();
          var jdexSupport = jdex.supports[supportId];
          support.fromJdex(supportId, jdexSupport, jdex);
          support.p = cit;
          cit.supports.push(support);
        });

        //var edgeIds = jdex.citationEdgeMap[jdexCitationId];
        /*
         angular.forEach(edgeIds, function(jdexEdgeId){
         console.log('edge = ' + jdexEdgeId);
         var statement = new BelLib.Statement();
         var jdexEdge = jdex.edges[jdexEdgeId];
         statement.fromJdexEdge = (jdexEdgeId, jdexEdge, jdex);
         statement.p = cit;
         cit.statements.push(statement);

         });
         */
        /*
         angular.forEach(jdex.supports, function (jdexSupport, jdexSupportId) {

         if (jdexSupport.citationId == jdexCitationId) {
         //console.log('matched ' + jdexCitationId + ' vs ' + jdexSupport.citationId);
         var support = new BelLib.Support();
         support.fromJdex(jdexSupportId, jdexSupport, jdex, edgeIds, nodeIds);
         support.p = cit;
         cit.supports.push(support);
         }

         });
         */
        /*
         // find the edges that reference the citation id
         // add each edge as a statement unless it has already
         // been handled
         angular.forEach(jdex.edges, function (jdexEdge, jdexEdgeId) {
         if (!edgeIds.contains(jdexEdgeId)) {
         // this was not already handled when processing a statement
         if (jdexEdge.citationIds.contains(jdexCitationId)) {
         var statement = new BelLib.Statement();
         statement.fromJdexEdge = (jdexEdgeId, jdexEdge, jdex, edgeIds);
         statement.p = cit;
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
         statement.p = cit;
         cit.statements.push(statement);
         }
         }

         });

         */
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
      this.p = null;
    };

    BelLib.Support.prototype = {

      constructor: BelLib.Support,

      setText: function (text) {
        this.text = text;
      },

      shortText: function () {
        if (this.text) {
          if (this.text.length <= 70) {
            return this.text;
          } else {
            return this.text.substring(0, 69) + '...';
          }
        } else {
          return '<no text>';
        }
      },

      addStatement: function (statement) {
        this.statements.push(statement);
        statement.p = this;
      },

      fromJdex: function (jdexSupportId, jdexSupport, jdex) {

        this.text = jdexSupport.text;
        var sup = this;

        //console.log('sup: ' + typeof(jdexSupportId) + jdexSupportId + ' ' + sup.text + ' ' + jdex.name);

        var jdexEdgeIds = jdex.supportEdgeMap[jdexSupportId];

        if (jdexEdgeIds) {
          angular.forEach(jdexEdgeIds, function (jdexEdgeId) {
            var jdexEdge = jdex.edges[jdexEdgeId];
            var statement = new BelLib.Statement();
            statement.fromJdexEdge(jdexEdgeId, jdexEdge, jdex);
            statement.p = sup;
            sup.statements.push(statement);
          });
        }

        /*
         // find the edges that reference the support id
         // add each edge as a statement
         angular.forEach(jdex.edges, function (jdexEdge, jdexEdgeId) {
         console.log(jdexEdge.supportIds);
         if (jdexEdge.supportIds.indexOf(jdexSupportId) !== -1) {
         //console.log('stmt from edge: ' + jdexEdgeId);
         //var statement = new BelLib.Statement();
         //statement.fromJdexEdge = (jdexEdgeId, jdexEdge, jdex, edgeIds);
         //statement.p = sup;

         //sup.statements.push(statement);
         }
         });
         */
        /*
         // find the nodes that reference the support id
         // add each node as a statement
         angular.forEach(jdex.nodes, function (jdexNode, jdexNodeId) {
         if (jdexNode.supportIds.includes(jdexSupportId)) {
         var statement = new BelLib.Statement();
         statement.fromJdexNode = (jdexNodeId, jdexNode, jdex, nodeIds);
         statement.p = sup;
         sup.statements.push(statement);
         }
         });
         */
      }
    };

    /*------------------------------------------------
     Statement
     ------------------------------------------------*/

    BelLib.Statement = function () {
      this.s = null;
      this.r = null;
      this.o = null;
      this.p = null;
      this.props = {};
    };

    BelLib.Statement.prototype = {

      constructor: BelLib.Statement,

      setSubject: function (functionTerm) {
        this.s = functionTerm;
      },

      setRelationship: function (term) {
        this.r = term;
      },

      setObject: function (functionTerm) {
        this.o = functionTerm;
      },

      setContext: function (context, value) {
        this.props[context] = value;
      },

      fromJdexEdge: function (jdexEdgeId, jdexEdge, jdex) {
        this.s = BelLib.functionTermFromJdexNodeId(jdexEdge.subjectId, jdex);
        this.r = BelLib.relationshipFromJdexBaseTermId(jdexEdge.predicateId, jdex);
        this.o = BelLib.functionTermFromJdexNodeId(jdexEdge.objectId, jdex);
        this.props = BelLib.propertiesFromJdex(jdexEdge.properties);
      },

      fromJdexNode: function (jdexNodeId, jdexNode, jdex, nodeIds) {
        // This populates only the subject of the statement and its context properties
        this.s = BelLib.functionTermFromJdexNodeId(jdexNodeId, jdex);
        this.props = BelLib.propertiesFromJdex(jdexNode.properties);
        nodeIds.push(jdexNodeId);
      },

      toString: function (mode) {
        var subjectString, relationshipString, objectString;
        if (this.s) {
          subjectString = this.s.toString(mode);
        } else {
          subjectString = 'missing';
        }
        if (this.r) {
          relationshipString = this.r.toString(mode);
        } else {
          relationshipString = 'missing';
        }
        if (this.o) {
          objectString = this.o.toString(mode);
        } else {
          objectString = 'missing';
        }
        return subjectString + ' ' + relationshipString + ' ' + objectString;
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

      fromJdex: function (jdexFunctionTerm, jdex) {
        var functionId = jdexFunctionTerm.functionTermId;
        var parameterIds = jdexFunctionTerm.parameterIds;
        this.function = BelLib.funcFromJdexBaseTermId(functionId, jdex);
        var params = this.parameters;
        angular.forEach(parameterIds, function (id) {
          var p = BelLib.objectFromJdexTermId(id, jdex);
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
      },

      toString: function (mode) {
        var functionString = this.function.toString(mode);
        var pStrings = [];
        angular.forEach(this.parameters, function (param) {
          pStrings.push(param.toString(mode));
        });
        return functionString + '(' + pStrings.join(',') + ')';
      }

    };

    BelLib.functionTermFromJdexNodeId = function (jdexNodeId, jdex) {
      // get the node
      var jdexNode = jdex.nodes[jdexNodeId];
      // get the represented term id and find a function term
      if (jdexNode.represents) {
        return BelLib.objectFromJdexTermId(jdexNode.represents, jdex);
      }
      return null;
    };

    BelLib.functionTermFromJdexTermId = function (jdexTermId, jdex) {
      var jdexFunctionTerm = jdex.functionTerms[jdexTermId];
      if (jdexFunctionTerm) {
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
     FunctionTermTemplate
     ------------------------------------------------*/

    BelLib.FunctionTermTemplate = function(){};
    BelLib.FunctionTermTemplate.prototype = new BelLib.FunctionTerm();

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
      },

      toString: function (mode) {
        if (mode && mode === 'SHORT' &&
          this.prefix &&
          this.prefix === 'bel') {

          return BelLib.abbreviate(this.name);

        } else if (this.prefix) {
          return this.prefix + ':' + this.name;

        } else {
          return this.name;
        }
      }

    };

    /*------------------------------------------------
     Function
     ------------------------------------------------*/
    BelLib.BaseTerm = function(){};
    // inherit Term
    BelLib.BaseTerm.prototype = new BelLib.Term();


    /*------------------------------------------------
     Function
     ------------------------------------------------*/
    BelLib.Func = function(){};
    // inherit Term
    BelLib.Func.prototype = new BelLib.Term();

    /*------------------------------------------------
     Relationship
     ------------------------------------------------*/

    BelLib.Relationship = function(){};

    // inherit Term
    BelLib.Relationship.prototype = new BelLib.Term();

    BelLib.makeRelationship = function (prefix, name) {
      var term = new BelLib.Relationship();
      term.prefix = prefix;
      term.name = name;
      return term;
    };

    BelLib.makeFT = function (fn, parameters) {
      var func = new BelLib.Func();
      func.prefix = 'bel';
      func.name = fn;
      var ft = new BelLib.FunctionTermTemplate();
      ft.function = func;
      ft.parameters = parameters;
      return ft;
    };

    BelLib.blankTerm = function(){
      var blank = new BelLib.BaseTerm();
      blank.name = '?';
      blank.prefix = '?';
      return blank;
    };

    BelLib.functionTermTemplates = [
      BelLib.makeFT('proteinAbundance', [BelLib.blankTerm()]),
      BelLib.makeFT('rnaAbundance', [BelLib.blankTerm()]),
      BelLib.makeFT('abundance', [BelLib.blankTerm()]),
      BelLib.makeFT('kinaseActivity',
        [BelLib.makeFT('proteinAbundance', [BelLib.blankTerm()])])
    ];


    BelLib.abbreviate = function (string) {
      switch (string) {
        case 'abundance':
          return 'a';
        case 'biologicalProcess':
          return 'bp';
        case 'catalyticActivity':
          return 'cat';
        case 'cellSecretion':
          return 'sec';
        case 'cellSurfaceExpression':
          return 'surf';
        case 'chaperoneActivity':
          return 'chap';
        case 'complexAbundance':
          return 'complex';
        case 'compositeAbundance':
          return 'composite';
        case 'degradation':
          return 'deg';
        case 'fusion':
          return 'fus';
        case 'geneAbundance':
          return 'g';
        case 'gtpBoundActivity':
          return 'gtp';
        case 'kinaseActivity':
          return 'kin';
        case 'microRNAAbundance':
          return 'm';
        case 'molecularActivity':
          return 'act';
        case 'pathology':
          return 'path';
        case 'peptidaseActivity':
          return 'pep';
        case 'phosphateActivity':
          return 'phos';
        case 'proteinAbundance':
          return 'p';
        case 'proteinModification':
          return 'pmod';
        case 'reaction':
          return 'rxn';
        case 'ribosylationActivity':
          return 'ribo';
        case 'rnaAbundance':
          return 'r';
        case 'substitution':
          return 'sub';
        case 'translocation':
          return 'tloc';
        case 'transcriptionalActivity':
          return 'tscript';
        case 'transportActivity':
          return 'tport';
        case 'truncation':
          return 'trunc';
        case 'increases':
          return '->';
        case 'decreases':
          return '-|';
        case 'directlyIncreases':
          return '=>';
        case 'directlyDecreases':
          return '=|';
        default:
          return string;
      }
    };

    BelLib.objectFromJdexTermId = function (jdexTermId, jdex) {
      try {
        var object = BelLib.termFromJdexBaseTermId(jdexTermId, jdex);
        if (object) {
          return object;
        }
        object = BelLib.functionTermFromJdexTermId(jdexTermId, jdex);
        if (object) {
          return object;
        }
        object = BelLib.statementFromJdexTermId(jdexTermId, jdex);
        return object;
      }
      catch (err) {
        console.log(err);
        return 'error';
      }
    };

    BelLib.termFromJdexBaseTermId = function (jdexBaseTermId, jdex) {
      var term = null;
      var jdexTerm = jdex.baseTerms[jdexBaseTermId];
      if (jdexTerm) {
        term = new BelLib.BaseTerm();
        term.name = jdexTerm.name;
        if (jdexTerm.namespaceId && jdexTerm.namespaceId !== -1) {
          var namespace = jdex.namespaces[jdexTerm.namespaceId];
          if (namespace) {
            if (namespace.prefix) {
              term.prefix = namespace.prefix;
            }
          } else {
            console.log('namespace is null id ' + jdexTerm.namespaceId + ' for term ' + term.name);
          }
        }
      }
      return term;
    };


    BelLib.funcFromJdexBaseTermId = function (jdexBaseTermId, jdex) {
      var term = null;
      var jdexTerm = jdex.baseTerms[jdexBaseTermId];
      if (jdexTerm) {
        term = new BelLib.Func();
        term.name = jdexTerm.name;
        if (jdexTerm.namespaceId && jdexTerm.namespaceId !== -1) {
          var namespace = jdex.namespaces[jdexTerm.namespaceId];
          if (namespace) {
            if (namespace.prefix) {
              term.prefix = namespace.prefix;
            }
          } else {
            console.log('namespace is null id ' + jdexTerm.namespaceId + ' for term ' + term.name);
          }
        }
      }
      return term;
    };

    BelLib.relationshipFromJdexBaseTermId = function (jdexBaseTermId, jdex) {
      var term = null;
      var jdexTerm = jdex.baseTerms[jdexBaseTermId];
      if (jdexTerm) {
        term = new BelLib.Relationship();
        term.name = jdexTerm.name;
        if (jdexTerm.namespaceId && jdexTerm.namespaceId !== -1) {
          var namespace = jdex.namespaces[jdexTerm.namespaceId];
          if (namespace) {
            if (namespace.prefix) {
              term.prefix = namespace.prefix;
            }
          } else {
            console.log('namespace is null id ' + jdexTerm.namespaceId + ' for term ' + term.name);
          }
        }
      }
      return term;
    };

    BelLib.statementFromJdexTermId = function (jdexTermId, jdex) {
      console.log('reified edge term ' + jdexTermId + ' ' + jdex.name);
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


    var getNetwork = function (callback) {
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

    editor.relationships = [
      BelLib.makeRelationship('bel', 'increases'),
      BelLib.makeRelationship('bel', 'decreases'),
      BelLib.makeRelationship('bel', 'directlyIncreases'),
      BelLib.makeRelationship('bel', 'directlyDecreases')
    ];

    editor.functionTermTemplates = BelLib.functionTermTemplates;
    console.log(editor.functionTermTemplates);

    editor.toCX = function(){
      if (editor.model){
        editor.cx = editor.model.toCX();
        cx = editor.cx;
      }
    };

    var buildModel = function () {
      $scope.editor.model = null;
      cm = new BelLib.Model();
      console.log('got summary ' + editor.networkSummary.name);
      console.log('got network ' + editor.network.name);
      console.log('about to load bel model from ' + editor.network.name);
      cm.fromJdex(editor.network);
      $scope.editor.model = cm;
    };

    if (editor.networkId) {

      ndexService.getNetworkSummary(editor.networkId)
        .success(
        function (networkSummary) {
          cns = networkSummary;
          editor.queryErrors = [];
          editor.networkSummary = networkSummary;
          console.log('success for networkSummary = ' + editor.networkSummary.name);
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
