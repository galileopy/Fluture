import {
  createParallelTransformation,
  earlyCrash,
  earlyReject,
  earlyResolve
} from './internal/parallel';
import {application1, application, future} from './future';

export var RaceTransformation =
createParallelTransformation('race', earlyCrash, earlyReject, earlyResolve, {});

export function race(left){
  var context1 = application1(race, future, arguments);
  return function race(right){
    var context2 = application(2, race, future, arguments, context1);
    return right._transform(new RaceTransformation(context2, left));
  };
}
