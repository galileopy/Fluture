import show from 'sanctuary-show';
import {assertEqual, I, B, T, K} from '../util/util.mjs';
import {FutureArb, any as _x, anyFuture as _mx, f, g, property, _of, elements} from '../util/props.mjs';
import {
  alt,
  and,
  ap,
  bimap,
  cache,
  chain,
  chainRej,
  hook,
  lastly,
  map,
  mapRej,
  reject,
  resolve,
  swap,
} from '../../index.mjs';

var _f = elements([f, g, I, resolve]);
var _mf = _of(_f);
var _fm = FutureArb(_f, _f).smap(function (m){
  return function (x){
    return bimap(T(x))(T(x))(m);
  };
}, function (f){
  return bimap(K)(K)(f());
}, show);

function eq (x){
  return function (y){
    return assertEqual(x, y);
  };
}

describe('Algebra', function (){

  describe('alt', function (){

    property('associativity', _mx, _mx, _mx, function (a, b, c){
      return eq(alt(a)(alt(b)(c)))(alt(alt(a)(b))(c));
    });

    property('distributivity with map', _mx, _mx, function (a, b){
      return eq(map(f)(alt(a)(b)))(alt(map(f)(a))(map(f)(b)));
    });

  });

  describe('and', function (){

    property('associativity', _mx, _mx, _mx, function (a, b, c){
      return eq(and(a)(and(b)(c)))(and(and(a)(b))(c));
    });

    property('distributivity with map', _mx, _mx, function (a, b){
      return eq(map(f)(and(a)(b)))(and(map(f)(a))(map(f)(b)));
    });

  });

  describe('ap', function (){

    property('composition using map', _mx, _mf, _mf, function (mx, mf, mg){
      return eq(ap(mx)(ap(mf)(map(B)(mg))))(ap(ap(mx)(mf))(mg));
    });

  });

  describe('bimap', function (){

    property('identity', _mx, function (mx){
      return eq(bimap(I)(I)(mx))(mx);
    });

    property('composition', _mx, _f, _f, _f, _f, function (mx, f, g, h, i){
      return eq(bimap(B(f)(g))(B(h)(i))(mx))(bimap(f)(h)(bimap(g)(i)(mx)));
    });

  });

  describe('cache', function (){

    property('idempotence', _mx, function (m){
      return eq(cache(cache(m)))(cache(m));
    });

  });

  describe('chain', function (){

    property('associativity', _mx, _fm, _fm, function (m, f, g){
      return eq(chain(g)(chain(f)(m)))(chain(B(chain(g))(f))(m));
    });

    property('left identity', _x, _fm, function (x, f){
      return eq(chain(f)(resolve(x)))(f(x));
    });

    property('right identity', _mx, function (m){
      return eq(chain(resolve)(m))(m);
    });

  });

  describe('chainRej', function (){

    property('associativity', _mx, _fm, _fm, function (m, f, g){
      return eq(chainRej(g)(chainRej(f)(m)))(chainRej(B(chainRej(g))(f))(m));
    });

    property('left identity', _x, _fm, function (x, f){
      return eq(chainRej(f)(reject(x)))(f(x));
    });

    property('right identity', _mx, function (m){
      return eq(chainRej(reject)(m))(m);
    });

  });

  describe('hook', function (){

    property('identity', _mx, function (m){
      return eq(hook(m)(resolve)(resolve))(m);
    });

  });

  describe('lastly', function (){

    property('associativity', _mx, _mx, _mx, function (a, b, c){
      return eq(lastly(a)(lastly(b)(c)))(lastly(lastly(a)(b))(c));
    });

    property('distributivity with map', _mx, _mx, function (a, b){
      return eq(map(f)(lastly(a)(b)))(lastly(map(f)(a))(map(f)(b)));
    });

  });

  describe('map', function (){

    property('identity', _mx, function (m){
      return eq(map(I)(m))(m);
    });

    property('composition', _mx, _f, _f, function (m, f, g){
      return eq(map(B(f)(g))(m))(map(f)(map(g)(m)));
    });

  });

  describe('mapRej', function (){

    property('identity', _mx, function (m){
      return eq(mapRej(I)(m))(m);
    });

    property('composition', _mx, _f, _f, function (m, f, g){
      return eq(mapRej(B(f)(g))(m))(mapRej(f)(mapRej(g)(m)));
    });

  });

  describe('resolve', function (){

    property('identity for ap', _mx, function (mx){
      return eq(ap(mx)(resolve(I)))(mx);
    });

    property('homomorphism with ap', _x, function (x){
      return eq(ap(resolve(x))(resolve(f)))(resolve(f(x)));
    });

    property('interchange with ap', _x, _mf, function (x, mf){
      return eq(ap(resolve(x))(mf))(ap(mf)(resolve(T(x))));
    });

  });

  describe('swap', function (){

    property('self inverse', _mx, function (m){
      return eq(swap(swap(m)))(m);
    });

  });

});
