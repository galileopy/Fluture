import Either from 'sanctuary-either';
import {chain, resolve, reject} from '../../index.mjs';
import {assertCrashed, assertRejected, assertResolved, assertValidFuture, bang, eq, throwing, error} from '../util/util.mjs';
import {rejected, resolved, resolvedSlow} from '../util/futures.mjs';
import {testFunction, functionArg, chainArg} from '../util/props.mjs';

describe('chain()', function (){

  testFunction('chain', chain, [functionArg, chainArg], assertValidFuture);

  it('dispatches to Fantasy Land chain', function (){
    eq(chain(Either.Left)(Either.Right(42)), Either.Left(42));
  });

  it('crashes when the given function does not return Future', function (){
    return assertCrashed(chain(bang)(resolved), new TypeError(
      'chain expects the return value from the function it\'s given to be a valid Future.\n' +
      '  Actual: "resolved!" :: String\n' +
      '  When called with: "resolved"'
    ));
  });

  it('calls the function with the resolution value and sequences the returned Future', function (){
    return Promise.all([
      assertRejected(chain(reject)(resolved), 'resolved'),
      assertRejected(chain(reject)(resolvedSlow), 'resolvedSlow'),
      assertResolved(chain(resolve)(resolved), 'resolved'),
      assertRejected(chain(resolve)(rejected), 'rejected'),
      assertCrashed(chain(throwing)(resolved), error)
    ]);
  });

  it('displays correctly as string', function (){
    eq(chain(resolve)(resolved).toString(), 'chain (' + resolve.toString() + ') (resolve ("resolved"))');
  });

});
