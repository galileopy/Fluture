var dependencies = {
  'concurrify': 'concurrify',
  'denque': 'Denque',
  'sanctuary-show': 'sanctuaryShow',
  'sanctuary-type-identifiers': 'sanctuaryTypeIdentifiers'
};

export default {
  input: 'test.mjs',
  external: Object.keys(dependencies),
  treeshake: false,
  output: {
    format: 'iife',
    file: 'unshaken.js',
    globals: dependencies
  }
};
