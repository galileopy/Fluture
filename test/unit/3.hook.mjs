import chai from 'chai';
import {Future, hook, resolve, reject} from '../../index.mjs';
import * as U from '../util/util.mjs';
import * as F from '../util/futures.mjs';
import {testFunction, futureArg, functionArg} from '../util/props.mjs';

var expect = chai.expect;

describe('hook()', function (){

  testFunction('hook', hook, [futureArg, functionArg, functionArg], U.assertIsFuture);

  describe('#_interpret()', function (){

    it('crashes when the disposal function does not return Future', function (){
      var m = hook(F.resolved)(function (){ return 1 })(function (){ return F.resolved });
      return U.assertCrashed(m, new TypeError(
        'hook() expects the return value from the first function it\'s given to be a valid Future.\n' +
        '  Actual: 1 :: Number\n' +
        '  From calling: function (){ return 1 }\n' +
        '  With: "resolved"'
      ));
    });

    it('crashes when the disposal function throws', function (){
      var m = hook(F.resolved)(function (){ throw U.error })(function (){ return F.resolved });
      return U.assertCrashed(m, U.error);
    });

    it('crashes when the computation function does not return Future', function (){
      var m = hook(F.resolved)(function (){ return F.resolved })(function (){ return 1 });
      return U.assertCrashed(m, new TypeError(
        'hook() expects the return value from the second function it\'s given to be a valid Future.\n' +
        '  Actual: 1 :: Number\n' +
        '  From calling: function (){ return 1 }\n' +
        '  With: "resolved"'
      ));
    });

    it('crashes when the computation function throws', function (){
      var m = hook(F.resolved)(function (){ return F.resolved })(function (){ throw U.error });
      return U.assertCrashed(m, U.error);
    });

    it('crashes when the disposal Future rejects', function (){
      var rejected = hook(F.resolved)(function (){ return reject(1) })(function (){ return reject(2) });
      var resolved = hook(F.resolved)(function (){ return reject(1) })(function (){ return resolve(2) });
      return Promise.all([
        U.assertCrashed(rejected, new Error('The disposal Future rejected with 1')),
        U.assertCrashed(resolved, new Error('The disposal Future rejected with 1'))
      ]);
    });

    it('runs the first computation after the second, both with the resource', function (done){
      var ran = false;
      hook(F.resolved)(function (x){
        expect(x).to.equal('resolved');
        return Future(function (rej, res){ return res(done(ran ? null : new Error('Second did not run'))) });
      })(function (x){
        expect(x).to.equal('resolved');
        return Future(function (rej, res){ return res(ran = true) });
      })._interpret(done, done, U.noop);
    });

    it('runs the first even if the second rejects', function (done){
      hook(F.resolved)(function (){
        return Future(function (){ return done() });
      })(function (){
        return reject(2);
      })._interpret(done, U.noop, U.noop);
    });

    it('assumes the state resolve the second if the first resolves', function (){
      var rejected = hook(F.resolved)(function (){ return resolve(1) })(function (){ return reject(2) });
      var resolved = hook(F.resolved)(function (){ return resolve(1) })(function (){ return resolve(2) });
      return Promise.all([
        U.assertRejected(rejected, 2),
        U.assertResolved(resolved, 2)
      ]);
    });

    it('does not hook after being cancelled', function (done){
      hook(F.resolvedSlow)(function (){ return resolve('dispose') })(U.failRes)._interpret(done, U.failRej, U.failRes)();
      setTimeout(done, 25);
    });

    it('does not reject after being cancelled', function (done){
      hook(F.rejectedSlow)(function (){ return resolve('dispose') })(U.failRes)._interpret(done, U.failRej, U.failRes)();
      hook(F.resolved)(function (){ return resolve('dispose') })(function (){ return F.rejectedSlow })._interpret(done, U.failRej, U.failRes)();
      setTimeout(done, 25);
    });

    it('cancels acquire appropriately', function (done){
      var acquire = Future(function (){ return function (){ return done() } });
      var cancel =
        hook(acquire)(function (){ return resolve('dispose') })(function (){ return resolve('consume') })
        ._interpret(done, U.failRej, U.failRes);
      setTimeout(cancel, 10);
    });

    it('cancels consume appropriately', function (done){
      var consume = Future(function (){ return function (){ return done() } });
      var cancel =
        hook(F.resolved)(function (){ return resolve('dispose') })(function (){ return consume })
        ._interpret(done, U.failRej, U.failRes);
      setTimeout(cancel, 10);
    });

    it('cancels delayed consume appropriately', function (done){
      var consume = Future(function (){ return function (){ return done() } });
      var cancel =
        hook(F.resolvedSlow)(function (){ return resolve('dispose') })(function (){ return consume })
        ._interpret(done, U.failRej, U.failRes);
      setTimeout(cancel, 25);
    });

    it('does not cancel disposal', function (done){
      var dispose = Future(function (){ return function (){ return done(U.error) } });
      var cancel =
        hook(F.resolved)(function (){ return dispose })(function (){ return resolve('consume') })
        ._interpret(done, U.failRej, U.failRes);
      setTimeout(cancel, 10);
      setTimeout(done, 50);
    });

    it('does not cancel delayed dispose', function (done){
      var dispose = Future(function (){ return function (){ return done(U.error) } });
      var cancel =
        hook(F.resolved)(function (){ return dispose })(function (){ return F.resolvedSlow })
        ._interpret(done, U.failRej, U.failRes);
      setTimeout(cancel, 50);
      setTimeout(done, 100);
    });

    it('runs the disposal Future when cancelled after acquire', function (done){
      var cancel =
        hook(F.resolved)(function (){ return Future(function (){ done() }) })(function (){ return F.resolvedSlow })
        ._interpret(done, U.failRej, U.failRes);
      setTimeout(cancel, 10);
    });

    U.itRaises('exceptions that occur after the Future was unsubscribed', function (done){
      hook(F.resolved)(U.K(F.crashedSlow))(U.K(F.resolved))._interpret(function (){
        done(new Error('Exception handler called'));
      }, U.failRej, U.failRes)();
    }, U.error);

  });

  describe('#toString()', function (){

    it('returns the code which creates the same data-structure', function (){
      var a = resolve(1);
      var d = function (){ return resolve(2) };
      var c = function (){ return resolve(3) };
      var m = hook(a)(d)(c);
      var expected = 'hook (' + a.toString() + ') (' + d.toString() + ') (' + c.toString() + ')';
      expect(m.toString()).to.equal(expected);
    });

  });

});
