import {encaseP} from './encase-p.mjs';

export function attemptP(_){
  return encaseP.apply(this, arguments)(undefined);
}
