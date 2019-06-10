import chai from 'chai';
import {Future, go, resolve, after} from '../../index.mjs';
import * as U from '../util/util.mjs';
import * as F from '../util/futures.mjs';
import {testFunction, functionArg} from '../util/props.mjs';

var expect = chai.expect;

describe('go()', function (){

  testFunction('go', go, [functionArg], U.assertValidFuture);

  describe('#_interpret()', function (){

    it('crashes when the given function throws an error', function (){
      var m = go(function (){ throw U.error });
      return U.assertCrashed(m, U.error);
    });

    it('crashes when the given function does not return an interator', function (){
      var m = go(function (){ return null });
      return U.assertCrashed(m, new TypeError(
        'go() expects its first argument to return an iterator, maybe you forgot the "*".\n' +
        '  Actual: null :: Null'
      ));
    });

    it('crashes when iterator.next() throws an error', function (){
      var m = go(function (){ return {next: function (){ throw U.error }} });
      return U.assertCrashed(m, U.error);
    });

    it('crashes when the returned iterator does not return a valid iteration', function (){
      var m = go(function (){ return {next: function (){ return null }} });
      return U.assertCrashed(m, new TypeError(
        'The iterator did not return a valid iteration from iterator.next()\n' +
        '  Actual: null'
      ));
    });

    it('crashes when the returned iterator produces something other than a Future', function (){
      var m = go(function (){ return {next: function (){ return {done: false, value: null} }} });
      return U.assertCrashed(m, new TypeError(
        'go() expects the value produced by the iterator to be a valid Future.\n' +
        '  Actual: null :: Null\n' +
        '  Tip: If you\'re using a generator, make sure you always yield a Future'
      ));
    });

    it('crashes when the yielded Future crashes', function (){
      var m = go(function*(){ yield F.crashed });
      return U.assertCrashed(m, U.error);
    });

    it('handles synchronous Futures', function (){
      return U.assertResolved(go(function*(){
        var a = yield resolve(1);
        var b = yield resolve(2);
        return a + b;
      }), 3);
    });

    it('handles asynchronous Futures', function (){
      return U.assertResolved(go(function*(){
        var a = yield after(10)(1);
        var b = yield after(10)(2);
        return a + b;
      }), 3);
    });

    it('does not mix state over multiple interpretations', function (){
      var m = go(function*(){
        var a = yield resolve(1);
        var b = yield after(10)(2);
        return a + b;
      });
      return Promise.all([
        U.assertResolved(m, 3),
        U.assertResolved(m, 3)
      ]);
    });

    it('is stack safe', function (){
      var gen = function*(){
        var i = 0;
        while(i < U.STACKSIZE + 1){ yield resolve(i++) }
        return i;
      };

      var m = go(gen);
      return U.assertResolved(m, U.STACKSIZE + 1);
    });

    it('cancels the running operation when cancelled', function (done){
      var cancel = go(function*(){
        yield resolve(1);
        yield Future(function (){ return function (){ return done() } });
      })._interpret(done, U.noop, U.noop);
      cancel();
    });

  });

  describe('#toString()', function (){

    it('returns the code to create the Go', function (){
      var f = function*(){};
      var m = go(f);
      var s = 'go (' + f.toString() + ')';
      expect(m.toString()).to.equal(s);
    });

  });

});
