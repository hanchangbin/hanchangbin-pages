const test = require('ava')
const hanchangbinPages = require('..')

// TODO: Implement module test
test('<test-title>', t => {
  const err = t.throws(() => hanchangbinPages(100), TypeError)
  t.is(err.message, 'Expected a string, got number')

  t.is(hanchangbinPages('w'), 'w@zce.me')
  t.is(hanchangbinPages('w', { host: 'wedn.net' }), 'w@wedn.net')
})
