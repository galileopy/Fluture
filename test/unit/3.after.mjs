import {after, never} from '../../index.mjs';
import {eq, assertValidFuture, assertResolved, failRej, failRes} from '../util/util.mjs';
import {testFunction, positiveIntegerArg, anyArg} from '../util/props.mjs';

describe('after()', function (){

  testFunction('after', after, [positiveIntegerArg, anyArg], assertValidFuture);

  it('returns Never when given Infinity', function (){
    eq(after(Infinity)(1), never);
  });

  describe('#_interpret()', function (){
    it('resolves with the given value', function (){
      return assertResolved(after(20)(1), 1);
    });

    it('clears its internal timeout when cancelled', function (done){
      after(20)(1)._interpret(done, failRej, failRes)();
      setTimeout(done, 25);
    });
  });

  describe('#extractRight()', function (){
    it('returns array with the value', function (){
      eq(after(20)(1).extractRight(), [1]);
    });
  });

  describe('#toString()', function (){
    it('returns the code to create the After', function (){
      eq(after(20)(1).toString(), 'after (20) (1)');
    });
  });

});
