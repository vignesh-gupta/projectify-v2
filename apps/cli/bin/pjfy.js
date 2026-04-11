#!/usr/bin/env node
/* global console, process */

import('../dist/index.js').catch((error) => {
  console.error('Failed to load CLI:', error);
  process.exit(1);
});
