/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TestTube, Play, CheckCircle2, XCircle, Clock, RefreshCw, X, Download, ShieldCheck } from 'lucide-react';
import { TestResultItem } from '../types/agentguard';
import { runSecurityTestSuite } from '../services/api';

interface AutomatedTestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutomatedTestSuiteModal: React.FC<AutomatedTestSuiteModalProps> = ({ isOpen, onClose }) => {
  const [running, setRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResultItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'UNIT' | 'INTEGRATION' | 'RED_TEAM'>('ALL');
  const [summary, setSummary] = useState<{ total: number; passed: number; failed: number; successRate: number } | null>(null);

  React.useEffect(() => {
    if (isOpen && testResults.length === 0 && !running) {
      handleRunTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunTests = async () => {
    setRunning(true);
    try {
      const res = await runSecurityTestSuite();
      setTestResults(res.tests);
      setSummary(res.summary);
    } catch {
      // handled
    } finally {
      setRunning(false);
    }
  };

  const filteredTests = testResults.filter(t => activeCategory === 'ALL' || t.category === activeCategory);

  const exportResults = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ summary, tests: testResults }, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `agentguard_test_report_${Date.now()}.json`);
    dlAnchorElem.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="testsuite-title"
    >
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <TestTube className="w-5 h-5" />
            </div>
            <div>
              <h2 id="testsuite-title" className="text-lg font-bold text-white m-0">
                AgentGuard Automated Test Suite
              </h2>
              <p className="text-xs text-slate-400 m-0">
                Unit, Integration, and Red-Team Adversarial Penetration Verification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunTests}
              disabled={running}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{running ? 'RUNNING TESTS...' : 'RUN ALL TESTS'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close test suite"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Summary Banner if executed */}
          {summary ? (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">TESTS</span>
                  <strong className="text-xl font-black text-white">{summary.total}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">PASSED</span>
                  <strong className="text-xl font-black text-emerald-400">{summary.passed}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">FAILED</span>
                  <strong className="text-xl font-black text-rose-400">{summary.failed}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">PASS RATE</span>
                  <strong className="text-xl font-black text-indigo-400">{summary.successRate}%</strong>
                </div>
              </div>

              <button
                onClick={exportResults}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report (JSON)</span>
              </button>
            </div>
          ) : (
            <div className="p-6 text-center rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-indigo-400" />
              <p className="text-xs m-0">Click "RUN ALL TESTS" to execute the automated verification suite.</p>
            </div>
          )}

          {/* Category Tabs */}
          {testResults.length > 0 && (
            <div className="flex gap-2 border-b border-slate-800 pb-2">
              {(['ALL', 'UNIT', 'INTEGRATION', 'RED_TEAM'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}

          {/* Test Items List */}
          <div className="space-y-2">
            {filteredTests.map(test => {
              const isPassed = test.status === 'PASSED';
              return (
                <div
                  key={test.id}
                  className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-bold text-white">{test.title}</strong>
                          <span className="text-[10px] font-mono px-1.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                            {test.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          {test.description}
                        </p>
                        {test.error && (
                          <div className="mt-2 p-2 rounded bg-rose-950/60 border border-rose-500/30 text-[11px] font-mono text-rose-300">
                            Error: {test.error}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {test.durationMs}ms
                      </span>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                          isPassed ? 'bg-emerald-950/80 text-emerald-400' : 'bg-rose-950/80 text-rose-400'
                        }`}
                      >
                        {test.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition cursor-pointer"
          >
            Close Suite
          </button>
        </div>
      </div>
    </div>
  );
};
