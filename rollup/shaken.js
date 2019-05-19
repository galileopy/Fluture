(function (type, show) {
  'use strict';

  type = type && type.hasOwnProperty('default') ? type['default'] : type;
  show = show && show.hasOwnProperty('default') ? show['default'] : show;

  var FL = {
    alt: 'fantasy-land/alt',
    ap: 'fantasy-land/ap',
    bimap: 'fantasy-land/bimap',
    chain: 'fantasy-land/chain',
    chainRec: 'fantasy-land/chainRec',
    map: 'fantasy-land/map',
    of: 'fantasy-land/of',
    zero: 'fantasy-land/zero'
  };

  var ordinal = ['first', 'second', 'third', 'fourth', 'fifth'];

  var namespace = 'fluture';
  var name = 'Future';
  var version = 5;

  var $$type = namespace + '/' + name + '@' + version;

  var nil = {head: null};
  nil.tail = nil;

  function isNil(list){
    return list.tail === list;
  }

  // cons :: (a, List a) -> List a
  //      -- O(1) append operation
  function cons(head, tail){
    return {head: head, tail: tail};
  }

  // reverse :: List a -> List a
  //         -- O(n) list reversal
  function reverse(xs){
    var ys = nil, tail = xs;
    while(!isNil(tail)){
      ys = cons(tail.head, ys);
      tail = tail.tail;
    }
    return ys;
  }

  // cat :: (List a, List a) -> List a
  //     -- O(n) list concatenation
  function cat(xs, ys){
    var zs = ys, tail = reverse(xs);
    while(!isNil(tail)){
      zs = cons(tail.head, zs);
      tail = tail.tail;
    }
    return zs;
  }

  /* istanbul ignore next: non v8 compatibility */
  var captureStackTrace = Error.captureStackTrace || captureStackTraceFallback;
  var _debug = debugHandleNone;

  function debugHandleNone(x){
    return x;
  }

  function debug(x, fn, a, b, c){
    return _debug(x, fn, a, b, c);
  }

  function captureContext(previous, tag, fn){
    return debug(previous, debugCaptureContext, previous, tag, fn);
  }

  function debugCaptureContext(previous, tag, fn){
    var context = {tag: tag, name: ' from ' + tag + ':'};
    captureStackTrace(context, fn);
    return cons(context, previous);
  }

  function captureApplicationContext(context, n, f){
    return debug(context, debugCaptureApplicationContext, context, n, f);
  }

  function debugCaptureApplicationContext(context, n, f){
    return debugCaptureContext(context, ordinal[n - 1] + ' application of ' + f.name, f);
  }

  function captureStackTraceFallback(x){
    var e = new Error;
    /* istanbul ignore else: non v8 compatibility */
    if(typeof e.stack === 'string'){
      x.stack = x.name + '\n' + e.stack.split('\n').slice(1).join('\n');
    }else{
      x.stack = x.name;
    }
  }

  /* istanbul ignore next: non v8 compatibility */
  var setImmediate = typeof setImmediate === 'undefined' ? setImmediateFallback : setImmediate;

  function noop(){}
  function moop(){ return this }
  function call(f, x){ return f(x) }

  function setImmediateFallback(f, x){
    return setTimeout(f, 0, x);
  }

  function raise(x){
    setImmediate(function rethrowErrorDelayedToEscapePromiseCatch(){
      throw x;
    });
  }

  function showArg(x){
    return show(x) + ' :: ' + type.parse(type(x)).name;
  }

  function error(message){
    return new Error(message);
  }

  function typeError(message){
    return new TypeError(message);
  }

  function invalidArgument(it, at, expected, actual){
    return typeError(
      it + '() expects its ' + ordinal[at] + ' argument to ' + expected + '.' +
      '\n  Actual: ' + showArg(actual)
    );
  }

  function invalidArgumentOf(expected){
    return function(it, at, actual){
      return invalidArgument(it, at, expected, actual);
    };
  }

  function invalidArity(f, args){
    return new TypeError(
      f.name + '() expects to be called with a single argument per invocation\n' +
      '  Saw: ' + args.length + ' arguments' +
      Array.prototype.slice.call(args).map(function(arg, i){
        return '\n  ' + (
          ordinal[i] ?
          ordinal[i].charAt(0).toUpperCase() + ordinal[i].slice(1) :
          'Argument ' + String(i + 1)
        ) + ': ' + showArg(arg);
      }).join('')
    );
  }

  function invalidNamespace(m, x){
    return (
      'The Future was not created by ' + namespace + '. '
    + 'Make sure you transform other Futures to ' + namespace + ' Futures. '
    + 'Got ' + (x ? ('a Future from ' + x) : 'an unscoped Future') + '.'
    + '\n  See: https://github.com/fluture-js/Fluture#casting-futures'
    );
  }

  function invalidVersion(m, x){
    return (
      'The Future was created by ' + (x < version ? 'an older' : 'a newer')
    + ' version of ' + namespace + '. '
    + 'This means that one of the sources which creates Futures is outdated. '
    + 'Update this source, or transform its created Futures to be compatible.'
    + '\n  See: https://github.com/fluture-js/Fluture#casting-futures'
    );
  }

  function invalidFuture(desc, m, s){
    var id = type.parse(type(m));
    var info = id.name === name ? '\n' + (
      id.namespace !== namespace ? invalidNamespace(m, id.namespace)
    : id.version !== version ? invalidVersion(m, id.version)
    : 'Nothing seems wrong. Contact the Fluture maintainers.') : '';
    return typeError(
      desc + ' to be a valid Future.' + info + '\n' +
      '  Actual: ' + show(m) + ' :: ' + id.name + (s || '')
    );
  }

  function invalidFutureArgument(it, at, m, s){
    return invalidFuture(it + '() expects its ' + ordinal[at] + ' argument', m, s);
  }

  function ensureError(value, fn){
    var message;
    try{
      if(value instanceof Error) return value;
      message = 'A Non-Error was thrown from a Future: ' + show(value);
    }catch (_){
      message = 'Something was thrown from a Future, but it could not be converted to String';
    }
    var e = error(message);
    captureStackTrace(e, fn);
    return e;
  }

  function assignUnenumerable(o, prop, value){
    Object.defineProperty(o, prop, {value: value, writable: true, configurable: true});
  }

  function wrapException(caught, callingFuture){
    var origin = ensureError(caught, wrapException);
    var context = cat(origin.context || nil, callingFuture.context);
    var e = error(origin.message);
    assignUnenumerable(e, 'future', origin.future || callingFuture);
    assignUnenumerable(e, 'reason', origin.reason || origin);
    assignUnenumerable(e, 'stack', e.reason.stack);
    return withExtraContext(e, context);
  }

  function withExtraContext(e, context){
    assignUnenumerable(e, 'context', context);
    assignUnenumerable(e, 'stack', e.stack + contextToStackTrace(context));
    return e;
  }

  function contextToStackTrace(context){
    var stack = '', tail = context;
    while(tail !== nil){
      stack = stack + '\n' + tail.head.stack;
      tail = tail.tail;
    }
    return stack;
  }

  function isFunction(f){
    return typeof f === 'function';
  }

  function Next(x){
    return {done: false, value: x};
  }

  function Done(x){
    return {done: true, value: x};
  }

  /*eslint no-cond-assign:0, no-constant-condition:0 */

  function alwaysTrue(){
    return true;
  }

  var any = {pred: alwaysTrue, error: invalidArgumentOf('be anything')};
  var func = {pred: isFunction, error: invalidArgumentOf('be a Function')};
  var future = {pred: isFuture, error: invalidFutureArgument};

  function application(n, f, type, args, prev){
    if(args.length < 2 && type.pred(args[0])) return captureApplicationContext(prev, n, f);
    var e = args.length > 1 ? invalidArity(f, args) : type.error(f.name, n - 1, args[0]);
    captureStackTrace(e, f);
    throw withExtraContext(e, prev);
  }

  function application1(f, type, args){
    return application(1, f, type, args, nil);
  }

  function Future(computation){
    if(arguments.length > 1) throw invalidArity(Future, arguments);
    if(!isFunction(computation)) throw invalidArgument('Future', 0, 'be a Function', computation);
    return new Computation(captureContext(nil, 'first application of Future', Future), computation);
  }

  function isFuture(x){
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

  function createInterpreter(arity, name, interpret){
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

  var Computation =
  createInterpreter(1, 'Future', function Computation$interpret(rec, rej, res){
    var computation = this.$1, open = false, cancel = noop, cont = function(){ open = true; };
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

  var Never = createInterpreter(0, 'never', function Never$interpret(){
    return noop;
  });

  Never.prototype._isNever = true;

  var never = new Never(nil);

  var Crash = createInterpreter(1, 'crash', function Crash$interpret(rec){
    rec(this.$1);
    return noop;
  });

  var Reject = createInterpreter(1, 'reject', function Reject$interpret(rec, rej){
    rej(this.$1);
    return noop;
  });

  Reject.prototype.extractLeft = function Reject$extractLeft(){
    return [this.$1];
  };

  var Resolve = createInterpreter(1, 'resolve', function Resolve$interpret(rec, rej, res){
    res(this.$1);
    return noop;
  });

  Resolve.prototype.extractRight = function Resolve$extractRight(){
    return [this.$1];
  };

  function resolve(x){
    return new Resolve(application1(resolve, any, arguments), x);
  }

  //Note: This function is not curried because it's only used to satisfy the
  //      Fantasy Land ChainRec specification.
  function chainRec(step, init){
    return resolve(Next(init))._transform(new ChainTransformation(nil, function chainRec$recur(o){
      return o.done ?
             resolve(o.value) :
             step(Next, Done, o.value)._transform(new ChainTransformation(nil, chainRec$recur));
    }));
  }

  var Transformer = createInterpreter(2, '', function Transformer$interpret(rec, rej, res){

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

  var BaseTransformation = {
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

  function createTransformation(arity, name, prototype){
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

  var ApTransformation = createTransformation(1, 'ap', {
    resolved: function ApTransformation$resolved(f){
      if(isFunction(f)) return this.$1._transform(new MapTransformation(this.context, f));
      throw typeError(
        'ap expects the second Future to resolve to a Function\n' +
        '  Actual: ' + show(f)
      );
    }
  });

  var AltTransformation = createTransformation(1, 'alt', {
    rejected: function AltTransformation$rejected(){ return this.$1 }
  });

  var MapTransformation = createTransformation(1, 'map', {
    resolved: function MapTransformation$resolved(x){
      return new Resolve(this.context, call(this.$1, x));
    }
  });

  var BimapTransformation = createTransformation(2, 'bimap', {
    rejected: function BimapTransformation$rejected(x){
      return new Reject(this.context, call(this.$1, x));
    },
    resolved: function BimapTransformation$resolved(x){
      return new Resolve(this.context, call(this.$2, x));
    }
  });

  var ChainTransformation = createTransformation(1, 'chain', {
    resolved: function ChainTransformation$resolved(x){ return call(this.$1, x) }
  });

  /*eslint consistent-return: 0 */

  var Node = createInterpreter(1, 'node', function Node$interpret(rec, rej, res){
    function Node$done(err, val){
      cont = err ? function EncaseN3$rej(){
        open = false;
        rej(err);
      } : function EncaseN3$res(){
        open = false;
        res(val);
      };
      if(open){
        cont();
      }
    }
    var open = false, cont = function(){ open = true; };
    try{
      call(this.$1, Node$done);
    }catch(e){
      rec(wrapException(e, this));
      open = false;
      return noop;
    }
    cont();
    return function Node$cancel(){ open = false; };
  });

  function node(f){
    return new Node(application1(node, func, arguments), f);
  }

  function value(res){
    var context1 = application1(value, func, arguments);
    return function value(m){
      application(2, value, future, arguments, context1);
      function value$rej(x){
        raise(error(
          'Future#value was called on a rejected Future\n' +
          '  Rejection: ' + show(x) + '\n' +
          '  Future: ' + show(m)
        ));
      }
      return m._interpret(raise, value$rej, res);
    };
  }

  value (console.log) (node (done => done (null, 42)));

}(sanctuaryTypeIdentifiers, sanctuaryShow));
