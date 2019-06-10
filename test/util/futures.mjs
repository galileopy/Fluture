import {Future, resolve, reject, after, rejectAfter, and} from '../../index.mjs';
import {crash} from '../../src/future.mjs';
import {error} from '../util/util.mjs';

export var mock = Object.create(Future.prototype);
mock._interpret = function (){ throw new Error('Override _interpret on mock Future') };
mock.toString = function (){ return '(util.mock)' };

export var resolved = resolve('resolved');
export var rejected = reject('rejected');
export var resolvedSlow = after(20)('resolvedSlow');
export var rejectedSlow = rejectAfter(20)('rejectedSlow');
export var crashed = crash(error);
export var crashedSlow = and(crashed)(after(20)(null));
