rm -f shaken.js unshaken.js
../node_modules/.bin/rollup -c noshake.config.js
../node_modules/.bin/rollup -c shake.config.js
echo $((`cat unshaken.js | wc -c` - `cat shaken.js | wc -c`))
