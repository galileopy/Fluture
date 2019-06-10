import FL from 'fantasy-laws';
import Z from 'sanctuary-type-classes';
import show from 'sanctuary-show';
import {Future, bimap} from '../../index.mjs';
import {assertEqual as eq, I, B, T, K, noop, STACKSIZE} from '../util/util.mjs';
import {
  FutureArb,
  _of,
  any as _x,
  anyFuture as _mx,
  constant as _k,
  elements,
  f,
  g,
  nat,
  property,
  suchthat,
} from '../util/props.mjs';

var of = function (x){
  return Z.of(Future, x);
};

var _f = elements([f, g, I, of]);
var _mf = _of(_f);
var _fm = FutureArb(_f, _f).smap(function (m){
  return function (x){
    return bimap(T(x))(T(x))(m);
  };
}, function (f){
  return bimap(K)(K)(f());
}, show);

function test (laws, name){
  var args = Array.prototype.slice.call(arguments, 2);
  it(name, laws[name].apply(null, args));
}

describe('Fantasy Land', function (){

  describe('Functor', function (){
    test(FL.Functor(eq), 'identity', _mx);
    test(FL.Functor(eq), 'composition', _mx, _f, _f);
  });

  describe('Alt', function (){
    test(FL.Alt(eq), 'associativity', _mx, _mx, _mx);
    test(FL.Alt(eq), 'distributivity', _mx, _mx, _f);
  });

  describe('Bifunctor', function (){
    test(FL.Bifunctor(eq), 'identity', _mx);
    test(FL.Bifunctor(eq), 'composition', _mx, _f, _f, _f, _f);
  });

  describe('Apply', function (){
    test(FL.Apply(eq), 'composition', _mf, _mf, _mx);
  });

  describe('Applicative', function (){
    test(FL.Applicative(eq, Future), 'identity', _mx);
    test(FL.Applicative(eq, Future), 'homomorphism', _f, _x);
    test(FL.Applicative(eq, Future), 'interchange', _mf, _x);
  });

  describe('Chain', function (){
    test(FL.Chain(eq), 'associativity', _mx, _fm, _fm);
  });

  describe('ChainRec', function (){
    test(
      FL.ChainRec(eq, Future),
      'equivalence',
      _k(function (v){ return v < 1 }),
      _k(B(of)(function (v){ return v - 1 })),
      _k(of),
      suchthat(nat, function (x){ return x < 100 })
    );
    it('stack-safety', function (){
      var p = function (v){ return v > (STACKSIZE + 1) };
      var d = of;
      var n = B(of)(function (v){ return v + 1 });
      var a = Z.chainRec(Future, function (l, r, v){ return p(v) ? Z.map(r, d(v)) : Z.map(l, n(v)) }, 0);
      a._interpret(noop, noop, noop);
    });
  });

  describe('Monad', function (){
    test(FL.Monad(eq, Future), 'leftIdentity', _fm, _mx);
    test(FL.Monad(eq, Future), 'rightIdentity', _mx);
  });

  describe('Derivations', function (){
    property('map from ap and of', _mx, _f, function (m, f){
      return eq(Z.map(f, m), Z.ap(of(f), m));
    });

    property('map from chain and of', _mx, _f, function (m, f){
      return eq(Z.map(f, m), Z.chain(B(of)(f), m));
    });

    property('map from bimap', _mx, _f, function (m, f){
      return eq(Z.map(f, m), Z.bimap(I, f, m));
    });

    property('ap from chain and map', _mx, _mf, function (mx, mf){
      return eq(Z.ap(mf, mx), Z.chain(function (f){ return Z.map(f, mx) }, mf));
    });
  });

});
