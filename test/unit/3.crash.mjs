import {crash} from '../../src/future.mjs';
import {eq, assertIsFuture, assertCrashed} from '../util/util.mjs';
import {testFunction, anyArg} from '../util/props.mjs';

describe('crash()', function (){

  testFunction('crash', crash, [anyArg], assertIsFuture);

  it('returns a crashed Future', function (){
    return assertCrashed(crash(1), 1);
  });

  it('can be shown as string', function (){
    eq(crash(1).toString(), 'crash (1)');
  });

});
