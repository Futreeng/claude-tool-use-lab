# Hints

Each task has three levels. Try a level, rerun `npm test`, and only move to the next level if you are still stuck. Level 3 names the concept, not the code.

## Task 1: The tool loop

**Level 1.** Look at `response.stop_reason`. What does `"tool_use"` tell you about whether Claude is finished?

**Level 2.** Each time Claude asks for tools, the conversation needs two new messages: Claude's own turn (as the assistant), then your answer (as the user). Then you ask Claude again. What construct repeats until Claude is done?

**Level 3.** Push `response.content` as an assistant message, run every block whose `type` is `"tool_use"`, and push one user message whose content is a list of `tool_result` blocks. Each result's `tool_use_id` must equal the `id` of the block it answers. Tool output goes in `content` as a string, so `JSON.stringify` an object result. Several tool calls in one response still get one user message.

## Task 2: Errors

**Level 1.** What happens to your agent today if `executeTool` throws? What would Claude need to know to recover?

**Level 2.** A tool failure is information for Claude, not a reason to crash. Catch the error per tool call so one failure does not hide the other results.

**Level 3.** In the catch, return a `tool_result` with `is_error: true` and the error message as `content`. On success, leave `is_error` unset.

## Task 3: Safety

**Level 1.** What stops your loop if Claude keeps asking for tools forever? Think about cost and time in production.

**Level 2.** Count model calls. The `turns` value you return should equal the number of requests you made.

**Level 3.** Bound the loop with `maxTurns`. When you run out of turns while Claude still wants tools, throw an `Error` whose message contains "max turns". Do not make a request beyond the limit.

## Still stuck?

- Read the failing assertion. It shows what your agent sent, and the test names tell you which task it belongs to.
- Run one test at a time: `npx vitest run -t "TASK 1b"`.
- Print `result.messages` (or `client.calls`) and read the conversation as Claude would see it.
- Explain the test to a teammate in your own words. It often reveals the missing step.
