import {extractLeft} from '../../index.mjs';
import {testFunction, futureArg} from '../util/props.mjs';
import {isArray} from '../util/util.mjs';
import {mock} from '../util/futures.mjs';

describe('extractLeft()', function (){
  testFunction('extractLeft', extractLeft, [futureArg], isArray);

  it('dispatches to #extractLeft', function (done){
    var m = Object.create(mock);
    m.extractLeft = done;
    extractLeft(m);
  });
});
