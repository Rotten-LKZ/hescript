#!/usr/bin/env node

const lib = require('../dist/index.js')
const args = process.argv.splice(2)

lib.importConfigFile(args[0] ?? 'hescript.config.ts')
