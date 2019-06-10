import {lastly, resolve, reject, map} from '../../index.mjs';
import {assertRejected, assertResolved, assertValidFuture, failRej, failRes, noop, eq} from '../util/util.mjs';
import {rejected, rejectedSlow, resolved, resolvedSlow} from '../util/futures.mjs';
import {testFunction, futureArg} from '../util/props.mjs';

describe('lastly()', function (){

  testFunction('lastly', lastly, [futureArg, futureArg], assertValidFuture);

  it('runs the second Future when the first resolves', function (done){
    lastly(map(done)(resolve(null)))(resolve(1))._interpret(done, noop, noop);
  });

  it('runs the second Future when the first rejects', function (done){
    lastly(map(done)(resolve(null)))(reject(1))._interpret(done, noop, noop);
  });

  it('resolves with the resolution value of the first', function (){
    var actual = lastly(resolve(2))(resolve(1));
    return assertResolved(actual, 1);
  });

  it('rejects with the rejection reason of the first if the second resolves', function (){
    var actual = lastly(resolve(2))(reject(1));
    return assertRejected(actual, 1);
  });

  it('always rejects with the rejection reason of the second', function (){
    var actualResolved = lastly(reject(2))(resolve(1));
    var actualRejected = lastly(reject(2))(reject(1));
    return Promise.all([
      assertRejected(actualResolved, 2),
      assertRejected(actualRejected, 2)
    ]);
  });

  it('does nothing after being cancelled', function (done){
    lastly(resolved)(resolvedSlow)._interpret(done, failRej, failRes)();
    lastly(resolvedSlow)(resolved)._interpret(done, failRej, failRes)();
    lastly(rejected)(rejectedSlow)._interpret(done, failRej, failRes)();
    lastly(rejectedSlow)(rejected)._interpret(done, failRej, failRes)();
    setTimeout(done, 25);
  });

  it('displays correctly as string', function (){
    eq(lastly(rejected)(resolved).toString(), 'lastly (reject ("rejected")) (resolve ("resolved"))');
  });

});
