import {FL} from './internal/const.mjs';
import {invalidArgumentOf} from './internal/error.mjs';
import {isChain} from './internal/predicates.mjs';
import {isFuture, application1, application, func, ChainTransformation} from './future.mjs';

export var monad = {pred: isChain, error: invalidArgumentOf('have Chain implemented')};

export function chain(f){
  var context1 = application1(chain, func, arguments);
  return function chain(m){
    var context2 = application(2, chain, monad, arguments, context1);
    return isFuture(m) ?
           m._transform(new ChainTransformation(context2, f)) :
           m[FL.chain](f);
  };
}
