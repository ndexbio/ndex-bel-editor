'use strict';

describe('Service: ReachService', function () {

  // load the service's module
  beforeEach(module('belPlus2App'));

  // instantiate service
  var ReachService;
  beforeEach(inject(function (_ReachService_) {
    ReachService = _ReachService_;
  }));

  it('should do something', function () {
    expect(!!ReachService).toBe(true);
  });

});
