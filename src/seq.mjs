import {invalidArgument, invalidArity} from './internal/error';
import {isParallel} from './par';

export function seq(par){
  if(arguments.length > 1) throw invalidArity(seq, arguments);
  if(!isParallel(par)) throw invalidArgument('seq', 0, 'be a ConcurrentFuture', par);
  return par.sequential;
}
