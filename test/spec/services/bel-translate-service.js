'use strict';

describe('Service: BelTranslateService', function () {

  // load the service's module
  beforeEach(module('belEditApp'));

  // instantiate service
  var BelTranslateService;
  beforeEach(inject(function (_BelTranslateService_) {
    BelTranslateService = _BelTranslateService_;
  }));

  it('should do something', function () {
    expect(!!BelTranslateService).toBe(true);
  });

});
