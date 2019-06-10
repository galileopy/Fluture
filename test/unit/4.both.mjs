import {Future, both, node, done} from '../../index.mjs';
import {assertCrashed, assertRejected, assertResolved, assertValidFuture, error, noop, eq} from '../util/util.mjs';
import {crashed, rejected, resolved, crashedSlow, rejectedSlow, resolvedSlow} from '../util/futures.mjs';
import {testFunction, futureArg} from '../util/props.mjs';

describe('both()', function (){

  testFunction('both', both, [futureArg, futureArg], assertValidFuture);

  it('resolves to a tuple of both resolution values', function (){
    return Promise.all([
      assertCrashed(both(crashed)(crashed), error),
      assertCrashed(both(rejected)(crashed), error),
      assertCrashed(both(crashed)(resolved), error),
      assertCrashed(both(resolved)(crashed), error),

      assertRejected(both(rejected)(rejected), 'rejected'),
      assertRejected(both(rejected)(rejectedSlow), 'rejected'),
      assertRejected(both(rejectedSlow)(rejected), 'rejected'),
      assertRejected(both(crashed)(rejected), 'rejected'),
      assertRejected(both(rejected)(crashedSlow), 'rejected'),
      assertRejected(both(resolved)(rejected), 'rejected'),
      assertRejected(both(rejected)(resolved), 'rejected'),

      assertResolved(both(resolved)(resolved), ['resolved', 'resolved']),
      assertResolved(both(resolved)(resolvedSlow), ['resolved', 'resolvedSlow']),
      assertResolved(both(resolvedSlow)(resolved), ['resolvedSlow', 'resolved']),
      assertResolved(both(resolvedSlow)(resolvedSlow), ['resolvedSlow', 'resolvedSlow']),
    ]);
  });

  it('[GH #118] does not call the left computation twice', function (cb){
    var called = false;
    var left = node(function (f){ return called ? cb(error) : setTimeout(f, 20, null, called = true) });
    return done(cb)(both(left)(resolvedSlow));
  });

  it('[GH #118] does not call the right computation twice', function (cb){
    var called = false;
    var right = node(function (f){ return called ? cb(error) : setTimeout(f, 20, null, called = true) });
    return done(cb)(both(resolvedSlow)(right));
  });

  it('cancels the right if the left rejects', function (done){
    var m = both(rejectedSlow)(Future(function (){ return function (){ return done() } }));
    m._interpret(done, noop, noop);
  });

  it('cancels the left if the right rejects', function (done){
    var m = both(Future(function (){ return function (){ return done() } }))(rejectedSlow);
    m._interpret(done, noop, noop);
  });

  it('creates a cancel function which cancels both Futures', function (done){
    var cancelled = false;
    var m = Future(function (){ return function (){ return (cancelled ? done() : (cancelled = true)) } });
    var cancel = both(m)(m)._interpret(done, noop, noop);
    cancel();
  });

  it('displays correctly as string', function (){
    eq(both(rejected)(resolved).toString(), 'both (reject ("rejected")) (resolve ("resolved"))');
  });

});
