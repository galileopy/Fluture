import {done} from '../../index.mjs';
import {testFunction, functionArg, resolvedFutureArg} from '../util/props.mjs';
import {eq, isFunction} from '../util/util.mjs';
import {rejected, resolved} from '../util/futures.mjs';

describe('done()', function (){
  testFunction('done', done, [functionArg, resolvedFutureArg], isFunction);

  it('passes the rejection value as first parameter', function (testDone){
    done(function (x, y){
      eq(x, 'rejected');
      eq(y, undefined);
      testDone();
    })(rejected);
  });

  it('passes the resolution value as second parameter', function (testDone){
    done(function (x, y){
      eq(x, null);
      eq(y, 'resolved');
      testDone();
    })(resolved);
  });
});
