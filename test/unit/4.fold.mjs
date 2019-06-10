import {fold} from '../../index.mjs';
import {assertCrashed, assertResolved, assertValidFuture, bang, B, throwing, error, eq} from '../util/util.mjs';
import {resolved, rejected} from '../util/futures.mjs';
import {testFunction, functionArg, futureArg} from '../util/props.mjs';

describe('fold()', function (){

  testFunction('fold', fold, [functionArg, functionArg, futureArg], assertValidFuture);

  it('joins the rejection and resolution values into the resolution branch', function (){
    return Promise.all([
      assertResolved(fold(bang)(B(bang)(bang))(rejected), 'rejected!'),
      assertResolved(fold(bang)(B(bang)(bang))(resolved), 'resolved!!'),
      assertCrashed(fold(throwing)(B)(rejected), error),
      assertCrashed(fold(B)(throwing)(resolved), error),
    ]);
  });

  it('displays correctly as string', function (){
    eq(fold(bang)(B)(resolved).toString(), 'fold (' + bang.toString() + ') (' + B.toString() + ') (resolve ("resolved"))');
  });

});
