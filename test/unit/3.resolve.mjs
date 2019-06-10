import {resolve} from '../../index.mjs';
import {eq, assertValidFuture, assertResolved} from '../util/util.mjs';
import {testFunction, anyArg} from '../util/props.mjs';

describe('resolve()', function (){

  testFunction('resolve', resolve, [anyArg], assertValidFuture);

  it('returns a resolved Future', function (){
    return assertResolved(resolve(1), 1);
  });

  it('provides its reason to extractRight()', function (){
    eq(resolve(1).extractRight(), [1]);
  });

  it('can be shown as string', function (){
    eq(resolve(1).toString(), 'resolve (1)');
  });

});
