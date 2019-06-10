import {createTransformation, Reject, Resolve, application1, future} from './future.mjs';

export var SwapTransformation = createTransformation(0, 'swap', {
  resolved: function SwapTransformation$resolved(x){
    return new Reject(this.context, x);
  },
  rejected: function SwapTransformation$rejected(x){
    return new Resolve(this.context, x);
  }
});

export function swap(m){
  var context = application1(swap, future, arguments);
  return m._transform(new SwapTransformation(context));
}
