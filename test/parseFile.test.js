'use strict';

const assert = require('assert');
const parseFile = require('../');

describe('parseFile', function() {
  it('generates correct GraphQL schema for hello world', function() {
    const res = parseFile(`${__dirname}/data/hello.ts`);
    assert.deepEqual(res.mutations, ['example(name: String): String']);
  });

  it('handles signals and queries', function() {
    const res = parseFile(`${__dirname}/data/signals-queries.ts`);
    assert.deepEqual(res.mutations, ['unblockOrCancel(): ID', 'unblock(): ID', 'isBlocked(): Boolean']);
  });

  it('handles signals with args', function() {
    const res = parseFile(`${__dirname}/data/updatable-timer.ts`);
    assert.deepEqual(res.mutations, ['countdownWorkflow(): ID', 'setDeadline(arg0: Float): ID', 'timeLeft(): Float']);
  });
});