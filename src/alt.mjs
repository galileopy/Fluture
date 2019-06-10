import {FL} from './internal/const.mjs';
import {invalidArgumentOf} from './internal/error.mjs';
import {isAlt} from './internal/predicates.mjs';
import {
  AltTransformation,
  application,
  application1,
  future,
  isFuture
} from './future.mjs';

export var alternative = {pred: isAlt, error: invalidArgumentOf('have Alt implemented')};

export function alt(left){
  if(isFuture(left)){
    var context1 = application1(alt, future, arguments);
    return function alt(right){
      var context2 = application(2, alt, future, arguments, context1);
      return right._transform(new AltTransformation(context2, left));
    };
  }

  var context = application1(alt, alternative, arguments);
  return function alt(right){
    application(2, alt, alternative, arguments, context);
    return left[FL.alt](right);
  };
}
