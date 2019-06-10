import {chainRej, resolve, reject} from '../../index.mjs';
import {assertCrashed, assertRejected, assertResolved, assertValidFuture, bang, throwing, error, eq} from '../util/util.mjs';
import {rejected, resolved, rejectedSlow} from '../util/futures.mjs';
import {testFunction, functionArg, futureArg} from '../util/props.mjs';

describe('chainRej()', function (){

  testFunction('chainRej', chainRej, [functionArg, futureArg], assertValidFuture);

  it('crashes when the given function does not return Future', function (){
    return assertCrashed(chainRej(bang)(rejected), new TypeError(
      'chainRej expects the return value from the function it\'s given to be a valid Future.\n' +
      '  Actual: "rejected!" :: String\n' +
      '  When called with: "rejected"'
    ));
  });

  it('calls the function with the rejection reason and sequences the returned Future', function (){
    return Promise.all([
      assertResolved(chainRej(resolve)(rejected), 'rejected'),
      assertResolved(chainRej(resolve)(rejectedSlow), 'rejectedSlow'),
      assertResolved(chainRej(reject)(resolved), 'resolved'),
      assertRejected(chainRej(reject)(rejected), 'rejected'),
      assertCrashed(chainRej(throwing)(rejected), error)
    ]);
  });

  it('displays correctly as string', function (){
    eq(chainRej(resolve)(resolved).toString(), 'chainRej (' + resolve.toString() + ') (resolve ("resolved"))');
  });

});
