import {FL} from './internal/const';
import {invalidArgumentOf} from './internal/error';
import {isApply} from './internal/predicates';
import {isFuture, ApTransformation, application1, application, future} from './future';

export var apply = {pred: isApply, error: invalidArgumentOf('have Apply implemented')};

export function ap(mx){
  if(isFuture(mx)){
    var context1 = application1(ap, future, arguments);
    return function ap(mf){
      var context2 = application(2, ap, future, arguments, context1);
      return mf._transform(new ApTransformation(context2, mx));
    };
  }

  var context = application1(ap, apply, arguments);
  return function ap(mf){
    application(2, ap, apply, arguments, context);
    return mx[FL.ap](mf);
  };
}
