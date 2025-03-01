import {createParallelTransformation, earlyCrash, earlyReject} from './internal/parallel';
import {noop} from './internal/utils';
import {typeError} from './internal/error';
import {isFunction} from './internal/predicates';
import {show} from './internal/utils';
import {MapTransformation, application1, application, future} from './future';

export var ParallelApTransformation =
createParallelTransformation('parallelAp', earlyCrash, earlyReject, noop, {
  resolved: function ParallelApTransformation$resolved(f){
    if(isFunction(f)) return this.$1._transform(new MapTransformation(this.context, f));
    throw typeError(
      'parallelAp expects the second Future to resolve to a Function\n' +
      '  Actual: ' + show(f)
    );
  }
});

export function parallelAp(mx){
  var context1 = application1(parallelAp, future, arguments);
  return function parallelAp(mf){
    var context2 = application(2, parallelAp, future, arguments, context1);
    return mf._transform(new ParallelApTransformation(context2, mx));
  };
}
