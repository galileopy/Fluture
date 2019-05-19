import chai from 'chai';
import {resolve, after, reject} from '../../index.mjs';
import {chainRec} from '../../src/future';
import {isIteration} from '../../src/internal/iteration';
import {assertCrashed, assertRejected, assertResolved, error, failRej, failRes, noop} from '../util/util';

var expect = chai.expect;

describe('chainRec()', function (){

  it('is a binary function', function (){
    expect(chainRec).to.be.a('function');
    expect(chainRec.length).to.equal(2);
  });

  describe('#_interpret()', function (){

    it('crashes if the iterator throws', function (){
      var m = chainRec(function (){ throw error });
      return assertCrashed(m, error);
    });

    it('does not break if the iteration does not contain a value key', function (){
      var actual = chainRec(function (f, g, x){ return (x, resolve({done: true})) }, 0);
      return assertResolved(actual, undefined);
    });

    it('calls the function with Next, Done and the initial value', function (){
      chainRec(function (next, done, x){
        expect(next).to.be.a('function');
        expect(next.length).to.equal(1);
        expect(next(x)).to.satisfy(isIteration);
        expect(done).to.be.a('function');
        expect(done.length).to.equal(1);
        expect(done(x)).to.satisfy(isIteration);
        expect(x).to.equal(42);
        return resolve(done(x));
      }, 42)._interpret(noop, noop, noop);
    });

    it('calls the function with the value from the current iteration', function (){
      var i = 0;
      chainRec(function (f, g, x){
        expect(x).to.equal(i);
        return x < 5 ? resolve(f(++i)) : resolve(g(x));
      }, i)._interpret(noop, noop, noop);
    });

    it('works asynchronously', function (){
      var actual = chainRec(function (f, g, x){ return after(10)(x < 5 ? f(x + 1) : g(x)) }, 0);
      return assertResolved(actual, 5);
    });

    it('responds to failure', function (){
      var m = chainRec(function (f, g, x){ return reject(x) }, 1);
      return assertRejected(m, 1);
    });

    it('responds to failure after chaining async', function (){
      var m = chainRec(
        function (f, g, x){ return x < 2 ? after(10)(f(x + 1)) : reject(x) }, 0
      );
      return assertRejected(m, 2);
    });

    it('can be cancelled straight away', function (done){
      chainRec(function (f, g, x){ return after(10)(g(x)) }, 1)
      ._interpret(done, failRej, failRes)();
      setTimeout(done, 20);
    });

    it('can be cancelled after some iterations', function (done){
      var m = chainRec(function (f, g, x){ return after(10)(x < 5 ? f(x + 1) : g(x)) }, 0);
      var cancel = m._interpret(done, failRej, failRes);
      setTimeout(cancel, 25);
      setTimeout(done, 70);
    });

  });

});
