import { describe, it, expect } from 'vitest';
import { runAgent, extractText } from './agent.js';
import { toolDefinitions } from './tools.js';
import { createMockClient, textResponse, toolUseResponse } from './mockClient.js';

const lookup = (id, order_id) => ({ id, name: 'lookup_order', input: { order_id } });

describe('Claude Tool Use Lab', () => {
  // ----- Already working: these must keep passing -------------------------

  it('returns the text when Claude answers without using a tool', async () => {
    const client = createMockClient([textResponse('Hello! How can I help?')]);
    const result = await runAgent({ client, userMessage: 'Hi' });
    expect(result.text).toBe('Hello! How can I help?');
    expect(result.turns).toBe(1);
  });

  it('sends the tool definitions with the request', async () => {
    const client = createMockClient([textResponse('ok')]);
    await runAgent({ client, userMessage: 'Hi' });
    expect(client.calls[0].tools).toEqual(toolDefinitions);
    expect(client.calls[0].messages[0]).toEqual({ role: 'user', content: 'Hi' });
  });

  it('defines every tool with a name, description, and object input schema', () => {
    for (const tool of toolDefinitions) {
      expect(tool.name).toMatch(/^[a-z_]+$/);
      expect(tool.description.length).toBeGreaterThan(20);
      expect(tool.input_schema.type).toBe('object');
      expect(tool.input_schema.required.length).toBeGreaterThan(0);
    }
  });

  it('extractText ignores tool_use blocks', () => {
    const text = extractText({
      content: [
        { type: 'text', text: 'Checking. ' },
        { type: 'tool_use', id: 'x', name: 'lookup_order', input: {} },
        { type: 'text', text: 'Done.' }
      ]
    });
    expect(text).toBe('Checking. Done.');
  });

  // ----- Task 1: the tool loop --------------------------------------------

  it('TASK 1: runs a requested tool and returns Claude\'s final answer', async () => {
    const client = createMockClient([
      toolUseResponse([lookup('toolu_1', 'A100')]),
      textResponse('Order A100 has shipped.')
    ]);
    const result = await runAgent({ client, userMessage: 'Where is A100?' });
    expect(result.text).toBe('Order A100 has shipped.');
    expect(result.turns).toBe(2);
  });

  it('TASK 1b: replays the assistant turn, then sends a tool_result with the matching tool_use_id', async () => {
    const client = createMockClient([
      toolUseResponse([lookup('toolu_1', 'A100')]),
      textResponse('Shipped.')
    ]);
    await runAgent({ client, userMessage: 'Where is A100?' });

    const secondRequest = client.calls[1].messages;
    expect(secondRequest).toHaveLength(3);
    expect(secondRequest[1].role).toBe('assistant');
    expect(secondRequest[1].content[0]).toMatchObject({ type: 'tool_use', id: 'toolu_1' });
    expect(secondRequest[2].role).toBe('user');
    expect(secondRequest[2].content[0]).toMatchObject({
      type: 'tool_result',
      tool_use_id: 'toolu_1'
    });
    expect(secondRequest[2].content[0].content).toContain('shipped');
  });

  it('TASK 1c: answers parallel tool calls in ONE user message, one tool_result each', async () => {
    const client = createMockClient([
      toolUseResponse([lookup('toolu_a', 'A100'), lookup('toolu_b', 'B200')]),
      textResponse('A100 shipped, B200 is processing.')
    ]);
    await runAgent({ client, userMessage: 'Check A100 and B200' });

    const results = client.calls[1].messages[2].content;
    expect(results.map((r) => r.tool_use_id)).toEqual(['toolu_a', 'toolu_b']);
    expect(results.every((r) => r.type === 'tool_result')).toBe(true);
  });

  // ----- Task 2: errors ---------------------------------------------------

  it('TASK 2: reports a failing tool with is_error instead of crashing', async () => {
    const client = createMockClient([
      toolUseResponse([lookup('toolu_1', 'ZZZ')]),
      textResponse('Sorry, I could not find that order.')
    ]);
    const result = await runAgent({ client, userMessage: 'Where is ZZZ?' });

    const toolResult = client.calls[1].messages[2].content[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('not found');
    expect(result.text).toBe('Sorry, I could not find that order.');
  });

  it('TASK 2b: reports an unknown tool with is_error', async () => {
    const client = createMockClient([
      toolUseResponse([{ id: 'toolu_1', name: 'delete_everything', input: {} }]),
      textResponse('I cannot do that.')
    ]);
    await runAgent({ client, userMessage: 'Do something odd' });

    const toolResult = client.calls[1].messages[2].content[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('Unknown tool');
  });

  it('TASK 2c: does not set is_error when a tool succeeds', async () => {
    const client = createMockClient([
      toolUseResponse([lookup('toolu_1', 'A100')]),
      textResponse('Shipped.')
    ]);
    await runAgent({ client, userMessage: 'Where is A100?' });
    expect(client.calls[1].messages[2].content[0].is_error).toBeFalsy();
  });

  // ----- Task 3: safety ---------------------------------------------------

  it('TASK 3: stops with a "max turns" error if Claude never finishes', async () => {
    const client = createMockClient(() => toolUseResponse([lookup('toolu_loop', 'A100')]));
    await expect(runAgent({ client, userMessage: 'Loop', maxTurns: 3 })).rejects.toThrow(/max turns/i);
    expect(client.calls).toHaveLength(3);
  });
});
