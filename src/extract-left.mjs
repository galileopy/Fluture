import {application1, future} from './future';

export function extractLeft(m){
  application1(extractLeft, future, arguments);
  return m.extractLeft();
}
