'use strict';

describe('Service: PMCService', function () {

  // load the service's module
  beforeEach(module('belPlus2App'));

  // instantiate service
  var PMCService;
  beforeEach(inject(function (_PMCService_) {
    PMCService = _PMCService_;
  }));

  it('should do something', function () {
    expect(!!PMCService).toBe(true);
  });

});