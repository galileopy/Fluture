import {FL} from './internal/const';
import {invalidArgumentOf} from './internal/error';
import {isFunctor} from './internal/predicates';
import {isFuture, MapTransformation, application1, application, func} from './future';

export var functor = {pred: isFunctor, error: invalidArgumentOf('have Functor implemented')};

export function map(f){
  var context1 = application1(map, func, arguments);
  return function map(m){
    var context2 = application(2, map, functor, arguments, context1);
    return isFuture(m) ?
           m._transform(new MapTransformation(context2, f)) :
           m[FL.map](f);
  };
}
