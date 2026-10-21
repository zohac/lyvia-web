// Résolution du code compilé par tsc, sans checkout API ni runtime Nuxt.
const Module = require('node:module')
const path = require('node:path')

const resolve = Module._resolveFilename
Module._resolveFilename = function (request, ...args) {
  if (request.startsWith('#shared/')) {
    request = path.resolve(__dirname, '../.tmp/test-dist/shared', request.slice(8))
  }
  return resolve.call(this, request, ...args)
}
