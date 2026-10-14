'use strict';

const dependencies = require('../package.json').dependencies;
const missing = [];

Object.keys(dependencies).forEach(function (name) {
  try {
    require.resolve(name, { paths: [process.cwd()] });
  } catch (err) {
    // Framework plugins can be installed packages without a main entry point.
    try {
      require.resolve(name + '/package.json', { paths: [process.cwd()] });
    } catch (packageError) {
      missing.push(name);
    }
  }
});

if (missing.length) {
  console.error('Missing server dependencies: ' + missing.join(', '));
  process.exit(1);
}

// Check that the logger and its own runtime dependencies can actually load.
require('@project-sunbird/logger');
console.log('Server dependencies validated');
