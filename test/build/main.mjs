import {noop, eq} from '../util/util.mjs';
import * as Fluture from '../../index.mjs';
import Future from '../../index.js';

describe('CommonJS build output', function (){

  it('exports the Future constructor by default', function (){
    eq(typeof Future, 'function');
    eq(Future(noop) instanceof Future, true);
  });

  // Skipped until the problem with esm is fixed or we can use native mjs
  it.skip('has a Future property that refers to itself for import destructuring', function (){
    eq(Future.Future, Future);
  });

  Object.keys(Fluture).forEach(key => {
    it('has a ' + key + ' property of type ' + typeof Fluture[key], function (){
      eq(typeof Future[key], typeof Fluture[key]);
    });
  });

  it('exports Future with the correct name property', function (){
    eq(Future.name, Fluture.Future.name);
  });

});
