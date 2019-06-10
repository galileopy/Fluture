import {encase} from './encase.mjs';

export function attempt(_){
  return encase.apply(this, arguments)(undefined);
}
