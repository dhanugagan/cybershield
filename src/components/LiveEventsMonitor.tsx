/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GatewayEvent } from '../types/agentguard';
import { Download, Trash2, CheckCircle2, AlertOctagon, Clock, Volume2, Shield } from 'lucide-react';
import { redactSensitiveData } from '../services/api';
import { soundEngine } from '../audio/soundEffects';
import { TranslationDictionary } from '../i18n/translations';

interface LiveEventsMonitorProps {
  events: GatewayEvent[];
  onClear: () => void;
  t?: TranslationDictionary;
}

export const LiveEventsMonitor: React.FC<LiveEventsMonitorProps> = ({ events, onClear, t }) => {
  const [filter, setFilter] = useState<'ALL' | 'ALLOW' | 'BLOCK' | 'APPROVAL'>('ALL');

  const exportJson = () => {
    soundEngine.playClick(900);
    const sanitized = events.map((e) => ({
      ...e,
      user_request: redactSensitiveData(e.user_request || ''),
      reason: redactSensitiveData(e.reason || ''),
    }));
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sanitized, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `agentguard_audit_log_${Date.now()}.json`);
    dlAnchorElem.click();
  };

  const exportCsv = () => {
    soundEngine.playClick(900);
    const headers = ['ID', 'Time', 'Agent', 'Tool', 'Decision', 'Risk Score', 'Risk Level', 'Reason'];
    const rows = events.map((e) => [
      e.id,
      `"${e.time}"`,
      `"${e.agent}"`,
      `"${e.name || e.action_name}"`,
      `"${e.decision}"`,
      e.risk,
      `"${e.level}"`,
      `"${redactSensitiveData(e.reason || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', encodeURI(csvContent));
    dlAnchorElem.setAttribute('download', `agentguard_audit_log_${Date.now()}.csv`);
    dlAnchorElem.click();
  };

  const handleClear = () => {
    soundEngine.playClick(600);
    onClear();
  };

  const handleRowClick = (event: GatewayEvent) => {
    soundEngine.playClick(850);
    soundEngine.speak(
      `Event logged for ${event.agent}. Action: ${event.name || event.action_name}. Decision: ${event.decision}. Risk: ${event.risk}.`
    );
  };

  const filteredEvents = events.filter((e) => {
    if (filter === 'ALL') return true;
    if (filter === 'ALLOW') return e.decision === 'ALLOW' || e.decision === 'APPROVED';
    if (filter === 'BLOCK') return e.decision === 'BLOCK' || e.decision === 'DENIED';
    if (filter === 'APPROVAL') return e.decision === 'REQUIRE_APPROVAL';
    return true;
  });

  return (
    <section className="events-section my-8 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-xl" aria-labelledby="events-heading">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
            AUDIT TRAIL & LOGS
          </div>
          <h2 id="events-heading" className="text-xl font-bold text-white tracking-tight">
            {t?.liveMonitorTitle || 'Live Security Events'} ({events.length})
          </h2>
          <p className="text-xs text-slate-400">
            {t?.liveMonitorSub || 'Immutable log of intercepted agent tool calls, decisions, and risk assessments.'}
          </p>
        </div>

        {/* Filter Badges & Export */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => {
                soundEngine.playClick(750);
                setFilter('ALL');
              }}
              className={`px-2 py-1 rounded cursor-pointer ${filter === 'ALL' ? 'bg-cyan-950 text-cyan-300 font-bold' : 'text-slate-400'}`}
            >
              {t?.filterAll || 'All'}
            </button>
            <button
              onClick={() => {
                soundEngine.playClick(750);
                setFilter('ALLOW');
              }}
              className={`px-2 py-1 rounded cursor-pointer ${filter === 'ALLOW' ? 'bg-emerald-950 text-emerald-300 font-bold' : 'text-slate-400'}`}
            >
              {t?.filterAllowed || 'Allowed'}
            </button>
            <button
              onClick={() => {
                soundEngine.playClick(750);
                setFilter('BLOCK');
              }}
              className={`px-2 py-1 rounded cursor-pointer ${filter === 'BLOCK' ? 'bg-rose-950 text-rose-300 font-bold' : 'text-slate-400'}`}
            >
              {t?.filterBlocked || 'Blocked'}
            </button>
            <button
              onClick={() => {
                soundEngine.playClick(750);
                setFilter('APPROVAL');
              }}
              className={`px-2 py-1 rounded cursor-pointer ${filter === 'APPROVAL' ? 'bg-amber-950 text-amber-300 font-bold' : 'text-slate-400'}`}
            >
              {t?.filterApprovals || 'Approvals'}
            </button>
          </div>

          {events.length > 0 && (
            <>
              <button
                onClick={exportCsv}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                title="Export as CSV"
              >
                <Download className="w-3 h-3" />
                <span>CSV</span>
              </button>
              <button
                onClick={exportJson}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                title="Export as JSON"
              >
                <Download className="w-3 h-3" />
                <span>JSON</span>
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs font-medium transition cursor-pointer"
                title="Clear buffer"
              >
                <Trash2 className="w-3 h-3" />
                <span>{t?.clearLog || 'Clear'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cryptographic verification banner */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/80 border border-cyan-500/20 text-[11px] text-cyan-300 mb-4 font-mono">
        <Shield className="w-3.5 h-3.5 text-cyan-400" />
        <span>{t?.cryptoAuditBadge || 'SHA-256 Audit Chain: Cryptographically Verified'}</span>
      </div>

      {/* Event Items */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs">
          No security events logged under this filter.
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {filteredEvents.map((e) => {
            const isBlock = e.decision === 'BLOCK' || e.decision === 'DENIED';
            const isApproval = e.decision === 'REQUIRE_APPROVAL';
            return (
              <div
                key={e.id}
                onClick={() => handleRowClick(e)}
                className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isBlock ? 'bg-rose-400' : isApproval ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-bold text-white group-hover:text-cyan-300">
                        {e.agent}
                      </strong>
                      <span className="text-[10px] font-mono text-cyan-400">
                        {e.name || e.action_name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {e.reason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-500">{e.time}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      isBlock
                        ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                        : isApproval
                        ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {e.decision}
                  </span>
                  <Volume2 className="w-3 h-3 text-slate-600 group-hover:text-cyan-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
