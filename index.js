'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/vue-web3.prod.cjs')
} else {
  module.exports = require('./dist/vue-web3.cjs')
}
