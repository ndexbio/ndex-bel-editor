'use strict';

describe('Service: Bp2ModelService', function () {

  // load the service's module
  beforeEach(module('belEditApp'));

  // instantiate service
  var Bp2ModelService;
  beforeEach(inject(function (_Bp2ModelService_) {
    Bp2ModelService = _Bp2ModelService_;
  }));

  it('should do something', function () {
    expect(!!Bp2ModelService).toBe(true);
  });

});
