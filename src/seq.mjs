import {invalidArgumentOf} from './internal/error.mjs';
import {application1} from './future.mjs';
import {isParallel} from './par.mjs';

var parallel = {pred: isParallel, error: invalidArgumentOf('be a ConcurrentFuture')};

export function seq(par){
  application1(seq, parallel, arguments);
  return par.sequential;
}
