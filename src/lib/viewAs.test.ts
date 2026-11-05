import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedInViewMode } from './viewAs';

test('admin viewing a user can load Facebook campaigns', () => {
  assert.equal(isAllowedInViewMode('meta-ads', { action: 'get-campaigns' }), true);
});
test('admin viewing a user cannot pause campaigns', () => {
  assert.equal(isAllowedInViewMode('meta-ads', { action: 'pause-campaign' }), false);
});
test('admin viewing a user cannot reconnect Facebook or run rules', () => {
  assert.equal(isAllowedInViewMode('meta-auth', { action: 'get-auth-url' }), false);
  assert.equal(isAllowedInViewMode('execute-rules', {}), false);
});
