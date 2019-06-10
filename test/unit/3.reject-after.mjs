import {rejectAfter, never} from '../../index.mjs';
import {eq, assertValidFuture, assertRejected, failRej, failRes} from '../util/util.mjs';
import {testFunction, positiveIntegerArg, anyArg} from '../util/props.mjs';

describe('rejectAfter()', function (){

  testFunction('rejectAfter', rejectAfter, [positiveIntegerArg, anyArg], assertValidFuture);

  it('returns Never when given Infinity', function (){
    eq(rejectAfter(Infinity)(1), never);
  });

  describe('#_interpret()', function (){
    it('rejects with the given value', function (){
      return assertRejected(rejectAfter(20)(1), 1);
    });

    it('clears its internal timeout when cancelled', function (done){
      rejectAfter(20)(1)._interpret(done, failRej, failRes)();
      setTimeout(done, 25);
    });
  });

  describe('#extractLeft()', function (){
    it('returns array with the value', function (){
      eq(rejectAfter(20)(1).extractLeft(), [1]);
    });
  });

  describe('#toString()', function (){
    it('returns the code to create the After', function (){
      eq(rejectAfter(20)(1).toString(), 'rejectAfter (20) (1)');
    });
  });

});
