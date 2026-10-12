// Prints a checklist of the lab tasks so learners can see progress at a glance.
// Run with: npm run progress
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';

const RESULTS = '.lab-results.json';

const TASKS = [
  { name: 'Task 1', goal: 'Tool loop: run tools and send tool_result back', match: /TASK 1/ },
  { name: 'Task 2', goal: 'Errors: failing and unknown tools return is_error', match: /TASK 2/ },
  { name: 'Task 3', goal: 'Safety: stop after max turns', match: /TASK 3/ }
];

// Vitest exits non-zero while tests fail, which is expected here, so we ignore the exit code
// and read the results file it writes.
spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--reporter=json', `--outputFile=${RESULTS}`], {
  stdio: 'ignore'
});

if (!existsSync(RESULTS)) {
  console.error('Could not read test results. Run "npm install" first, then try again.');
  process.exit(1);
}

const { testResults } = JSON.parse(readFileSync(RESULTS, 'utf8'));
rmSync(RESULTS, { force: true });

const tests = testResults.flatMap((file) => file.assertionResults);

console.log('\nClaude Tool Use Lab: progress\n');

let allDone = true;
for (const task of TASKS) {
  const matching = tests.filter((t) => task.match.test(t.title));
  const passed = matching.filter((t) => t.status === 'passed').length;
  const done = matching.length > 0 && passed === matching.length;
  allDone &&= done;
  console.log(`  ${done ? '[x]' : '[ ]'} ${task.name}: ${task.goal} (${passed}/${matching.length} checks)`);
}

console.log(allDone ? '\nAll three tasks complete. Nice work.\n' : '\nKeep going. Open HINTS.md if you are stuck.\n');
