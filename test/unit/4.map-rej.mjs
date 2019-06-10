import {mapRej} from '../../index.mjs';
import {assertCrashed, assertRejected, assertResolved, assertValidFuture, bang, failRej, failRes, throwing, error, eq} from '../util/util.mjs';
import {rejected, resolved, resolvedSlow, rejectedSlow} from '../util/futures.mjs';
import {testFunction, functionArg, futureArg} from '../util/props.mjs';

describe('mapRej()', function (){

  testFunction('mapRej', mapRej, [functionArg, futureArg], assertValidFuture);

  it('maps the rejection branch with the given function', function (){
    return Promise.all([
      assertRejected(mapRej(bang)(rejected), 'rejected!'),
      assertResolved(mapRej(bang)(resolved), 'resolved'),
      assertCrashed(mapRej(throwing)(rejected), error)
    ]);
  });

  it('does not resolve after being cancelled', function (done){
    mapRej(failRej)(resolvedSlow)._interpret(done, failRej, failRes)();
    setTimeout(done, 25);
  });

  it('does not reject after being cancelled', function (done){
    mapRej(failRej)(rejectedSlow)._interpret(done, failRej, failRes)();
    setTimeout(done, 25);
  });

  it('displays correctly as string', function (){
    eq(mapRej(bang)(rejected).toString(), 'mapRej (' + bang.toString() + ') (reject ("rejected"))');
  });

});
