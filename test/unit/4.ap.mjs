import Either from 'sanctuary-either';
import {Future, ap, resolve, reject, after} from '../../index.mjs';
import {assertCrashed, assertRejected, assertResolved, assertValidFuture, noop, add, eq, bang} from '../util/util.mjs';
import {testFunction, applyArg, futureArg} from '../util/props.mjs';

describe('ap()', function (){

  testFunction('ap', ap, [applyArg, futureArg], assertValidFuture);

  it('dispatches to Fantasy Land ap', function (){
    eq(ap(Either.Right('hello'))(Either.Right(bang)), Either.Right('hello!'));
  });

  it('crashes when the other does not resolve to a Function', function (){
    var m = ap(resolve(1))(resolve(null));
    return assertCrashed(m, new TypeError(
      'ap expects the second Future to resolve to a Function\n' +
      '  Actual: null'
    ));
  });

  it('applies the Function on the right to the value on the left', function (){
    return Promise.all([
      assertResolved(ap(resolve(1))(resolve(add(1))), 2),
      assertRejected(ap(resolve(add(1)))(reject('err')), 'err'),
      assertRejected(ap(reject('err'))(resolve(add(1))), 'err'),
      assertResolved(ap(after(20)(1))(resolve(add(1))), 2),
      assertResolved(ap(resolve(1))(after(20)(add(1))), 2)
    ]);
  });

  it('cancels the left Future if cancel is called while it is running', function (done){
    var left = Future(function (){ return function (){ return done() } });
    var right = resolve(add(1));
    var cancel = ap(left)(right)._interpret(done, noop, noop);
    cancel();
  });

  it('cancels the right Future if cancel is called while it is running', function (done){
    var left = resolve(1);
    var right = Future(function (){ return function (){ return done() } });
    var cancel = ap(left)(right)._interpret(done, noop, noop);
    cancel();
  });

  it('displays correctly as string', function (){
    eq(ap(resolve(1))(resolve(2)).toString(), 'ap (resolve (1)) (resolve (2))');
  });

});
