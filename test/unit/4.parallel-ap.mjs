import {Future, resolve, reject, after} from '../../index.mjs';
import {parallelAp} from '../../src/parallel-ap.mjs';
import {assertCrashed, assertRejected, assertResolved, assertValidFuture, noop, add} from '../util/util.mjs';
import {testFunction, futureArg} from '../util/props.mjs';

describe('parallelAp()', function (){

  testFunction('parallelAp', parallelAp, [futureArg, futureArg], assertValidFuture);

  it('crashes when the other does not resolve to a Function', function (){
    var m = parallelAp(resolve(1))(resolve(null));
    return assertCrashed(m, new TypeError(
      'parallelAp expects the second Future to resolve to a Function\n' +
      '  Actual: null'
    ));
  });

  it('applies the Function on the right to the value on the left', function (){
    return Promise.all([
      assertResolved(parallelAp(resolve(1))(resolve(add(1))), 2),
      assertRejected(parallelAp(resolve(add(1)))(reject('err')), 'err'),
      assertRejected(parallelAp(reject('err'))(resolve(add(1))), 'err'),
      assertResolved(parallelAp(after(20)(1))(resolve(add(1))), 2),
      assertResolved(parallelAp(resolve(1))(after(20)(add(1))), 2)
    ]);
  });

  it('cancels the left Future if cancel is called while it is running', function (done){
    var left = Future(function (){ return function (){ return done() } });
    var right = resolve(add(1));
    var cancel = parallelAp(left)(right)._interpret(done, noop, noop);
    cancel();
  });

  it('cancels the right Future if cancel is called while it is running', function (done){
    var left = resolve(1);
    var right = Future(function (){ return function (){ return done() } });
    var cancel = parallelAp(left)(right)._interpret(done, noop, noop);
    cancel();
  });

});
