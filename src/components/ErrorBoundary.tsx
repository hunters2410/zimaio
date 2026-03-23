import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-950 flex items-center justify-center p-6 font-roboto">
                    <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                        {/* Logo Header */}
                        <div className="flex items-center justify-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-green-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-cyan-500/20">
                                Z
                            </div>
                            <div>
                                <h1 className="font-black text-slate-900 dark:text-white text-xl leading-none tracking-tighter">ZimAIO</h1>
                                <span className="text-[10px] text-cyan-600 font-bold uppercase tracking-widest">System Recovery</span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-10 md:p-12 text-center space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-green-500" />

                            <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
                                <AlertCircle size={44} strokeWidth={2.5} />
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">System Interruption</h2>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed max-w-[240px] mx-auto">
                                    A critical module failed to initialize. We are ready to help you recover.
                                </p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl text-left border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2 mb-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                    Error Signature
                                </div>
                                <code className="text-[10px] font-mono text-red-600 dark:text-red-400 block whitespace-pre-wrap break-all leading-tight">
                                    {this.state.error?.message || 'UNEXPECTED_RUNTIME_FAILURE'}
                                </code>
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={14} className="animate-spin-slow" />
                                    Refresh Session
                                </button>
                                <a
                                    href="/"
                                    className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <Home size={14} />
                                    Return Home
                                </a>
                            </div>
                        </div>

                        <p className="mt-8 text-center text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">
                            ZimAIO Infrastructure &bull; Secure Connection
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
