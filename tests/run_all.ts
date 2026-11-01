/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AgentGuard — Master Verification & Test Suite Runner
 * Executes all 5 test dimensions:
 * 1. Problem Statement Alignment (tests/problem_statement.test.ts)
 * 2. Security Engineering & OWASP Defense (tests/security.test.ts)
 * 3. Efficiency & Latency SLA (tests/efficiency.test.ts)
 * 4. Accessibility WCAG 2.1 AA/AAA (tests/accessibility.test.ts)
 * 5. Code Quality & Type Safety (tests/code_quality.test.ts)
 */

import { runProblemStatementTests } from './problem_statement.test.ts';
import { runCodeQualityTests } from './code_quality.test.ts';
import { runSecurityTests } from './security.test.ts';
import { runEfficiencyTests } from './efficiency.test.ts';
import { runTestingValidationTests } from './testing_validation.test.ts';
import { runAccessibilityTests } from './accessibility.test.ts';

async function main() {
  console.log('========================================================================');
  console.log('   AGENTGUARD AUTOMATED COMPREHENSIVE VERIFICATION SUITE (ALL CRITERIA)  ');
  console.log('========================================================================\n');

  const startTotal = performance.now();

  const suites = [
    { name: '1. Problem Statement Alignment', run: runProblemStatementTests },
    { name: '2. Code Quality & Clean Architecture', run: runCodeQualityTests },
    { name: '3. Security & OWASP Top 10 Hardened', run: runSecurityTests },
    { name: '4. Efficiency & High-Throughput SLA', run: runEfficiencyTests },
    { name: '5. Testing & Validation Maintainability', run: runTestingValidationTests },
    { name: '6. Accessibility & WCAG 2.1 AA/AAA Compliance', run: runAccessibilityTests },
  ];

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  const suiteResults: Record<string, { total: number; passed: number; score: number }> = {};

  for (const s of suites) {
    console.log(`\n▶ Running Suite: ${s.name}`);
    console.log('------------------------------------------------------------------------');
    const results = await s.run();
    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    const score = Math.round((passed / results.length) * 100);

    totalTests += results.length;
    totalPassed += passed;
    totalFailed += failed;
    suiteResults[s.name] = { total: results.length, passed, score };

    results.forEach(r => {
      const badge = r.status === 'PASSED' ? '[PASS]' : '[FAIL]';
      console.log(`  ${badge} ${r.name} (${r.durationMs}ms)`);
      if (r.error) console.error(`         Error: ${r.error}`);
    });
    console.log(`  Result: ${passed}/${results.length} passed (${score}%)\n`);
  }

  const elapsedTotal = (performance.now() - startTotal).toFixed(2);

  console.log('========================================================================');
  console.log('                     OVERALL EVALUATION SCORECARD                       ');
  console.log('========================================================================');
  for (const [name, stats] of Object.entries(suiteResults)) {
    const bar = '█'.repeat(Math.round(stats.score / 5)) + '░'.repeat(20 - Math.round(stats.score / 5));
    console.log(`  ${name.padEnd(46)} ${bar} ${stats.score}% (${stats.passed}/${stats.total})`);
  }
  console.log('------------------------------------------------------------------------');
  console.log(`  TOTAL TESTS:   ${totalTests}`);
  console.log(`  TOTAL PASSED:  ${totalPassed}`);
  console.log(`  TOTAL FAILED:  ${totalFailed}`);
  console.log(`  SUCCESS RATE:  ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
  console.log(`  TOTAL RUNTIME: ${elapsedTotal}ms`);
  console.log('========================================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
