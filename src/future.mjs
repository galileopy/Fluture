/*eslint no-cond-assign:0, no-constant-condition:0 */
import type from 'sanctuary-type-identifiers';

import {FL, $$type} from './internal/const.mjs';
import {captureContext, captureApplicationContext, captureStackTrace} from './internal/debug.mjs';
import {
  invalidArgument,
  invalidArgumentOf,
  invalidArity,
  invalidFuture,
  invalidFutureArgument,
  typeError,
  withExtraContext,
  wrapException
} from './internal/error.mjs';
import {Next, Done} from './internal/iteration.mjs';
import {nil, cons, isNil, reverse} from './internal/list.mjs';
import {isFunction, isUnsigned} from './internal/predicates.mjs';
import {show, noop, call, moop} from './internal/utils.mjs';

function alwaysTrue(){
  return true;
}

export var any = {pred: alwaysTrue, error: invalidArgumentOf('be anything')};
export var func = {pred: isFunction, error: invalidArgumentOf('be a Function')};
export var future = {pred: isFuture, error: invalidFutureArgument};
export var positiveInteger = {pred: isUnsigned, error: invalidArgumentOf('be a positive Integer')};

export function application(n, f, type, args, prev){
  if(args.length < 2 && type.pred(args[0])) return captureApplicationContext(prev, n, f);
  var e = args.length > 1 ? invalidArity(f, args) : type.error(f.name, n - 1, args[0]);
  captureStackTrace(e, f);
  throw withExtraContext(e, prev);
}

export function application1(f, type, args){
  return application(1, f, type, args, nil);
}

export function Future(computation){
  var context = application1(Future, func, arguments);
  return new Computation(context, computation);
}

export function isFuture(x){
  return x instanceof Future || type(x) === $$type;
}

Future['@@type'] = $$type;
Future[FL.of] = resolve;
Future[FL.chainRec] = chainRec;

Future.prototype['@@show'] = function Future$show(){
  return this.toString();
};

Future.prototype.pipe = function Future$pipe(f){
  if(!isFunction(f)) throw invalidArgument('Future#pipe', 0, 'be a Function', f);
  return f(this);
};

Future.prototype[FL.ap] = function Future$FL$ap(other){
  var context = captureContext(nil, 'a Fantasy Land dispatch to ap', Future$FL$ap);
  return other._transform(new ApTransformation(context, this));
};

Future.prototype[FL.map] = function Future$FL$map(mapper){
  var context = captureContext(nil, 'a Fantasy Land dispatch to map', Future$FL$map);
  return this._transform(new MapTransformation(context, mapper));
};

Future.prototype[FL.bimap] = function Future$FL$bimap(lmapper, rmapper){
  var context = captureContext(nil, 'a Fantasy Land dispatch to bimap', Future$FL$bimap);
  return this._transform(new BimapTransformation(context, lmapper, rmapper));
};

Future.prototype[FL.chain] = function Future$FL$chain(mapper){
  var context = captureContext(nil, 'a Fantasy Land dispatch to chain', Future$FL$chain);
  return this._transform(new ChainTransformation(context, mapper));
};

Future.prototype[FL.alt] = function Future$FL$alt(other){
  var context = captureContext(nil, 'a Fantasy Land dispatch to alt', Future$FL$alt);
  return this._transform(new AltTransformation(context, other));
};

Future.prototype.extractLeft = function Future$extractLeft(){
  return [];
};

Future.prototype.extractRight = function Future$extractRight(){
  return [];
};

Future.prototype._transform = function Future$transform(transformation){
  return new Transformer(transformation.context, this, cons(transformation, nil));
};

Future.prototype.isTransformer = false;
Future.prototype.context = nil;
Future.prototype.arity = 0;
Future.prototype.name = 'future';

Future.prototype.toString = function(){
  var str = this.name;
  for(var i = 1; i <= this.arity; i++){
    str += ' (' + show(this['$' + String(i)]) + ')';
  }
  return str;
};

export function createInterpreter(arity, name, interpret){
  var Interpreter = function(context, $1, $2, $3){
    this.context = context;
    this.$1 = $1;
    this.$2 = $2;
    this.$3 = $3;
  };

  Interpreter.prototype = Object.create(Future.prototype);
  Interpreter.prototype.arity = arity;
  Interpreter.prototype.name = name;
  Interpreter.prototype._interpret = interpret;

  return Interpreter;
}

