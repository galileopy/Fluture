import {extractRight} from '../../index.mjs';
import {testFunction, futureArg} from '../util/props.mjs';
import {isArray} from '../util/util.mjs';
import {mock} from '../util/futures.mjs';

describe('extractRight()', function (){
  testFunction('extractRight', extractRight, [futureArg], isArray);

  it('dispatches to #extractRight', function (done){
    var m = Object.create(mock);
    m.extractRight = done;
    extractRight(m);
  });
});
