var dependencies = {
  'concurrify': 'concurrify',
  'denque': 'Denque',
  'sanctuary-show': 'sanctuaryShow',
  'sanctuary-type-identifiers': 'sanctuaryTypeIdentifiers'
};

export default {
  input: 'test.mjs',
  external: Object.keys(dependencies),
  treeshake: {moduleSideEffects: false},
  output: {
    format: 'iife',
    file: 'shaken.js',
    globals: dependencies
  }
};