export var Computation =
createInterpreter(1, 'Future', function Computation$interpret(rec, rej, res){
  var computation = this.$1, open = false, cancel = noop, cont = function(){ open = true };
  try{
    cancel = computation(function Computation$rej(x){
      cont = function Computation$rej$cont(){
        open = false;
        rej(x);
      };
      if(open){
        cont();
      }
    }, function Computation$res(x){
      cont = function Computation$res$cont(){
        open = false;
        res(x);
      };
      if(open){
        cont();
      }
    }) || noop;
  }catch(e){
    rec(wrapException(e, this));
    return noop;
  }
  if(!(isFunction(cancel) && cancel.length === 0)){
    rec(wrapException(typeError(
      'The computation was expected to return a nullary function or void\n' +
      '  Actual: ' + show(cancel)
    ), this));
    return noop;
  }
  cont();
  return function Computation$cancel(){
    if(open){
      open = false;
      cancel && cancel();
    }
  };
});

export var Never = createInterpreter(0, 'never', function Never$interpret(){
  return noop;
});

Never.prototype._isNever = true;

export var never = new Never(nil);

export function isNever(x){
  return isFuture(x) && x._isNever === true;
}

export var Crash = createInterpreter(1, 'crash', function Crash$interpret(rec){
  rec(this.$1);
  return noop;
});

export function crash(x){
  return new Crash(application1(crash, any, arguments), x);
}

export var Reject = createInterpreter(1, 'reject', function Reject$interpret(rec, rej){
  rej(this.$1);
  return noop;
});

Reject.prototype.extractLeft = function Reject$extractLeft(){
  return [this.$1];
};

export function reject(x){
  return new Reject(application1(reject, any, arguments), x);
}

export var Resolve = createInterpreter(1, 'resolve', function Resolve$interpret(rec, rej, res){
  res(this.$1);
  return noop;
});

Resolve.prototype.extractRight = function Resolve$extractRight(){
  return [this.$1];
};

export function resolve(x){
  return new Resolve(application1(resolve, any, arguments), x);
}

//Note: This function is not curried because it's only used to satisfy the
//      Fantasy Land ChainRec specification.
export function chainRec(step, init){
  return resolve(Next(init))._transform(new ChainTransformation(nil, function chainRec$recur(o){
    return o.done ?
           resolve(o.value) :
           step(Next, Done, o.value)._transform(new ChainTransformation(nil, chainRec$recur));
  }));
}

export var Transformer = createInterpreter(2, '', function Transformer$interpret(rec, rej, res){

  //These are the cold, and hot, transformation stacks. The cold actions are those that
  //have yet to run parallel computations, and hot are those that have.
  var cold = nil, hot = nil;

  //These combined variables define our current state.
  // future         = the future we are currently forking
  // transformation = the transformation to be informed when the future settles
  // cancel         = the cancel function of the current future
  // settled        = a boolean indicating whether a new tick should start
  // async          = a boolean indicating whether we are awaiting a result asynchronously
  var future, transformation, cancel = noop, settled, async = true, it;

  //Takes an transformation from the top of the hot stack and returns it.
  function nextHot(){
    var x = hot.head;
    hot = hot.tail;
    return x;
  }

  //Takes an transformation from the top of the cold stack and returns it.
  function nextCold(){
    var x = cold.head;
    cold = cold.tail;
    return x;
  }

  //This function is called with a future to use in the next tick.
  //Here we "flatten" the actions of another Sequence into our own actions,
  //this is the magic that allows for infinitely stack safe recursion because
  //actions like ChainAction will return a new Sequence.
  //If we settled asynchronously, we call drain() directly to run the next tick.
  function settle(m){
    settled = true;
    future = m;
    if(future.isTransformer){
      var tail = future.$2;
      while(!isNil(tail)){
        cold = cons(tail.head, cold);
        tail = tail.tail;
      }
      future = future.$1;
    }
    if(async) drain();
  }

  //This function serves as a rejection handler for our current future.
  //It will tell the current transformation that the future rejected, and it will
  //settle the current tick with the transformation's answer to that.
  function rejected(x){
    settle(transformation.rejected(x));
  }

  //This function serves as a resolution handler for our current future.
  //It will tell the current transformation that the future resolved, and it will
  //settle the current tick with the transformation's answer to that.
  function resolved(x){
    settle(transformation.resolved(x));
  }

  //This function is passed into actions when they are "warmed up".
  //If the transformation decides that it has its result, without the need to await
  //anything else, then it can call this function to force "early termination".
  //When early termination occurs, all actions which were stacked prior to the
  //terminator will be skipped. If they were already hot, they will also be
  //sent a cancel signal so they can cancel their own concurrent computations,
  //as their results are no longer needed.
  function early(m, terminator){
    cancel();
    cold = nil;
    if(async && transformation !== terminator){
      transformation.cancel();
      while((it = nextHot()) && it !== terminator) it.cancel();
    }
    settle(m);
  }

  //This will cancel the current Future, the current transformation, and all stacked hot actions.
  function Sequence$cancel(){
    cancel();
    transformation && transformation.cancel();
    while(it = nextHot()) it.cancel();
  }

  //This function is called when an exception is caught.
  function exception(e){
    Sequence$cancel();
    settled = true;
    cold = hot = nil;
    var error = wrapException(e, future);
    future = never;
    rec(error);
  }

  //This function serves to kickstart concurrent computations.
  //Takes all actions from the cold stack in reverse order, and calls run() on
  //each of them, passing them the "early" function. If any of them settles (by
  //calling early()), we abort. After warming up all actions in the cold queue,
  //we warm up the current transformation as well.
  function warmupActions(){
    cold = reverse(cold);
    while(cold !== nil){
      it = cold.head.run(early);
      if(settled) return;
      hot = cons(it, hot);
      cold = cold.tail;
    }
    transformation = transformation.run(early);
  }

  //This function represents our main execution loop. By "tick", we've been
  //referring to the execution of one iteration in the while-loop below.
  function drain(){
    async = false;
    while(true){
      settled = false;
      if(transformation = nextCold()){
        cancel = future._interpret(exception, rejected, resolved);
        if(!settled) warmupActions();
      }else if(transformation = nextHot()){
        cancel = future._interpret(exception, rejected, resolved);
      }else break;
      if(settled) continue;
      async = true;
      return;
    }
    cancel = future._interpret(exception, rej, res);
  }

  //Start the execution loop.
  settle(this);

  //Return the cancellation function.
  return Sequence$cancel;

});

