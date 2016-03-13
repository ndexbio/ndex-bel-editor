'use strict';

/**
 * @ngdoc service
 * @name belEditApp.BelTranslateService
 * @description
 * # BelTranslateService
 * Service in the belEditApp.
 */
angular.module('belEditApp')
  .service('BelTranslateService',
  [
    '$http',
    function ($http) {

    this.debug = null;


    /*

     The statement model is based around a set of citations
     Each citation may have statements and supports
     supports can have statements
     a statement can only belong to one parent, either a citation or a support
     each statement is either
      - a term - a BEL function term with context properties
     OR
      - a relationship between terms, with context properties.

     */


    this.Model = function () {
      this.citations = [];
      this.props = {};
      this.namespaces = {};
    };

    this.Model.prototype = {

      constructor: this.Model,

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

        // Process edges
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
          var citation = new this.Citation(model);
          citation.fromJdex(jdexCitationId, jdexCitation, jdex);
          model.citations.push(citation);
        });
      }
    };


    /*------------------------------------------------
     Citation
     ------------------------------------------------*/
    this.Citation = function (model) {
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

    this.Citation.prototype = {

      constructor: this.Citation,

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
              console.log('error getting abstract: ' + error);
              //editor.queryErrors.push(error);
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
          var support = new this.Support();
          var jdexSupport = jdex.supports[supportId];
          support.fromJdex(supportId, jdexSupport, jdex);
          support.p = cit;
          cit.supports.push(support);
        });


      }

    };

    /*------------------------------------------------
     Support
     ------------------------------------------------*/
    this.Support = function () {
      this.citation = null;
      this.statements = [];
      this.text = '';
      this.p = null;
    };

    this.Support.prototype = {

      constructor: this.Support,

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
            var statement = new this.Statement();
            statement.fromJdexEdge(jdexEdgeId, jdexEdge, jdex);
            statement.p = sup;
            sup.statements.push(statement);
          });
        }

      }
    };

    /*------------------------------------------------
     Statement
     ------------------------------------------------*/

    this.Statement = function () {
      this.s = null;
      this.r = null;
      this.o = null;
      this.p = null;
      this.props = {};
    };

    this.Statement.prototype = {

      constructor: this.Statement,

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
        this.s = this.functionTermFromJdexNodeId(jdexEdge.subjectId, jdex);
        this.r = this.relationshipFromJdexBaseTermId(jdexEdge.predicateId, jdex);
        this.o = this.functionTermFromJdexNodeId(jdexEdge.objectId, jdex);
        this.props = this.propertiesFromJdex(jdexEdge.properties);
      },

      fromJdexNode: function (jdexNodeId, jdexNode, jdex, nodeIds) {
        // This populates only the subject of the statement and its context properties
        this.s = this.functionTermFromJdexNodeId(jdexNodeId, jdex);
        this.props = this.propertiesFromJdex(jdexNode.properties);
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

    this.propertiesFromJdex = function (jdexProperties) {
      var props = {};
      angular.forEach(jdexProperties, function (jdexProperty) {
        props[jdexProperty.name] = jdexProperty.valueString;
      });
      return props;
    };

    /*------------------------------------------------
     FunctionTerm
     ------------------------------------------------*/

    this.FunctionTerm = function () {
      this.function = null;
      this.parameters = [];
    };

    this.FunctionTerm.prototype = {

      constructor: this.FunctionTerm,

      setFunction: function (term) {
        this.function = term;
      },

      setParameters: function (parameters) {
        this.parameters = parameters;
      },

      fromJdex: function (jdexFunctionTerm, jdex) {
        var functionId = jdexFunctionTerm.functionTermId;
        var parameterIds = jdexFunctionTerm.parameterIds;
        this.function = this.funcFromJdexBaseTermId(functionId, jdex);
        var params = this.parameters;
        angular.forEach(parameterIds, function (id) {
          var p = this.objectFromJdexTermId(id, jdex);
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
        return this.functionTermIdentifier(this.termFunction, this.parameters);
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

    this.functionTermFromJdexNodeId = function (jdexNodeId, jdex) {
      // get the node
      var jdexNode = jdex.nodes[jdexNodeId];
      // get the represented term id and find a function term
      if (jdexNode.represents) {
        return this.objectFromJdexTermId(jdexNode.represents, jdex);
      }
      return null;
    };

    this.functionTermFromJdexTermId = function (jdexTermId, jdex) {
      var jdexFunctionTerm = jdex.functionTerms[jdexTermId];
      if (jdexFunctionTerm) {
        var functionTerm = new this.FunctionTerm();
        // create a function term and populate it from jdex
        functionTerm.fromJdex(jdexFunctionTerm, jdex);
        return functionTerm;
      }
      return false;

    };

    this.functionTermIdentifier = function (termFunction, parameters) {
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

    this.FunctionTermTemplate = function(){};
    this.FunctionTermTemplate.prototype = new this.FunctionTerm();

    /*------------------------------------------------
     Term
     ------------------------------------------------*/
    this.Term = function () {
      this.prefix = null;
      this.name = null;
    };

    this.Term.prototype = {

      constructor: this.Term,

      setName: function (string) {
        this.name = string;
      },

      toString: function (mode) {
        if (mode && mode === 'SHORT' &&
          this.prefix &&
          this.prefix === 'bel') {

          return this.abbreviate(this.name);

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
    this.BaseTerm = function(){};
    // inherit Term
    this.BaseTerm.prototype = new this.Term();


    /*------------------------------------------------
     Function
     ------------------------------------------------*/
    this.Func = function(){};
    // inherit from Term
    this.Func.prototype = new this.Term();

    /*------------------------------------------------
     Relationship
     ------------------------------------------------*/

    this.Relationship = function(){};

    // inherit from Term
    this.Relationship.prototype = new this.Term();

    this.makeRelationship = function (prefix, name) {
      var term = new this.Relationship();
      term.prefix = prefix;
      term.name = name;
      return term;
    };

    this.makeFT = function (fn, parameters) {
      var func = new this.Func();
      func.prefix = 'bel';
      func.name = fn;
      var ft = new this.FunctionTermTemplate();
      ft.function = func;
      ft.parameters = parameters;
      return ft;
    };

    this.blankTerm = function(){
      var blank = new this.BaseTerm();
      blank.name = '?';
      blank.prefix = '?';
      return blank;
    };

    this.functionTermTemplates = [
      this.makeFT('proteinAbundance', [this.blankTerm()]),
      this.makeFT('rnaAbundance', [this.blankTerm()]),
      this.makeFT('abundance', [this.blankTerm()]),
      this.makeFT('kinaseActivity',
        [this.makeFT('proteinAbundance', [this.blankTerm()])])
    ];


    this.abbreviate = function (string) {
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

    this.objectFromJdexTermId = function (jdexTermId, jdex) {
      try {
        var object = this.termFromJdexBaseTermId(jdexTermId, jdex);
        if (object) {
          return object;
        }
        object = this.functionTermFromJdexTermId(jdexTermId, jdex);
        if (object) {
          return object;
        }
        object = this.statementFromJdexTermId(jdexTermId, jdex);
        return object;
      }
      catch (err) {
        console.log(err);
        return 'error';
      }
    };

    this.termFromJdexBaseTermId = function (jdexBaseTermId, jdex) {
      var term = null;
      var jdexTerm = jdex.baseTerms[jdexBaseTermId];
      if (jdexTerm) {
        term = new this.BaseTerm();
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


    this.funcFromJdexBaseTermId = function (jdexBaseTermId, jdex) {
      var term = null;
      var jdexTerm = jdex.baseTerms[jdexBaseTermId];
      if (jdexTerm) {
        term = new this.Func();
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

    this.relationshipFromJdexBaseTermId = function (jdexBaseTermId, jdex) {
      var term = null;
      var jdexTerm = jdex.baseTerms[jdexBaseTermId];
      if (jdexTerm) {
        term = new this.Relationship();
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

    this.statementFromJdexTermId = function (jdexTermId, jdex) {
      console.log('reified edge term ' + jdexTermId + ' ' + jdex.name);
    };


    /*------------------------------------------------
     Namespace
     ------------------------------------------------*/

    this.Namespace = function () {
      this.uri = null;
      this.prefix = null;
    };

    this.Namespace.prototype = {

      constructor: this.Namespace,

      setPrefix: function (string) {
        this.prefix = string;
      },

      setUri: function (string) {
        this.uri = string;
      }
    };

    /*------------------------------------------------
     CX -> Statement Model Translator
     ------------------------------------------------*/
    this.CXInputTranslator = function(cx){
      this.cx = cx;
      this.model = new this.Model();
    };

    this.CXInputTranslator.prototype = {
      constructor: this.CXTranslator,

      translate: function(){
        angular.forEach(this.cx, function(fragment){
          this.addFragment(fragment);
        });
      },

      addFragment: function(fragment){
        angular.forEach(fragment.items, function(element, aspectName){
          this.addCxElement(aspectName, element);
        });
      },

      addCxElement: function(aspectName, element) {
        if (aspectName === 'nodes') {
          this.handleCxNode(element);
        } else if (aspectName === 'edges') {
          this.handleCxEdge(element);
        } else if (aspectName === 'nodeAttributes') {
          this.handleCxNodeAttribute(element);
        } else if (aspectName === 'edgeAttributes') {
          this.handleCxNode(element);
        } else if (aspectName === 'supports') {
          this.handleCxSupport(element);
        } else if (aspectName === 'citations') {
          this.handleCxCitation(element);
        } else if (aspectName === 'networkAttributes') {
          this.handleCxNetworkAttribute(element);
        }
      },

      handleCxNode: function(element){
        console.log(element);
      },

      handleCxEdge: function(element){
        console.log(element);

      },

      handleCxNodeAttribute: function(element){
        console.log(element);

      },

      handleCxEdgeAttribute: function(element){
        console.log(element);

      },

      handleCxSupport: function(element){
        console.log(element);

      },

      handleCxCitation: function(element){
        console.log(element);

      },

      handleCxNetworkAttribute: function(element){
        console.log(element);

      }
    };

    /*------------------------------------------------
     Statement Model -> CX Translator
     ------------------------------------------------*/

    this.CXTranslator = function (model) {
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
     To output a this.Model as CX, create a CXTranslator object to translate the model elements to CX
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
    this.CXTranslator.prototype = {

      constructor: this.CXTranslator,

      translate: function(statementModel){

          this.start();

          angular.forEach(statementModel.namespaces, function (uri, prefix) {
            this.outputNamespace(prefix, uri);

          });

          angular.forEach(statementModel.citations, function (citation) {
            console.log('citation to CX: ' + citation.identifier);
            this.outputCitation(citation);
          });

          this.end();

          return this.output;

      },

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
     Service Methods
     ------------------------------------------------*/


    this.cxToSm = function(cx){
      var myCxInputTranslator = new this.CxInputTranslator(cx);
      myCxInputTranslator.translate();
      return myCxInputTranslator.model;
    };

    this.smToCx = function(sm){
      var myCxTranslator = new this.CXTranslator(sm);
      myCxTranslator.translate();
      return myCxTranslator.toJSON();
    };

  }]);
