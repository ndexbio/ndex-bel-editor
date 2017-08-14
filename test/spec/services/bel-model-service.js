'use strict';

describe('Service: BelModelService', function () {

  // load the service's module
  beforeEach(module('netWorkBenchApp'));

  // instantiate service
  var BelModelService;
  beforeEach(inject(function (_BelModelService_) {
    BelModelService = _BelModelService_;
  }));

  it('should do something', function () {
    expect(!!BelModelService).toBe(true);
  });

});
