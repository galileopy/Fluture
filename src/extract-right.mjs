import {application1, future} from './future.mjs';

export function extractRight(m){
  application1(extractRight, future, arguments);
  return m.extractRight();
}
