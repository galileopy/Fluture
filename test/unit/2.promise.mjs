import {promise} from '../../index.mjs';
import {testFunction, futureArg} from '../util/props.mjs';
import {noop, isThenable, eq, error} from '../util/util.mjs';
import {crashed, rejected, resolved} from '../util/futures.mjs';

describe('promise()', function (){

  before('setup global promise handler', function (){
    process.addListener('unhandledRejection', noop);
  });

  after('remove global promise handler', function (){
    process.removeListener('unhandledRejection', noop);
  });

  testFunction('promise', promise, [futureArg], isThenable);

  it('returns a Promise', function (){
    var actual = promise(resolved);
    eq(actual instanceof Promise, true);
  });

  it('rejects if the Future crashes', function (){
    return promise(crashed).then(
      function (){ throw new Error('It resolved') },
      function (x){ eq(x, error) }
    );
  });

  it('rejects if the Future rejects', function (){
    return promise(rejected).then(
      function (){ throw new Error('It resolved') },
      function (x){ eq(x, 'rejected') }
    );
  });

  it('resolves if the Future resolves', function (){
    return promise(resolved).then(
      function (x){ eq(x, 'resolved') }
    );
  });

});
