import {FL} from './internal/const';
import {invalidArgumentOf} from './internal/error';
import {isChain} from './internal/predicates';
import {isFuture, application1, application, func, ChainTransformation} from './future';

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
