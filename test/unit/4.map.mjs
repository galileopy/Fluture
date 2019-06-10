import Either from 'sanctuary-either';
import {map} from '../../index.mjs';
import {assertCrashed, assertRejected, assertResolved, assertValidFuture, bang, failRej, failRes, eq, throwing, error} from '../util/util.mjs';
import {rejected, resolved, resolvedSlow, rejectedSlow} from '../util/futures.mjs';
import {testFunction, functionArg, functorArg} from '../util/props.mjs';

describe('map()', function (){

  testFunction('map', map, [functionArg, functorArg], assertValidFuture);

  it('dispatches to Fantasy Land map', function (){
    eq(map(bang)(Either.Right('hello')), Either.Right('hello!'));
  });

  it('maps the resolution branch with the given function', function (){
    return Promise.all([
      assertRejected(map(bang)(rejected), 'rejected'),
      assertResolved(map(bang)(resolved), 'resolved!'),
      assertCrashed(map(throwing)(resolved), error)
    ]);
  });

  it('does not resolve after being cancelled', function (done){
    map(failRej)(resolvedSlow)._interpret(done, failRej, failRes)();
    setTimeout(done, 25);
  });

  it('does not reject after being cancelled', function (done){
    map(failRej)(rejectedSlow)._interpret(done, failRej, failRes)();
    setTimeout(done, 25);
  });

  it('displays correctly as string', function (){
    eq(map(bang)(resolved).toString(), 'map (' + bang.toString() + ') (resolve ("resolved"))');
  });

});
