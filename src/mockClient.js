// A scripted stand-in for the Anthropic client, so the lab runs offline with no API key.
// It mimics `client.messages.create()` and returns the next scripted response each call.
// It also records a snapshot of every request in `client.calls`, so tests can check
// exactly what your agent sent back to the model.

export function textResponse(text) {
  return { role: 'assistant', stop_reason: 'end_turn', content: [{ type: 'text', text }] };
}

// `uses` is a list of { id, name, input }. Several entries model parallel tool calls.
export function toolUseResponse(uses) {
  return {
    role: 'assistant',
    stop_reason: 'tool_use',
    content: uses.map((u) => ({ type: 'tool_use', id: u.id, name: u.name, input: u.input }))
  };
}

// `script` is an array of responses, or a function (callNumber) => response.
export function createMockClient(script) {
  const calls = [];
  return {
    calls,
    messages: {
      async create(request) {
        calls.push(structuredClone(request));
        const next = typeof script === 'function' ? script(calls.length) : script[calls.length - 1];
        if (!next) throw new Error('Mock client ran out of scripted responses.');
        return structuredClone(next);
      }
    }
  };
}
