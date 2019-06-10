import {mock} from '../util/futures.mjs';
import {eq, throws} from '../util/util.mjs';

describe('Future#pipe()', function (){

  it('throws when not given a function', function (){
    throws(function (){
      mock.pipe(42);
    }, new TypeError(
      'Future#pipe() expects its first argument to be a Function.\n' +
      '  Actual: 42 :: Number'
    ));
  });

  it('transforms the Future using the given function', function (){
    eq(mock.pipe(String), '(util.mock)');
  });

});
