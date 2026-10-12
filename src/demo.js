// Try your agent by hand:   npm run demo
// Offline by default (mock client). To call the real API instead:
//   set ANTHROPIC_API_KEY, then run with LAB_MODE=live
import { runAgent } from './agent.js';
import { createMockClient, textResponse, toolUseResponse } from './mockClient.js';

async function getClient() {
  if (process.env.LAB_MODE === 'live' && process.env.ANTHROPIC_API_KEY) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    return new Anthropic();
  }
  return createMockClient([
    toolUseResponse([{ id: 'toolu_demo', name: 'lookup_order', input: { order_id: 'A100' } }]),
    textResponse('Your order A100 shipped with UPS and should arrive on 2026-10-15.')
  ]);
}

const result = await runAgent({
  client: await getClient(),
  userMessage: 'Where is my order A100?'
});

console.log(result.text);
console.log(`(${result.turns} model call${result.turns === 1 ? '' : 's'})`);
