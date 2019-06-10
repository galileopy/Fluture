import chai from 'chai';
import {node} from '../../index.mjs';
import * as U from '../util/util.mjs';
import {testFunction, functionArg} from '../util/props.mjs';

var expect = chai.expect;

describe('node()', function (){

  testFunction('node', node, [functionArg], U.assertValidFuture);

  describe('#_interpret()', function (){

    it('crashes when the function throws', function (){
      var m = node(function (){ throw U.error });
      return U.assertCrashed(m, U.error);
    });

    it('rejects when the callback is called with (err)', function (){
      var f = function (done){ return done(U.error) };
      return U.assertRejected(node(f), U.error);
    });

    it('resolves when the callback is called with (null, a)', function (){
      var f = function (done){ return done(null, 'a') };
      return U.assertResolved(node(f), 'a');
    });

    it('settles with the last synchronous call to done', function (){
      var f = function (done){ done(null, 'a'); done(U.error); done(null, 'b') };
      return U.assertResolved(node(f), 'b');
    });

    it('settles with the first asynchronous call to done', function (){
      var f = function (done){
        setTimeout(done, 10, null, 'a');
        setTimeout(done, 50, null, 'b');
      };
      return U.assertResolved(node(f), 'a');
    });

    it('ensures no continuations are called after cancel', function (done){
      var f = function (done){ return setTimeout(done, 5) };
      node(f)._interpret(done, U.failRej, U.failRes)();
      setTimeout(done, 20);
    });

  });

  describe('#toString()', function (){

    it('returns the code to create the Future', function (){
      var f = function (a){ return void a };
      var m = node(f);
      expect(m.toString()).to.equal('node (' + f.toString() + ')');
    });

  });

});
