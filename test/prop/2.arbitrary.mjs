import {assertEqual, I, B, K} from '../util/util.mjs';
import {
  any,
  anyFuture,
  anyRejectedFuture,
  anyResolvedFuture,
  constant,
  f,
  g,
  oneof,
  property,
} from '../util/props.mjs';
import {
  after,
  and,
  bimap,
  chain,
  chainRej,
  fold,
  go,
  map,
  mapRej,
  reject,
  rejectAfter,
  resolve,
  swap,
} from '../../index.mjs';

var make = oneof(constant(resolve), constant(reject));

function eq (a){
  return function (b){
    return assertEqual(a, b);
  };
}

describe('Prop', function (){

  property('Rejected m => swap(m) = chainRej(resolve)(m)', anyRejectedFuture, function (m){
    return eq(swap(m))(chainRej(resolve)(m));
  });

  property('Resolved m => swap(m) = chain(reject)(m)', anyResolvedFuture, function (m){
    return eq(swap(m))(chain(reject)(m));
  });

  property('reject(x) = swap(resolve(x))', any, function (x){
    return eq(reject(x))(swap(resolve(x)));
  });

  property('swap(reject(x)) = resolve(x)', any, function (x){
    return eq(swap(reject(x)))(resolve(x));
  });

  property('Resolved m => chainRej(B(mk)(f))(m) = m', make, anyResolvedFuture, function (mk, m){
    return eq(chainRej(B(mk)(f))(m))(m);
  });

  property('Rejected m => chainRej(B(mk)(f))(m) = chain(B(mk)(f))(swap(m))', make, anyRejectedFuture, function (mk, m){
    return eq(chainRej(B(mk)(f))(m))(chain(B(mk)(f))(swap(m)));
  });

  property('Resolved m => chain(B(mk)(f))(m) = chainRej(B(mk)(f))(swap(m))', make, anyResolvedFuture, function (mk, m){
    return eq(chain(B(mk)(f))(m))(chainRej(B(mk)(f))(swap(m)));
  });

  property('after(1)(x) = resolve(x)', any, function (n, x){
    return eq(after(1)(x))(resolve(x));
  });

  property('and(a)(b) = chain(K(a))(b)', anyFuture, anyFuture, function (a, b){
    return eq(and(a)(b))(chain(K(a))(b));
  });

  property('Rejected m => fold(f)(g)(m) = chainRej(B(resolve)(f))(m)', anyRejectedFuture, function (m){
    return eq(fold(f)(g)(m))(chainRej(B(resolve)(f))(m));
  });

  property('Resolved m => fold(f)(g)(m) = map(g)(m)', anyResolvedFuture, function (m){
    return eq(fold(f)(g)(m))(map(g)(m));
  });

  property('go(function*(){ return f(yield m) }) = map(f)(m)', anyFuture, function (m){
    return eq(go(function*(){ return f(yield m) }))(map(f)(m));
  });

  property('mapRej(f)(m) = chainRej(B(reject)(f))(m)', anyFuture, function (m){
    return eq(mapRej(f)(m))(chainRej(B(reject)(f))(m));
  });

  property('mapRej(f)(m) = bimap(f)(I)(m)', anyFuture, function (m){
    return eq(mapRej(f)(m))(bimap(f)(I)(m));
  });

  property('mapRej(f)(m) = swap(map(f)(swap(m)))', anyFuture, function (m){
    return eq(mapRej(f)(m))(swap(map(f)(swap(m))));
  });

  property('map(f)(m) = swap(mapRej(f)(swap(m)))', anyFuture, function (m){
    return eq(map(f)(m))(swap(mapRej(f)(swap(m))));
  });

  property('rejectAfter(1)(x) = reject(x)', any, function (n, x){
    return eq(rejectAfter(1)(x))(reject(x));
  });

});
