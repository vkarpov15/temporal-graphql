'use strict';

const assert = require('assert');
const parseFile = require('../');

describe('parseFile', function() {
  it('generates correct GraphQL schema for hello world', function() {
    const res = parseFile(`${__dirname}/data/hello.ts`);
    assert.deepEqual(res, ['example(name: String): String']);
  });

  it.skip('handles signals and queries', function() {
    const res = parseFile(`${__dirname}/data/signals-queries.ts`);
    assert.deepEqual(res, ['example(name: String): String']);
  });
});