import { toolDefinitions, executeTool as defaultExecuteTool } from './tools.js';

export const MODEL = 'claude-sonnet-5-5';

/**
 * Runs a support agent: sends the user's message to Claude and, while Claude asks to use
 * tools, runs them and sends the results back until Claude gives a final answer.
 *
 * TASKS FOR LEARNER:
 * 1. Tool loop. When `response.stop_reason === 'tool_use'`, run every tool_use block,
 *    append the assistant's turn to `messages`, then append ONE user message holding a
 *    tool_result block per tool call (matched by `tool_use_id`). Call the model again.
 * 2. Errors. If a tool throws (or the tool is unknown), do not crash. Send a tool_result
 *    with `is_error: true` and the error message so Claude can recover.
 * 3. Safety. If the model is still asking for tools after `maxTurns` model calls,
 *    throw an Error whose message includes "max turns" instead of looping forever.
 *
 * Returns { text, messages, turns }.
 */
export async function runAgent({
  client,
  userMessage,
  tools = toolDefinitions,
  executeTool = defaultExecuteTool,
  maxTurns = 5,
  model = MODEL
}) {
  const messages = [{ role: 'user', content: userMessage }];

  const response = await client.messages.create({ model, max_tokens: 1024, tools, messages });

  // TODO: handle stop_reason === 'tool_use' (tasks 1 to 3).

  return { text: extractText(response), messages, turns: 1 };
}

// Joins the text blocks of a response. Tool-use blocks are ignored.
export function extractText(response) {
  return response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');
}
