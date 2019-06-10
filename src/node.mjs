import {wrapException} from './internal/error.mjs';
import {noop, call} from './internal/utils.mjs';
import {createInterpreter, application1, func} from './future.mjs';

export var Node = createInterpreter(1, 'node', function Node$interpret(rec, rej, res){
  function Node$done(err, val){
    cont = err ? function EncaseN3$rej(){
      open = false;
      rej(err);
    } : function EncaseN3$res(){
      open = false;
      res(val);
    };
    if(open){
      cont();
    }
  }
  var open = false, cont = function(){ open = true };
  try{
    call(this.$1, Node$done);
  }catch(e){
    rec(wrapException(e, this));
    open = false;
    return noop;
  }
  cont();
  return function Node$cancel(){ open = false };
});

export function node(f){
  return new Node(application1(node, func, arguments), f);
}
