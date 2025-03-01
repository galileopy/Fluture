import {FL} from './internal/const';
import {invalidArgumentOf} from './internal/error';
import {isBifunctor} from './internal/predicates';
import {isFuture, BimapTransformation, application1, application, func} from './future';

export var bifunctor = {pred: isBifunctor, error: invalidArgumentOf('have Bifunctor implemented')};

export function bimap(f){
  var context1 = application1(bimap, func, arguments);
  return function bimap(g){
    var context2 = application(2, bimap, func, arguments, context1);
    return function bimap(m){
      var context3 = application(3, bimap, bifunctor, arguments, context2);
      return isFuture(m) ?
             m._transform(new BimapTransformation(context3, f, g)) :
             m[FL.bimap](f, g);
    };
  };
}
