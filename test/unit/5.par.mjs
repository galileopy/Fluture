import chai from 'chai';
import Z from 'sanctuary-type-classes';
import {Future, Par, seq, resolve, reject, never, ap, map, alt, and} from '../../index.mjs';
import {add, assertCrashed, assertRejected, assertResolved, bang, error, noop, throws} from '../util/util.mjs';
import {rejected, resolved, resolvedSlow} from '../util/futures.mjs';

var expect = chai.expect;

describe('Par()', function (){

  it('is a unary function', function (){
    expect(Par).to.be.a('function');
    expect(Par.length).to.equal(1);
  });

  it('throws when not given a Future', function (){
    var f = function (){ return Par(1) };
    throws(f, new TypeError(
      'ConcurrentFuture expects its first argument to be of type "Future"\n' +
      '  Actual: 1'
    ));
  });

  describe('.of()', function (){

    it('resolves with the value', function (){
      var m = Z.of(Par, 1);
      return assertResolved(seq(m), 1);
    });

  });

  describe('.zero()', function (){

    it('creates a never-ending ConcurrentFuture', function (){
      var m = Z.zero(Par);
      expect(seq(m)).to.equal(never);
    });

  });

  describe('#ap()', function (){

    var mf = resolve(bang);

    it('throws TypeError when the Future does not resolve to a Function', function (){
      var m = seq(ap(Par(resolved))(Par(resolve(1))));
      return assertCrashed(m, new TypeError(
        'parallelAp expects the second Future to resolve to a Function\n' +
        '  Actual: 1'
      ));
    });

    it('calls the function contained in the given Future to its contained value', function (){
      var actual = ap(Par(resolved))(Par(mf));
      return assertResolved(seq(actual), 'resolved!');
    });

    it('rejects if one of the two reject', function (){
      var left = ap(Par(rejected))(Par(mf));
      var right = ap(Par(resolved))(Par(rejected));
      return Promise.all([
        assertRejected(seq(left), 'rejected'),
        assertRejected(seq(right), 'rejected')
      ]);
    });

    it('does not matter if either resolves late', function (){
      var left = ap(Par(resolvedSlow))(Par(mf));
      var right = ap(Par(resolved))(Par(and(mf)(resolvedSlow)));
      return Promise.all([
        assertResolved(seq(left), 'resolvedSlow!'),
        assertResolved(seq(right), 'resolved!')
      ]);
    });

    it('cannot reject twice', function (){
      var actual = ap(Par(rejected))(Par(rejected));
      return assertRejected(seq(actual), 'rejected');
    });

    it('creates a cancel function which cancels both Futures', function (done){
      var cancelled = false;
      var m = Par(Future(function (){ return function (){ return (cancelled ? done() : (cancelled = true)) } }));
      var cancel = seq(ap(m)(m))._interpret(done, noop, noop);
      cancel();
    });

    it('shows a reasonable representation when cast to string', function (){
      var m = ap(Par(reject(0)))(Par(resolve(1)));
      var s = 'ConcurrentFuture(parallelAp (reject (0)) (resolve (1)))';
      expect(m.toString()).to.equal(s);
    });

  });

  describe('#map()', function (){

    it('applies the given function to its inner', function (){
      var actual = map(add(1))(Par(resolve(1)));
      return assertResolved(seq(actual), 2);
    });

    it('does not map rejected state', function (){
      var actual = map(function (){ return 'mapped' })(Par(rejected));
      return assertRejected(seq(actual), 'rejected');
    });

    it('shows a reasonable representation when cast to string', function (){
      var m = map(noop)(Par(resolved));
      var expected = 'ConcurrentFuture(map (' + noop.toString() + ') (resolve ("resolved")))';
      expect(m.toString()).to.equal(expected);
    });

  });

  describe('#alt()', function (){

    it('rejects when the first one rejects', function (){
      var m1 = Par(Future(function (rej, res){ return void setTimeout(res, 50, 1) }));
      var m2 = Par(Future(function (rej){ return void setTimeout(rej, 5, error) }));
      return assertRejected(seq(alt(m1)(m2)), error);
    });

    it('resolves when the first one resolves', function (){
      var m1 = Par(Future(function (rej, res){ return void setTimeout(res, 5, 1) }));
      var m2 = Par(Future(function (rej){ return void setTimeout(rej, 50, error) }));
      return assertResolved(seq(alt(m1)(m2)), 1);
    });

    it('shows a reasonable representation when cast to string', function (){
      var m = alt(Par(resolve(1)))(Par(resolve(2)));
      var s = 'ConcurrentFuture(race (resolve (1)) (resolve (2)))';
      expect(m.toString()).to.equal(s);
    });

  });

});
