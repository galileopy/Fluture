import concurrify from 'concurrify';
import type from 'sanctuary-type-identifiers';

import {Future, never} from './future.mjs';
import {parallelAp} from './parallel-ap.mjs';
import {race} from './race.mjs';

function uncurry(f){
  return function(a, b){
    return f(a)(b);
  };
}

export var Par = concurrify(Future, never, uncurry(race), uncurry(parallelAp));

export function isParallel(x){
  return x instanceof Par || type(x) === Par['@@type'];
}
