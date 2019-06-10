import {Future, race} from '../../index.mjs';
import {assertCrashed, assertRejected, assertResolved, assertValidFuture, error, noop, eq} from '../util/util.mjs';
import {crashed, crashedSlow, rejected, rejectedSlow, resolved, resolvedSlow} from '../util/futures.mjs';
import {testFunction, futureArg} from '../util/props.mjs';

describe('race()', function (){

  testFunction('race', race, [futureArg, futureArg], assertValidFuture);

  it('races one Future against another', function (){
    return Promise.all([
      assertCrashed(race(crashed)(resolvedSlow), error),
      assertResolved(race(crashedSlow)(resolved), 'resolved'),
      assertCrashed(race(crashed)(rejectedSlow), error),
      assertRejected(race(crashedSlow)(rejected), 'rejected'),
      assertResolved(race(resolved)(crashedSlow), 'resolved'),
      assertCrashed(race(resolvedSlow)(crashed), error),
      assertRejected(race(rejected)(crashedSlow), 'rejected'),
      assertCrashed(race(rejectedSlow)(crashed), error),
      assertResolved(race(resolved)(resolvedSlow), 'resolved'),
      assertResolved(race(resolvedSlow)(resolved), 'resolved'),
      assertRejected(race(rejectedSlow)(rejected), 'rejected'),
      assertRejected(race(rejected)(rejectedSlow), 'rejected'),
      assertResolved(race(rejectedSlow)(resolved), 'resolved'),
      assertRejected(race(rejected)(resolvedSlow), 'rejected'),
      assertResolved(race(resolved)(rejectedSlow), 'resolved'),
      assertRejected(race(resolvedSlow)(rejected), 'rejected')
    ]);
  });

  it('cancels the right if the left resolves', function (done){
    var m = race(resolvedSlow)(Future(function (){ return function (){ return done() } }));
    m._interpret(done, noop, noop);
  });

  it('cancels the left if the right resolves', function (done){
    var m = race(Future(function (){ return function (){ return done() } }))(resolvedSlow);
    m._interpret(done, noop, noop);
  });

  it('cancels the right if the left rejects', function (done){
    var m = race(rejectedSlow)(Future(function (){ return function (){ return done() } }));
    m._interpret(done, noop, noop);
  });

  it('cancels the left if the right rejects', function (done){
    var m = race(Future(function (){ return function (){ return done() } }))(rejectedSlow);
    m._interpret(done, noop, noop);
  });

  it('creates a cancel function which cancels both Futures', function (done){
    var cancelled = false;
    var m = Future(function (){ return function (){ return (cancelled ? done() : (cancelled = true)) } });
    var cancel = race(m)(m)._interpret(done, noop, noop);
    cancel();
  });

  it('displays correctly as string', function (){
    eq(race(rejected)(resolved).toString(), 'race (reject ("rejected")) (resolve ("resolved"))');
  });

});
