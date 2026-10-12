# Instructor Guide: Claude Tool Use Lab

For facilitators, reviewers, and anyone adapting the lab. Learners should not need it.

## Learning goals

By the end of the lab, a learner can:

1. **Explain the tool-use cycle** and why `stop_reason: "tool_use"` means "not finished yet".
2. **Build a correct agent loop** that replays the assistant turn and answers every `tool_use` block with a matching `tool_result`.
3. **Handle failure deliberately** by passing tool errors back to the model with `is_error` instead of crashing or hiding them.
4. **Bound an agent** with a turn limit and describe the cost and safety reasons for doing so.
5. **Test LLM code without the network** using a scripted client that records requests.

## How the lab is built

The lab uses a *finish the loop* format. Everything around the loop works (tools, schemas, the mock client), so the learner's attention goes to one idea: the conversation protocol between your code and Claude.

Design choices:

- **No API key, no cost, no flakiness.** A scripted mock client replays fixed responses. Tests are deterministic and free, so a class of 30 can run them at once. Live mode is a clearly labeled option for learners who want the real model.
- **The mock records requests.** Tests do not only check the final answer. They check the exact messages the agent sent, because the common bugs (missing assistant turn, wrong `tool_use_id`, one message per result instead of one for all) are protocol errors that a correct-looking final answer would hide.
- **Guard tests are part of the spec.** Four tests already pass, including tool-definition shape. They keep the learner from breaking the parts that work.
- **Tasks escalate.** Happy path, then parallel calls, then errors, then a safety limit. Each task adds one idea.
- **Progressive hints.** Three levels per task in `HINTS.md`, moving from a question, to the mechanism, to the concept.
- **Failing by design.** CI is red on the starter. The README says so.

## Expected timing

| Phase | Time |
|-------|------|
| Read README, run `npm test`, read the spec | 8 min |
| Task 1: the loop (including parallel calls) | 15 to 25 min |
| Task 2: errors | 8 min |
| Task 3: max turns | 5 min |
| Debrief | 10 min |
| Stretch (optional) | 15 min |

## Reference solution (summary)

Keep the reference implementation private. The approach:

- Loop from 1 to `maxTurns`. Each pass sends one request.
- If `stop_reason` is not `"tool_use"`, return the text and the turn count.
- Otherwise push `response.content` as an assistant message. Map each `tool_use` block to a `tool_result`, using `JSON.stringify` for successful output and `is_error: true` with the message when the tool throws. Push all results as one user message.
- After the loop, throw an error that mentions "max turns".

The reference passes all 11 tests. The starter fails 7 and passes 4.

## Common mistakes and how to coach them

| Symptom | Likely cause | Coaching question |
|---------|--------------|-------------------|
| Second request has no assistant message | Skipped replaying Claude's turn | "What would Claude see if it only got a tool result with no record of asking for it?" |
| `tool_use_id` mismatch | Used a counter or the tool name | "Which field ties a result to its request?" |
| Parallel calls fail | One user message per result | "How many user turns happened between Claude's messages?" |
| Agent crashes on unknown order | No try/catch | "What should Claude be told when a tool fails?" |
| One failure hides other results | try/catch around the whole batch | "Where should the catch sit so each call is independent?" |
| `is_error` set to `false` on success | Always set it | "Does the test care about absent versus false? What does the API expect?" |
| Loop makes one request too many | Checked the limit after the call | "Where does the turn count change relative to the request?" |
| Learner edits `agent.test.js` | Wants green fast | "The spec is the contract. What would the support team say if the protocol changed?" |

## Debrief questions

- Why does Claude need to see its own `tool_use` turn again?
- What could go wrong in production if the loop had no `maxTurns`?
- Where would you add logging, and what would you avoid logging?
- A tool takes 20 seconds. What changes in your design?

## Rubric

| Level | Criteria |
|-------|----------|
| **Complete** | All 11 tests pass. No test edited. Learner explains the replay and the `tool_use_id` match, and can say why `maxTurns` exists. |
| **Solid** | All tests pass. Learner needs a prompt to explain parallel calls or error handling. |
| **Partial** | Task 1 works, Tasks 2 or 3 incomplete. Understands the happy path, not failure modes. |
| **Not yet** | The loop does not run. Walk through one request and response pair on paper, then retry. |

## Extending the lab

- Add a third tool with a validation rule, plus a failing test for it.
- Add a streaming variant where tool-use blocks arrive in chunks.
- Add an evaluation exercise: score the agent's answers across a set of scripted scenarios.
- Swap the domain (travel changes, appointment booking) and keep the skills.

## Maintenance

- Confirm `npm test` and `npm run demo` in a fresh Codespace after any dependency change.
- If the model name in `src/agent.js` changes, live mode is the only thing affected. Tests use the mock.
- Keep the README, `HINTS.md`, test names, and `scripts/progress.mjs` in sync. The progress script matches on `TASK n` in test titles.
