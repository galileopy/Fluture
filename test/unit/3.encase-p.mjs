/* eslint prefer-promise-reject-errors: 0 */

import chai from 'chai';
import {encaseP} from '../../index.mjs';
import * as U from '../util/util.mjs';
import {testFunction, functionArg, anyArg} from '../util/props.mjs';

var expect = chai.expect;

describe('encaseP()', function (){

  testFunction('encaseP', encaseP, [functionArg, anyArg], U.assertValidFuture);

  describe('#_interpret()', function (){

    it('crashes when the Promise generator throws', function (){
      var m = encaseP(function (){ throw U.error })(1);
      return U.assertCrashed(m, U.error);
    });

    it('crashes when the Promise generator does not return a Promise', function (){
      var m = encaseP(U.noop)(1);
      return U.assertCrashed(m, new TypeError(
        'encaseP() expects the function it\'s given to return a Promise/Thenable\n' +
        '  Actual: undefined\n' +
        '  From calling: function (){}\n' +
        '  With: 1'
      ));
    });

    it('resolves with the resolution value of the returned Promise', function (){
      var actual = encaseP(function (x){ return Promise.resolve(x + 1) })(1);
      return U.assertResolved(actual, 2);
    });

    it('rejects with rejection reason of the returned Promise', function (){
      var actual = encaseP(function (){ return Promise.reject(U.error) })(1);
      return U.assertRejected(actual, U.error);
    });

    it('ensures no resolution happens after cancel', function (done){
      var actual = encaseP(function (x){ return Promise.resolve(x + 1) })(1);
      actual._interpret(done, U.failRej, U.failRes)();
      setTimeout(done, 20);
    });

    it('ensures no rejection happens after cancel', function (done){
      var actual = encaseP(function (x){ return Promise.reject(x + 1) })(1);
      actual._interpret(done, U.failRej, U.failRes)();
      setTimeout(done, 20);
    });

  });

  describe('#toString()', function (){

    it('returns the code to create the Future', function (){
      var f = function (a){ return Promise.resolve(a) };
      var m = encaseP(f)(null);
      expect(m.toString()).to.equal('encaseP (' + f.toString() + ') (null)');
    });

  });

});
