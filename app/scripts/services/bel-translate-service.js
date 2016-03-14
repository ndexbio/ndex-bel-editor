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

      var SM = {};


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


      SM.Model = function () {
        this.citations = [];
        this.props = {};
        this.namespaces = {};
      };

      SM.Model.prototype = {

        constructor: SM.Model,

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
      SM.Citation = function (model) {
        this.model = model;
        this.supports = [];
        this.statements = [];
        this.type = null;
        this.title = null;
        this.contributors = [];
        this.identifier = '';
        this.description = null;
        this.selected = false;
      };

      SM.Citation.prototype = {

        constructor: SM.Citation,

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
        }

        /*
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
         */

      };

      /*------------------------------------------------
       Support
       ------------------------------------------------*/
      SM.Support = function () {
        this.citation = null;
        this.statements = [];
        this.text = '';
        this.p = null;
      };

      SM.Support.prototype = {

        constructor: SM.Support,

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
        }

        /*
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
         */
      };

      /*------------------------------------------------
       Statement
       ------------------------------------------------*/

      SM.Statement = function () {
        this.s = null;
        this.r = null;
        this.o = null;
        this.p = null;
        this.props = {};
      };

      SM.Statement.prototype = {

        constructor: SM.Statement,

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

        /*
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
         */
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
      /*
       this.propertiesFromJdex = function (jdexProperties) {
       var props = {};
       angular.forEach(jdexProperties, function (jdexProperty) {
       props[jdexProperty.name] = jdexProperty.valueString;
       });
       return props;
       };
       */
      /*------------------------------------------------
       FunctionTerm
       ------------------------------------------------*/

      SM.FunctionTerm = function () {
        this.function = null;
        this.parameters = [];
      };

      SM.FunctionTerm.prototype = {

        constructor: this.FunctionTerm,

        setFunction: function (term) {
          this.function = term;
        },

        setParameters: function (parameters) {
          this.parameters = parameters;
        },

        /*
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
         */
        identifier: function () {
          return SM.functionTermIdentifier(this.function, this.parameters);
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

      /*
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
       */
      SM.functionTermIdentifier = function (termFunction, parameters) {
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

      SM.FunctionTermTemplate = function () {
      };
      SM.FunctionTermTemplate.prototype = new SM.FunctionTerm();

      /*------------------------------------------------
       Term
       ------------------------------------------------*/
      SM.Term = function () {
        this.prefix = null;
        this.name = null;
      };

      SM.Term.prototype = {

        constructor: SM.Term,

        setName: function (string) {
          this.name = string;
        },

        toString: function (mode) {
          if (mode && mode === 'SHORT' &&
            this.prefix &&
            this.prefix === 'bel') {

            return SM.abbreviate(this.name);

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
      SM.BaseTerm = function () {
      };
      // inherit Term
      SM.BaseTerm.prototype = new SM.Term();


      /*------------------------------------------------
       Function
       ------------------------------------------------*/
      SM.Func = function () {
      };
      // inherit from Term
      SM.Func.prototype = new SM.Term();

      /*------------------------------------------------
       Relationship
       ------------------------------------------------*/

      SM.Relationship = function () {
      };

      // inherit from Term
      SM.Relationship.prototype = new SM.Term();

      SM.makeRelationship = function (inputString) {
        var term = new SM.Relationship();
        var result = inputString.split(':');
        if (result.length === 1){
          term.name = result[0];
        } else {
          term.prefix = result[0];
          term.name = result[1];
        }

        return term;
      };

      SM.makeFT = function (fn, args) {
        var func = new SM.Func();
        var result = fn.split(':');
        if (result.length === 1){
          func.name = result[0];
        } else {
          func.prefix = result[0];
          func.name = result[1];
        }
        var ft = new SM.FunctionTermTemplate();
        ft.function = func;
        ft.parameters = [];
        for (var i= 0; i < args.length; i++){
          console.log('arg: ' + JSON.stringify(args[i]));
          ft.parameters.push(SM.makeTerm(args[i]));
        }

        return ft;
      };

      SM.makeTerm = function(parameter){
        if (typeof parameter === 'object') {
          return SM.makeFT(parameter.f, parameter.args);
        } else {
          return SM.makeBaseTerm(parameter);
        }
      };

      SM.makeBaseTerm = function(inputString){
        var term = new SM.Term();
        var result = inputString.split(':');
        if (result.length === 1){
          term.name = result[0];
        } else {
          term.prefix = result[0];
          term.name = result[1];
        }
        return term;
      };

      SM.blankTerm = function () {
        var blank = new SM.BaseTerm();
        blank.name = '?';
        blank.prefix = '?';
        return blank;
      };


      SM.abbreviate = function (string) {
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

      /*
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
       */

      /*------------------------------------------------
       Namespace
       ------------------------------------------------*/

      SM.Namespace = function () {
        this.uri = null;
        this.prefix = null;
      };

      SM.Namespace.prototype = {

        constructor: SM.Namespace,

        setPrefix: function (string) {
          this.prefix = string;
        },

        setUri: function (string) {
          this.uri = string;
        }
      };

      /*------------------------------------------------
       Cx -> Statement Model Translator
       ------------------------------------------------*/
      SM.CxInputTranslator = function (cx) {
        this.cx = cx;
        this.model = new SM.Model();
        this.idCitationMap = {};
        this.idSupportMap = {};
        this.idStatementMap = {};
        this.idFunctionTermMap = {};
        //this.log = log;
        console.log('translator created');
      };

      SM.CxInputTranslator.prototype = {
        constructor: SM.CxTranslator,

        translate: function () {
          for (var i = 0; i < this.cx.length; i++) {
            var fragment = this.cx[i];
            if (fragment) {
              var aspectName;
              for (aspectName in fragment) {
                var items = fragment[aspectName];
                for (var j = 0; j < items.length; j++) {
                  var item = items[j];
                  this.handleCxElement(aspectName, item);
                }
              }
            }
          }
        },


        handleCxElement: function (aspectName, element) {
          console.log('aspect ' + aspectName);
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
          } else if (aspectName === 'nodeCitations') {
            this.handleCxNodeCitation(element);
          } else if (aspectName === 'edgeCitations') {
            this.handleCxEdgeCitation(element);
          } else if (aspectName === 'nodeSupports') {
            this.handleCxNodeSupport(element);
          } else if (aspectName === 'edgeSupports') {
            this.handleCxEdgeSupport(element);
          } else if (aspectName === 'functionTerms') {
            this.handleCxFunctionTerm(element);
          }
          // for each statement,
          // find the function terms for the subject and object
          // and copy the structures in place of the ids.
          for (var statementId in this.idStatementMap){
            var statement = this.idStatementMap[statementId];
            var subject = this.idFunctionTermMap[statement.s];
            var object = this.idFunctionTermMap[statement.o];
            if (subject){
              statement.s = Object.assign({}, subject);
            }

            if (object){
              statement.o = Object.assign({}, object);
            }
          }
        },

        findOrCreateCitation: function(id){
          var citation = this.idCitationMap[id];
          if (!citation){
            citation = new SM.Citation();
            this.idCitationMap[id] = citation;
            this.model.citations.push(citation);
          }
          return citation;
        },

        findOrCreateSupport: function(id){
          var support = this.idSupportMap[id];
          if (!support){
            support = new SM.Support();
            this.idSupportMap[id] = support;
          }
          return support;
        },

        // This is used with the CX edge id that corresponds to the statement
        findOrCreateStatement: function(id){
          var statement = this.idStatementMap[id];
          if (!statement){
            statement = new SM.Statement();
            this.idStatementMap[id] = statement;
          }
          return statement;
        },

        /*
         this.type <-> dc:type
         this.title <-> dc:title
         this.contributors = [];  <-> dc:contributor
         this.identifier = ''; <-> dc:identifier
         this.description <-> dc:description
         */
        handleCxCitation: function (element) {
          var citId = element['@id'];
          console.log('citation ' + citId);
          var citation = this.findOrCreateCitation(citId);

          if (element['dc:title']){
            citation.title = element['dc:title'];
          }
          if (element['dc:identifier']){
            citation.identifier = element['dc:identifier'];
          }
          if (element['dc:type']){
            citation.type = element['dc:title'];
          }
          if (element['dc:description']){
            citation.identifier = element['dc:description'];
          }
          var contrib = element['dc:contributor'];
          if (contrib){
            if (Array.isArray(contrib)){
              citation.contributors = contrib;
            } else {
              citation.contributors.push(contrib);
            }
          }
        },

        handleCxSupport: function (element) {
          var supportId = element['@id'];
          console.log('support ' + supportId);
          var support = this.findOrCreateSupport(supportId);
          support.text = element.text;
          if (element.citation){
            var citation = this.findOrCreateCitation(element.citation);
            support.citation = citation;
            citation.addSupport(support);
          }
          return support;
        },

        handleCxFunctionTerm: function(element){
          var nodeId = element.po;
          console.log('ft for node ' + nodeId + ' ' + element.f + ' ' + JSON.stringify(element.args));
          this.idFunctionTermMap[nodeId] = new SM.makeFT(element.f, element.args);
        },

        handleCxEdge: function (element) {
          var statementId = element['@id'];
          console.log('edge ' + statementId);
          var statement = this.findOrCreateStatement(statementId);
          statement.s = element.s;
          statement.o = element.t;
          statement.r = SM.makeRelationship(element.i);
          return statement;
        },

        handleCxEdgeAttribute: function (element) {
          var statementId = element.po;
          console.log('edge att ' + element.po + ' ' + element.n + ' = ' + element.v);
          var statement = this.findOrCreateStatement(statementId);
          statement.props[element.n] = element.v;
        },

        handleCxEdgeCitation: function (element) {
          var statementId = element.po;
          var citationId = element.citations[0];
          console.log('edge citation ' + element.po + ' ' + JSON.stringify(element.citations));
          var statement = this.findOrCreateStatement(statementId);
          var citation = this.findOrCreateCitation(citationId);
          citation.addStatement(statement);

        },

        handleCxEdgeSupport: function (element) {
          console.log('edge support ' + element.po + ' ' + JSON.stringify(element.supports));
          var statementId = element.po;
          var supportId = element.supports[0];
          var statement = this.findOrCreateStatement(statementId);
          var support = this.findOrCreateSupport(supportId);
          support.addStatement(statement);

        },

        handleCxNode: function (element) {
          console.log('node ' + element['@id']);
          // Do Nothing
        },

        handleCxNodeAttribute: function (element) {
          console.log('node att ' + element.po + ' ' + element.n + ' = ' + element.v);
          // do Nothing at this time
          // TODO: handle 'subject only' statements

        },

        handleCxNodeCitation: function (element) {
          console.log('node citation ' + element.po + ' ' + JSON.stringify(element.citations));
          // do Nothing at this time
          // TODO: handle 'subject only' statements

        },

        handleCxNodeSupport: function (element) {
          console.log('node support ' + element.po + ' ' + JSON.stringify(element.supports));
          // do Nothing at this time
          // TODO: handle 'subject only' statements

        },

        handleCxNetworkAttribute: function (element) {
          console.log('net att' + element.n + ' = ' + element.v);

        }
      };

      /*------------------------------------------------
       Statement Model -> Cx Translator
       ------------------------------------------------*/

      SM.CxTranslator = function (model) {
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
       To output a this.Model as Cx, create a CxTranslator object to translate the model elements to Cx
       For each element type in the model, there is an 'output' method - but to use the Cx object,
       one only needs to call the following:
       - myCx.start()
       [create pre-metadata]

       - myCx.outputNamespace(namespace)   <repeat for all namespaces>
       - myCx.outputCitation(citation)     <repeat for all selected citations>

       - myCx.end()
       [create post-metadata]
       - myCx.toString()
       [return string to be streamed]

       Internal methods correspond to Cx aspects.
       For each aspect required by BEL, there is a method to output an aspect element as a fragment
       These methods all have the form 'emitCxFoo' where 'Foo' is the aspect type
       */
      SM.CxTranslator.prototype = {

        constructor: SM.CxTranslator,

        translate: function () {

          this.start();

          angular.forEach(this.model.namespaces, function (uri, prefix) {
            this.outputNamespace(prefix, uri);

          });

          angular.forEach(this.model.citations, function (citation) {
            console.log('citation to Cx: ' + citation.identifier);
            this.outputCitation(citation);
          });

          this.end();

        },

        start: function () {
          this.emitNumberVerification();
          this.emitPreMetadata();

        },

        end: function () {
          this.emitCxContext();
          this.emitPostMetadata();

        },

        toJSON: function () {
          return angular.toJson(this.output);
        },

        outputCitation: function (citation) {
          var cxCitationId = this.emitCxCitation(citation.type, citation.uri, citation.title, citation.contributors, citation.identifier, citation.description);
          var cx = this;
          angular.forEach(citation.supports, function (support) {
            cx.outputSupport(cxCitationId, support);
          });

        },

        outputNamespace: function (prefix, uri) {
          this.addCxContext(prefix, uri);
        },

        outputSupport: function (cxCitationId, support) {
          var cxSupportId = this.emitCxSupport(cxCitationId, support.text);
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
          //var edgeId = this.emitCxEdge(sourceId, targetId, interaction);
          //console.log('emitted edge ' + edgeId);
        },

        outputTerm: function (term) {
          console.log('todo output term ' + term);
          return 1;
        },

        // Accumulate Contexts
        addCxContext: function (prefix, uri) {
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

        emitCxFragment: function (aspectName, body) {
          var fragment = {};
          fragment[aspectName] = body;
          this.output.push(fragment);
        },

        emitCxContext: function () {
          this.emitCxFragment(
            '@context',
            this.contexts
          );
        },

        emitCxCitation: function (type, title, contributors, identifier, description) {
          this.citationIdCounter = this.citationIdCounter + 1;
          var id = this.citationIdCounter;
          this.emitCxFragment(
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

        emitCxSupport: function (cxCitationId, text) {
          this.supportIdCounter = this.supportIdCounter + 1;
          var id = this.supportIdCounter;
          this.emitCxFragment(
            'supports', {
              '@id': id,
              'citation': cxCitationId,
              'text': text,
              'attributes': []
            });
          return id;
        },

        emitCxEdge: function (sourceId, targetId, interaction) {
          this.edgeIdCounter = this.edgeIdCounter + 1;
          var id = this.edgeIdCounter;
          this.emitCxFragment(
            'edges', {
              '@id': id,
              's': sourceId,
              't': targetId,
              'i': interaction
            });
          return id;
        },

        emitCxEdgeAttribute: function (edgeId, name, value) {
          this.emitCxFragment(
            'edgeAttributes', {
              'po': edgeId,
              'n': name,
              'v': value
            });
        },

        emitCxNode: function (nodeName) {
          this.nodeIdCounter = this.nodeIdCounter + 1;
          var id = this.nodeIdCounter;
          this.emitCxFragment(
            'nodes', {
              '@id': id,
              'name': nodeName
            });
          return id;
        },

        emitCxNodeAttribute: function (nodeId, name, value) {
          this.emitCxFragment(
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


      this.cxToSm = function (cx, log) {
        log.push('about to instantiate CxInputTranslator');
        var myCxInputTranslator = new SM.CxInputTranslator(cx);
        log.push('about to call CxInputTranslator.translate()');
        myCxInputTranslator.translate();
        return myCxInputTranslator.model;
      };

      this.smToCx = function (sm) {
        var myCxTranslator = new SM.CxTranslator(sm);
        myCxTranslator.translate();
        return myCxTranslator.toJSON();
      };

      this.makeFunctionTermTemplates = function () {
        return [
          SM.makeFT('bel:proteinAbundance', ['?:?']),
          SM.makeFT('bel:rnaAbundance', ['?:?']),
          SM.makeFT('bel:abundance', ['?:?']),
          SM.makeFT('bel:kinaseActivity', [{'f': 'bel:proteinAbundance', 'args': ['?:?']}])
        ];
      };

      this.makeRelationship = function (prefix, name) {
        return SM.makeRelationship(prefix, name);
      };

    }]);
