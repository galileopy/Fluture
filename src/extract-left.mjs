import {application1, future} from './future.mjs';

export function extractLeft(m){
  application1(extractLeft, future, arguments);
  return m.extractLeft();
}
