import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from './server.mjs';
test('local server serves assets but refuses writes, source and traversal', async () => {
  const server = createServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    const good = await fetch(base + '/biziva/index.html');
    assert.equal(good.status, 200);
    assert.ok(good.headers.get('content-security-policy').includes("connect-src 'none'"));
    assert.equal(good.headers.get('cache-control'), 'no-store');
    for (const p of ['/biziva/server.mjs', '/biziva/../../package.json', '/biziva/%2e%2e%2fpackage.json', '/.env'])
      assert.equal((await fetch(base + p)).status, 404);
    assert.equal((await fetch(base + '/biziva/app.mjs', { method: 'POST' })).status, 405);
  } finally {
    await new Promise((r) => server.close(r));
  }
});
import { campaign } from './logic.mjs';
test('campaign preserves query/hash and safely encodes WhatsApp text', () => {
  const r = campaign({
    url: 'https://example.invalid/a?x=1#faq',
    source: 'instagram',
    medium: 'social',
    campaign: 'ação 1',
    phone: '(11) 98765-4321',
    message: 'Olá & tudo bem?',
  });
  assert.equal(new URL(r.landing).searchParams.get('x'), '1');
  assert.equal(new URL(r.landing).hash, '#faq');
  assert.equal(new URL(r.whatsapp).searchParams.get('text'), 'Olá & tudo bem?');
  assert.equal(r.phone, '5511987654321');
});
test('rejects script destinations, credential URLs, missing labels and invalid phones', () => {
  const base = {
    url: 'https://example.invalid',
    source: 'a',
    medium: 'b',
    campaign: 'c',
    phone: '11987654321',
    message: 'Olá',
  };
  for (const patch of [
    { url: 'javascript:alert(1)' },
    { url: 'https://user:password@example.invalid' },
    { source: ' ' },
    { phone: '000' },
    { message: 'a'.repeat(2001) },
  ])
    assert.throws(() => campaign({ ...base, ...patch }));
});
