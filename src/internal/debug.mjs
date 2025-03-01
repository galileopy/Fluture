import {ordinal} from './const';
import {cons} from './list';

/* istanbul ignore next: non v8 compatibility */
var captureStackTrace = Error.captureStackTrace || captureStackTraceFallback;
var _debug = debugHandleNone;

export {captureStackTrace};

export function debugMode(debug){
  _debug = debug ? debugHandleAll : debugHandleNone;
}

export function debugHandleNone(x){
  return x;
}

export function debugHandleAll(x, fn, a, b, c){
  return fn(a, b, c);
}

export function debug(x, fn, a, b, c){
  return _debug(x, fn, a, b, c);
}

export function captureContext(previous, tag, fn){
  return debug(previous, debugCaptureContext, previous, tag, fn);
}

export function debugCaptureContext(previous, tag, fn){
  var context = {tag: tag, name: ' from ' + tag + ':'};
  captureStackTrace(context, fn);
  return cons(context, previous);
}

export function captureApplicationContext(context, n, f){
  return debug(context, debugCaptureApplicationContext, context, n, f);
}

export function debugCaptureApplicationContext(context, n, f){
  return debugCaptureContext(context, ordinal[n - 1] + ' application of ' + f.name, f);
}

export function captureStackTraceFallback(x){
  var e = new Error;
  /* istanbul ignore else: non v8 compatibility */
  if(typeof e.stack === 'string'){
    x.stack = x.name + '\n' + e.stack.split('\n').slice(1).join('\n');
  }else{
    x.stack = x.name;
  }
}
