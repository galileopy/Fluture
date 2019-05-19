import show from 'sanctuary-show';
import type from 'sanctuary-type-identifiers';
import {Future, isFuture, reject, resolve} from '../../index.mjs';
import {crash} from '../../src/future';
import {strictEqual, deepStrictEqual} from 'assert';
export * from '../../src/internal/predicates';

export var STACKSIZE = (function r (){try{return 1 + r()}catch(e){return 1}}());
export var noop = function (){};
export var add = function (a){ return function (b){ return a + b } };
export var sub = function (a){ return function (b){ return a - b } };
export var bang = function (s){ return (s + '!') };
export var I = function (x){ return x };
export var B = function (f){ return function (g){ return function (x){ return f(g(x)) } } };
export var K = function (x){ return function (){ return x } };
export var T = function (x){ return function (f){ return f(x) } };
export var error = new Error('Intentional error for unit testing');
export var throwit = function (it){ throw it };
export var throwing = function (){ throw error };

export var eq = function eq (actual, expected){
  strictEqual(arguments.length, eq.length);
  strictEqual(show(actual), show(expected));
  //eslint-disable-next-line no-self-compare
  if(actual !== actual && expected !== expected){
    return;
  }
  deepStrictEqual(actual, expected);
};

export var throws = function throws (f, expected){
  try{
    f();
  }catch(actual){
    eq(typeof actual, typeof expected);
    eq(actual.constructor, expected.constructor);
    eq(actual.name, expected.name);
    eq(actual.message, expected.message);
    return;
  }
  throw new Error('Expected the function to throw');
};

export var itRaises = function itRaises (when, f, e){
  var test = (typeof process.rawListeners === 'function') ? it : it.skip;
  test('raises ' + when, function (done){
    var listeners = process.rawListeners('uncaughtException');
    process.removeAllListeners('uncaughtException');
    process.once('uncaughtException', function (actual){
      listeners.forEach(function (f){ process.on('uncaughtException', f) });
      eq(actual.message, e.message);
      done();
    });
    f();
  });
};

export var isDeepStrictEqual = function isDeepStrictEqual (actual, expected){
  try{
    eq(actual, expected);
    return true;
  }catch(e){
    return false;
  }
};

export var repeat = function (n, x){
  var out = new Array(n);
  while(n-- > 0){ out[n] = x } //eslint-disable-line
  return out;
};

export var failRes = function (x){
  throw new Error(('Invalidly entered resolution branch with value ' + x));
};

export var failRej = function (x){
  throw new Error(('Invalidly entered rejection branch with value ' + x));
};

export var assertIsFuture = function (x){
  eq(isFuture(x), true);
  eq(x instanceof Future, true);
  eq(x.constructor, Future);
  eq(type(x), Future['@@type']);
  return true;
};

export var assertValidFuture = function (x){
  assertIsFuture(x);

  eq(typeof x.extractLeft, 'function');
  eq(x.extractLeft.length, 0);
  eq(Array.isArray(x.extractLeft()), true);

  eq(typeof x.extractRight, 'function');
  eq(x.extractRight.length, 0);
  eq(Array.isArray(x.extractRight()), true);

  eq(typeof x._transform, 'function');
  eq(x._transform.length, 1);

  eq(typeof x._interpret, 'function');
  eq(typeof x._interpret(noop, noop, noop), 'function');
  eq(x._interpret(noop, noop, noop).length, 0);
  eq(x._interpret(noop, noop, noop)(), undefined);

  return true;
};

var states = ['pending', 'crashed', 'rejected', 'resolved'];

export function makeAssertEqual (equals){
  return function assertEqual (ma, mb){
    var astate = 0, bstate = 0, val;
    return new Promise(function (pass, fail){
      assertIsFuture(ma);
      assertIsFuture(mb);

      function twice (m, x, s1, s2){
        fail(new Error(
          'A Future ' + states[s2] + ' after already having ' + states[s1] + '.\n' +
          '  First: Future({ <' + states[s1] + '> ' + show(val) + ' })\n' +
          '  Second: Future({ <' + states[s1] + '> ' + show(x) + ' })\n' +
          '  Future: ' + m.toString()
        ));
      }

      function assertInnerEqual (a, b){
        if(astate === bstate){
          if(isFuture(a) && isFuture(b)){
            assertEqual(a, b).then(pass, fail);
            return;
          } else if (equals(a, b)){
            pass(true);
            return;
          }
        }
        fail(new Error(
          '\n    ' + ma.toString() +
          ' :: Future({ <' + states[astate] + '> ' + show(a) + ' })' +
          '\n    does not equal:\n    ' + mb.toString() +
          ' :: Future({ <' + states[bstate] + '> ' + show(b) + ' })\n  '
        ));
      }

      ma._interpret(function (x){
        if(astate > 0) twice(ma, x, astate, 1);
        else {
          astate = 1;
          if(bstate > 0) assertInnerEqual(x, val);
          else val = x;
        }
      }, function (x){
        if(astate > 0) twice(ma, x, astate, 2);
        else {
          astate = 2;
          if(bstate > 0) assertInnerEqual(x, val);
          else val = x;
        }
      }, function (x){
        if(astate > 0) twice(ma, x, astate, 3);
        else {
          astate = 3;
          if(bstate > 0) assertInnerEqual(x, val);
          else val = x;
        }
      });

      mb._interpret(function (x){
        if(bstate > 0) twice(mb, x, bstate, 1);
        else {
          bstate = 1;
          if(astate > 0) assertInnerEqual(val, x);
          else val = x;
        }
      }, function (x){
        if(bstate > 0) twice(mb, x, bstate, 2);
        else {
          bstate = 2;
          if(astate > 0) assertInnerEqual(val, x);
          else val = x;
        }
      }, function (x){
        if(bstate > 0) twice(mb, x, bstate, 3);
        else {
          bstate = 3;
          if(astate > 0) assertInnerEqual(val, x);
          else val = x;
        }
      });
    });
  };
}

export var assertEqual = makeAssertEqual(isDeepStrictEqual);

var assertEqualByErrorMessage = makeAssertEqual(function (a, b){
  return a.message === b.message;
});

export var assertCrashed = function (m, x){
  return assertEqualByErrorMessage(m, crash(x));
};

export var assertRejected = function (m, x){
  return assertEqual(m, reject(x));
};

export var assertResolved = function (m, x){
 return assertEqual(m, resolve(x));
};

export var onceOrError = function (f){
  var called = false;
  return function (){
    if(called){ throw new Error('Function ' + show(f) + ' was called twice') }
    called = true;
    f.apply(null, arguments);
  };
};

export function assertStackTrace (name, x){
  eq(typeof x, 'string');
  eq(x.slice(0, name.length), name);
  var lines = x.slice(name.length).split('\n');
  eq(lines.length > 0, true);
}
