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
  .controller('EditCtrl', ['ndexService', '$routeParams', '$scope', '$http', function (ndexService, $routeParams, $scope, $http) {

    $scope.editor = {};
    $scope.foo = 'this is foo';
    $scope.oneAtATime = false;

    var editor = $scope.editor;
    editor.queryErrors = [];
    editor.networkId = $routeParams.networkId;
    editor.network = {};
    editor.networkSummary = {};
    if (!editor.networkId) {
      // 85e2ada9-8bfd-11e5-b435-06603eb7f303
      editor.networkId = '85e2ada9-8bfd-11e5-b435-06603eb7f303';   // test file around BCL2 and BAD
      //editor.networkId = '55c84fa4-01b4-11e5-ac0f-000c29cb28fb'; // small corpus
    }

    editor.ndexUri = ndexService.getNdexServerUri();

    editor.handleCheckboxClick = function(citation){
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
          console.log('citation: ' + jdexCitationId + ' ' + jdexCitation.identifier);
          var citation = new BelLib.Citation(model);
          citation.fromJdex(jdexCitationId, jdexCitation, jdex);
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

        console.log('sup: ' + typeof(jdexSupportId) + jdexSupportId + ' ' + sup.text + ' ' + jdex.name);

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
        this.r = BelLib.termFromJdexBaseTermId(jdexEdge.predicateId, jdex);
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
        this.function = BelLib.termFromJdexBaseTermId(functionId, jdex);
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
        term = new BelLib.Term();
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



    var buildModel = function () {
      cm = new BelLib.Model();
      console.log('got summary ' + editor.networkSummary.name);
      console.log('got network ' + editor.network.name);
      console.log('about to load bel model from ' + editor.network.name);
      cm.fromJdex(editor.network);
      $scope.editor.model = cm;
    };

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

  }])
;
