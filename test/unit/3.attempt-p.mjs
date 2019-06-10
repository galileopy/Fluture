/* eslint prefer-promise-reject-errors: 0 */

import chai from 'chai';
import {attemptP, map, mapRej} from '../../index.mjs';
import * as U from '../util/util.mjs';
import {testFunction, functionArg} from '../util/props.mjs';

var expect = chai.expect;

describe('attemptP()', function (){

  testFunction('encaseP', attemptP, [functionArg], U.assertValidFuture);

  describe('#_interpret()', function (){

    it('crashes when the Promise generator throws', function (){
      var m = attemptP(function (){ throw U.error });
      return U.assertCrashed(m, U.error);
    });

    it('crashes when the Promise generator does not return a Promise', function (){
      var m = attemptP(U.noop);
      return U.assertCrashed(m, new TypeError(
        'encaseP() expects the function it\'s given to return a Promise/Thenable\n' +
        '  Actual: undefined\n' +
        '  From calling: function (){}\n' +
        '  With: undefined'
      ));
    });

    it('resolves with the resolution value of the returned Promise', function (){
      var actual = attemptP(function (){ return Promise.resolve(1) });
      return U.assertResolved(actual, 1);
    });

    it('rejects with rejection reason of the returned Promise', function (){
      var actual = attemptP(function (){ return Promise.reject(U.error) });
      return U.assertRejected(actual, U.error);
    });

    it('ensures no resolution happens after cancel', function (done){
      var actual = attemptP(function (){ return Promise.resolve(1) });
      actual._interpret(done, U.failRej, U.failRes)();
      setTimeout(done, 20);
    });

    it('ensures no rejection happens after cancel', function (done){
      var actual = attemptP(function (){ return Promise.reject(1) });
      actual._interpret(done, U.failRej, U.failRes)();
      setTimeout(done, 20);
    });

    it('crashes with errors that occur in rejection continuation', function (){
      var m = map(function (){ throw U.error })(attemptP(function (){ return Promise.resolve(1) }));
      return U.assertCrashed(m, U.error);
    });

    it('crashes with errors that occur in resolution continuation', function (){
      var m = mapRej(function (){ throw U.error })(attemptP(function (){ return Promise.reject(1) }));
      return U.assertCrashed(m, U.error);
    });

  });

  describe('#toString()', function (){

    it('returns the code to create the Future', function (){
      var f = function (){ return Promise.resolve(42) };
      var m = attemptP(f);
      expect(m.toString()).to.equal('encaseP (' + f.toString() + ') (undefined)');
    });

  });

});
