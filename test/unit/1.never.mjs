import {never} from '../../index.mjs';
import {assertValidFuture, noop, eq} from '../util/util.mjs';

describe('never', function (){

  it('is a Future', function (){
    assertValidFuture(never);
  });

  describe('#_interpret()', function (){

    it('does nothing and returns a noop cancel function', function (){
      var m = never;
      var cancel = m._interpret(noop, noop, noop);
      cancel();
    });

  });

  describe('#toString()', function (){

    it('returns the code to create the Never', function (){
      var m = never;
      eq(m.toString(), 'never');
    });

  });

});
