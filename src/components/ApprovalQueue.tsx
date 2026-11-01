/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserCheck, CheckCircle2, XCircle, Key, Clock, ShieldAlert } from 'lucide-react';
import { AttackResponse, redactSensitiveData } from '../services/api';

interface ApprovalQueueProps {
  pendingItems: AttackResponse[];
  onApprove: (item: AttackResponse) => void;
  onDeny: (item: AttackResponse) => void;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  pendingItems,
  onApprove,
  onDeny,
}) => {
  if (pendingItems.length === 0) return null;

  return (
    <section
      className="approval-queue my-8 p-6 rounded-2xl bg-amber-950/20 border-2 border-amber-500/40 backdrop-blur-md shadow-2xl"
      aria-labelledby="queue-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold">
              HUMAN-IN-THE-LOOP APPROVAL QUEUE
            </div>
            <h2 id="queue-heading" className="text-xl font-bold text-white m-0">
              Pending Authorization Queue ({pendingItems.length})
            </h2>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wider">
          REQUIRES HUMAN SIGN-OFF
        </span>
      </div>

      <div className="space-y-4 mt-6">
        {pendingItems.map((item, index) => {
          const { user_request, agent_action, security } = item;
          return (
            <div
              key={index}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                    TOOL: {agent_action.action}
                  </span>
                  {security.approval_token && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300">
                      Token: {security.approval_token}
                    </span>
                  )}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30">
                    Risk: {security.risk_score}/100 ({security.risk_level})
                  </span>
                </div>

                <p className="text-xs text-slate-300 m-0">
                  <strong className="text-slate-400">Intent: </strong>
                  "{user_request}"
                </p>

                <p className="text-[11px] font-mono text-slate-400 m-0 truncate">
                  <strong className="text-slate-500">Parameters: </strong>
                  {redactSensitiveData(JSON.stringify(agent_action.parameters))}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onDeny(item)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition cursor-pointer"
                  aria-label="Reject this pending action"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>

                <button
                  onClick={() => onApprove(item)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition cursor-pointer"
                  aria-label="Approve this pending action"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
