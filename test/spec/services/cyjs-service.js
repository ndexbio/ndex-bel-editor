'use strict';

describe('Service: CyjsService', function () {

  // load the service's module
  beforeEach(module('netWorkBenchApp'));

  // instantiate service
  var CyjsService;
  beforeEach(inject(function (_CyjsService_) {
    CyjsService = _CyjsService_;
  }));

  it('should do something', function () {
    expect(!!CyjsService).toBe(true);
  });

});
