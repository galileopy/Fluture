import {fork} from '../../index.mjs';
import {testFunction, functionArg, futureArg} from '../util/props.mjs';
import {eq, isFunction, error, noop, itRaises} from '../util/util.mjs';
import {crashed, rejected, resolved} from '../util/futures.mjs';

describe('fork()', function (){
  testFunction('fork', fork, [functionArg, functionArg, futureArg], isFunction);

  itRaises('the crash exception', function (){
    fork(noop)(noop)(crashed);
  }, error);

  it('calls the first continuation with the rejection reason', function (done){
    function assertRejection (x){
      eq(x, 'rejected');
      done();
    }
    fork(assertRejection)(noop)(rejected);
  });

  it('calls the second continuation with the resolution value', function (done){
    function assertResolution (x){
      eq(x, 'resolved');
      done();
    }
    fork(noop)(assertResolution)(resolved);
  });
});