Transformer.prototype.isTransformer = true;

Transformer.prototype._transform = function Transformer$_transform(transformation){
  return new Transformer(transformation.context, this.$1, cons(transformation, this.$2));
};

Transformer.prototype.toString = function Transformer$toString(){
  var i, str = this.$1.toString(), str2, tail = this.$2;

  while(!isNil(tail)){
    str2 = tail.head.name;
    for(i = 1; i <= tail.head.arity; i++){
      str2 += ' (' + show(tail.head['$' + String(i)]) + ')';
    }
    str = str2 + ' (' + str + ')';
    tail = tail.tail;
  }

  return str;
};

function BaseTransformation$rejected(x){
  this.cancel();
  return new Reject(this.context, x);
}

function BaseTransformation$resolved(x){
  this.cancel();
  return new Resolve(this.context, x);
}

export var BaseTransformation = {
  rejected: BaseTransformation$rejected,
  resolved: BaseTransformation$resolved,
  run: moop,
  cancel: noop,
  context: nil,
  arity: 0,
  name: 'transform'
};

function wrapHandler(handler){
  return function transformationHandler(x){
    var m;
    try{
      m = handler.call(this, x);
    }catch(e){
      return new Crash(this.context, e);
    }
    if(isFuture(m)){
      return m;
    }
    return new Crash(this.context, invalidFuture(
      this.name + ' expects the return value from the function it\'s given', m,
      '\n  When called with: ' + show(x)
    ));
  };
}

export function createTransformation(arity, name, prototype){
  var Transformation = function(context, $1, $2){
    this.context = context;
    this.$1 = $1;
    this.$2 = $2;
  };

  Transformation.prototype = Object.create(BaseTransformation);
  Transformation.prototype.arity = arity;
  Transformation.prototype.name = name;

  if(typeof prototype.rejected === 'function'){
    Transformation.prototype.rejected = wrapHandler(prototype.rejected);
  }

  if(typeof prototype.resolved === 'function'){
    Transformation.prototype.resolved = wrapHandler(prototype.resolved);
  }

  if(typeof prototype.run === 'function'){
    Transformation.prototype.run = prototype.run;
  }

  return Transformation;
}

export var ApTransformation = createTransformation(1, 'ap', {
  resolved: function ApTransformation$resolved(f){
    if(isFunction(f)) return this.$1._transform(new MapTransformation(this.context, f));
    throw typeError(
      'ap expects the second Future to resolve to a Function\n' +
      '  Actual: ' + show(f)
    );
  }
});

export var AltTransformation = createTransformation(1, 'alt', {
  rejected: function AltTransformation$rejected(){ return this.$1 }
});

export var MapTransformation = createTransformation(1, 'map', {
  resolved: function MapTransformation$resolved(x){
    return new Resolve(this.context, call(this.$1, x));
  }
});

export var BimapTransformation = createTransformation(2, 'bimap', {
  rejected: function BimapTransformation$rejected(x){
    return new Reject(this.context, call(this.$1, x));
  },
  resolved: function BimapTransformation$resolved(x){
    return new Resolve(this.context, call(this.$2, x));
  }
});

export var ChainTransformation = createTransformation(1, 'chain', {
  resolved: function ChainTransformation$resolved(x){ return call(this.$1, x) }
});
