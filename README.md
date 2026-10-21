# Lab: Finish a Claude Tool-Use Agent

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/Futreeng/claude-tool-use-lab)
[![Tests](https://github.com/Futreeng/claude-tool-use-lab/actions/workflows/test.yml/badge.svg)](https://github.com/Futreeng/claude-tool-use-lab/actions/workflows/test.yml)

(The red CI badge on this repo is expected: the starter fails on purpose.)

**Estimated time:** 45 to 60 minutes · **Level:** intermediate JavaScript, new to the Claude API · **Setup:** none. Runs offline in your browser via Codespaces, with no API key.

## The scenario

You are building a customer support agent. When a customer asks "Where is my order A100?", Claude cannot know the answer on its own. It needs to call your code. That is what **tool use** is: you describe tools to Claude, Claude decides when to call one, and your code runs it and reports back.

The starter sends one request and stops. Claude's request for a tool is never answered, so the agent can't finish a real conversation. Your job is to write the loop that makes it work.

## What you will practice

- The tool-use cycle: `stop_reason: "tool_use"` means Claude wants a tool run, not that it is done
- Replaying Claude's turn into the conversation, then answering with `tool_result` blocks matched by `tool_use_id`
- Handling parallel tool calls (several `tool_use` blocks in one response)
- Reporting tool failures to Claude with `is_error` so it can recover and explain
- Guarding an agent loop so a confused model can't run forever

## Start the lab

1. Click **Open in GitHub Codespaces** above and wait for the workspace to load.
2. In the terminal, run:

   ```bash
   npm test
   ```

3. You should see **7 failing tests and 4 passing tests**. That is the starting point.
4. Open `src/agent.js` and complete the loop until all 11 tests pass.

A scripted **mock client** (`src/mockClient.js`) stands in for the API, so tests are free, fast, and identical on every run.

## Your tasks

| # | Task | Tests |
|---|------|-------|
| 1 | Build the tool loop: run tools, replay the assistant turn, send `tool_result` back | `TASK 1`, `1b`, `1c` |
| 2 | Report failing and unknown tools with `is_error: true` instead of crashing | `TASK 2`, `2b`, `2c` |
| 3 | Stop with a "max turns" error if Claude never finishes | `TASK 3` |

`src/tools.js`, `src/mockClient.js`, and the four passing tests already work. Read `src/agent.test.js` before you start. It is the spec.

## Rules of the road

- **Do not edit `src/agent.test.js` to make tests pass.** Change the agent, not the spec.
- Keep the `runAgent` signature and the return shape `{ text, messages, turns }`.
- Only `src/agent.js` needs to change.

## Check your progress

```bash
npm run progress
```

prints a checklist of the three tasks. Stuck? Open [`HINTS.md`](HINTS.md). Each task has three levels, from a nudge to the concept.

## Try it by hand

```bash
npm run demo
```

runs your agent against a scripted conversation. To call the real Claude API instead, set `ANTHROPIC_API_KEY` and run with `LAB_MODE=live`. Keep your key out of the repo (`.env` is already git-ignored).

## Stretch goals (optional)

- **Real conversation.** Run live mode and ask about order B200, then ask Claude to cancel it. Watch the tool calls in `result.messages`.
- **Input validation.** Reject a `lookup_order` call whose `order_id` is not a string, and return a clear `is_error` result.
- **Token budget.** Stop the loop if total tool output grows past a limit you choose, and explain why that matters in production.

## Definition of done

- `npm test` reports 11 passing tests and 0 failing.
- You changed only `src/agent.js` (plus new tests, if you did a stretch goal).
- You can explain, in one sentence each, why the assistant turn is replayed and why `tool_use_id` must match.

---

*Created by FutureEng LLC. Instructor notes are in [`docs/INSTRUCTOR_GUIDE.md`](docs/INSTRUCTOR_GUIDE.md).*
