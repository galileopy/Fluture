import chai from 'chai';
import * as fn from '../../src/internal/utils.mjs';

var expect = chai.expect;

describe('fn', function (){

  describe('.setImmediateFallback()', function (){

    it('calls the function with a value in under 25ms', function (done){
      var t = setTimeout(done, 25, new Error('Time is up'));
      fn.setImmediateFallback(function (x){
        expect(x).to.equal(42);
        clearTimeout(t);
        done();
      }, 42);
    });

  });

});
