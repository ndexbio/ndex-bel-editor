'use strict';

describe('Service: ndexService', function () {

  // load the service's module
  beforeEach(module('netWorkBenchApp'));

  // instantiate service
  var ndexService;
  beforeEach(inject(function (_ndexService_) {
    ndexService = _ndexService_;
  }));

  it('should do something', function () {
    expect(!!ndexService).toBe(true);
  });

});
