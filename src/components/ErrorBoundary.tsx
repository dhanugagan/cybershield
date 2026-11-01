/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AgentGuard Error Boundary caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 text-center bg-slate-950 text-slate-200">
          <div className="max-w-md p-6 rounded-2xl bg-rose-950/30 border border-rose-500/40">
            <AlertTriangle className="w-10 h-10 mx-auto text-rose-400 mb-3" />
            <h2 className="text-lg font-bold text-white mb-2">Security Interface Error</h2>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              AgentGuard caught an unexpected interface state. The security evaluation engine remains safe and operational.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Interface</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
