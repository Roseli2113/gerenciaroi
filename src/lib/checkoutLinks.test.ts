import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const WEBHOOK = new URL('../../supabase/functions/payment-webhook/index.ts', import.meta.url).pathname;
const SUBSCRIPTION = new URL('../pages/Subscription.tsx', import.meta.url).pathname;
const LANDING = new URL('../pages/Landing.tsx', import.meta.url).pathname;

function offerCodes(source: string): string[] {
  return [...source.matchAll(/offer=(offer-[0-9]+)/g)].map((m) => m[1]);
}

function mappedPlans(source: string): Record<string, string> {
  const block = source.match(/const offerToPlan: Record<string, string> = \{([\s\S]*?)\n\}/);
  assert.ok(block, 'offerToPlan map not found in payment-webhook');
  const map: Record<string, string> = {};
  for (const m of block![1].matchAll(/'(offer-[0-9]+)':\s*'([a-z]+)'/g)) map[m[1]] = m[2];
  return map;
}

const plans = mappedPlans(readFileSync(WEBHOOK, 'utf8'));

describe('Checkout links', () => {
  it('every plan link offer code is recognised by the payment webhook', () => {
    for (const file of [SUBSCRIPTION, LANDING]) {
      const codes = offerCodes(readFileSync(file, 'utf8'));
      assert.ok(codes.length > 0, `no checkout offer codes found in ${file}`);
      for (const code of codes) {
        assert.ok(plans[code], `offer ${code} is not mapped to a plan in payment-webhook`);
      }
    }
  });

  it('the Premium link grants the premium plan', () => {
    const premium = readFileSync(SUBSCRIPTION, 'utf8').match(
      /id: 'premium',[\s\S]*?checkoutUrl: '([^']+)'/,
    );
    assert.ok(premium, 'premium checkoutUrl not found in Subscription page');
    const code = offerCodes(premium![1])[0];
    assert.equal(code, 'offer-1793904016936');
    assert.equal(plans[code], 'premium');
  });

  it('the three paid plans point at three different offers', () => {
    const codes = offerCodes(readFileSync(SUBSCRIPTION, 'utf8'));
    assert.equal(new Set(codes).size, codes.length);
    assert.ok(new Set(Object.values(plans)).size > 2);
  });
});
