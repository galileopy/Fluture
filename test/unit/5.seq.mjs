import {seq} from '../../index.mjs';
import {testFunction, parallelArg} from '../util/props.mjs';
import {assertValidFuture} from '../util/util.mjs';

describe('seq()', function (){

  testFunction('seq', seq, [parallelArg], assertValidFuture);

});
