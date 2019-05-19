import {wrapException} from './internal/error';
import {noop} from './internal/utils';
import {
  createInterpreter,
  resolve,
  application1,
  positiveInteger,
  application,
  futureArray
} from './future';

export var Parallel = createInterpreter(2, 'parallel', function Parallel$interpret(rec, rej, res){

  var _this = this, futures = this.$2, length = futures.length;
  var max = Math.min(this.$1, length), cancels = new Array(length), out = new Array(length);
  var cursor = 0, running = 0, blocked = false;

  function Parallel$cancel(){
    cursor = length;
    for(var n = 0; n < length; n++) cancels[n] && cancels[n]();
  }

  function Parallel$run(idx){
    running++;
    cancels[idx] = futures[idx]._interpret(function Parallel$rec(e){
      cancels[idx] = noop;
      Parallel$cancel();
      rec(wrapException(e, _this));
    }, function Parallel$rej(reason){
      cancels[idx] = noop;
      Parallel$cancel();
      rej(reason);
    }, function Parallel$res(value){
      cancels[idx] = noop;
      out[idx] = value;
      running--;
      if(cursor === length && running === 0) res(out);
      else if(blocked) Parallel$drain();
    });
  }

  function Parallel$drain(){
    blocked = false;
    while(cursor < length && running < max) Parallel$run(cursor++);
    blocked = true;
  }

  Parallel$drain();

  return Parallel$cancel;

});

var emptyArray = resolve([]);

export function parallel(max){
  var context1 = application1(parallel, positiveInteger, arguments);
  return function parallel(ms){
    var context2 = application(2, parallel, futureArray, arguments, context1);
    return ms.length === 0 ? emptyArray : new Parallel(context2, max, ms);
  };
}
