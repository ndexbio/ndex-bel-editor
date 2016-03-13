'use strict';

describe('Service: CytoscapejsService', function () {

  // load the service's module
  beforeEach(module('belEditApp'));

  // instantiate service
  var CytoscapejsService;
  beforeEach(inject(function (_CytoscapejsService_) {
    CytoscapejsService = _CytoscapejsService_;
  }));

  it('should do something', function () {
    expect(!!CytoscapejsService).toBe(true);
  });

});
