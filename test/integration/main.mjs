import {Future, resolve, after, chain, race, map} from '../../index.mjs';
import {noop, error, assertResolved, eq} from '../util/util.mjs';
import {resolved, resolvedSlow} from '../util/futures.mjs';

function through (x, fs){
  return fs.reduce(function (y, f){
    return f(y);
  }, x);
}

describe('Future in general', function (){

  it('is capable of joining', function (){
    var m = through(resolve('a'), [
      chain(function (x){ return chain(function (x){ return after(5)(x + 'c') })(after(5)(x + 'b')) }),
      chain(function (x){ return after(5)(x + 'd') }),
      chain(function (x){ return resolve(x + 'e') }),
      chain(function (x){ return after(5)(x + 'f') }),
    ]);
    return assertResolved(m, 'abcdef');
  });

  it('is capable of early termination', function (done){
    var slow = Future(function (){
      var id = setTimeout(done, 20, new Error('Not terminated'));
      return function (){ return clearTimeout(id) };
    });
    var m = through(slow, [race(slow), race(slow), race(slow), race(resolved)]);
    m._interpret(done, noop, noop);
    setTimeout(done, 40, null);
  });

  it('cancels running actions when one early-terminates asynchronously', function (done){
    var slow = Future(function (){
      var id = setTimeout(done, 50, new Error('Not terminated'));
      return function (){ return clearTimeout(id) };
    });
    var m = through(slow, [race(slow), race(slow), race(slow), race(resolvedSlow)]);
    m._interpret(done, noop, noop);
    setTimeout(done, 100, null);
  });

  it('does not run actions unnecessarily when one early-terminates synchronously', function (done){
    var broken = Future(function (){ done(error) });
    var m = through(resolvedSlow, [race(broken), race(broken), race(resolved)]);
    m._interpret(done, noop, function (){ return done() });
  });

  it('resolves the left-hand side first when running actions in parallel', function (){
    var m = through(resolve(1), [
      map(function (x){ return x }),
      chain(function (x){ return resolve(x) }),
      race(resolve(2)),
    ]);
    return assertResolved(m, 1);
  });

  it('does not forget about actions to run after early termination', function (){
    var m = through('a', [
      after(30),
      race(after(20)('b')),
      map(function (x){ return (x + 'c') }),
    ]);
    return assertResolved(m, 'bc');
  });

  it('does not run early terminating actions twice, or cancel them', function (done){
    var mock = Object.create(Future.prototype);
    mock._interpret = function (_, l, r){ return r(done()) || (function (){ return done(error) }) };
    var m = through('a', [
      after(30),
      map(function (x){ return (x + 'b') }),
      race(mock),
    ]);
    m._interpret(done, noop, noop);
  });

  it('does not run concurrent computations twice', function (done){
    var ran = false;
    var m = through(resolvedSlow, [
      chain(function (){ return resolvedSlow }),
      race(Future(function (){ ran ? done(error) : (ran = true) })),
    ]);
    m._interpret(done, done, function (){ return done() });
  });

  it('returns a cancel function which cancels all running actions', function (done){
    var i = 0;
    var started = function (){ return void i++ };
    var cancelled = function (){ return --i < 1 && done() };
    var slow = Future(function (){ return started() || (function (){ return cancelled() }) });
    var m = through(slow, [race(slow), race(slow), race(slow), race(slow)]);
    var cancel = m._interpret(done, noop, noop);
    eq(i, 5);
    cancel();
  });

});
