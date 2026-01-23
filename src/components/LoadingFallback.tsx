
import { Zap } from 'lucide-react';

export function LoadingFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center">
                <div className="relative mb-4">
                    <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-gray-100 relative z-10 animate-bounce">
                        <Zap className="w-8 h-8 text-emerald-600 fill-emerald-600" />
                    </div>
                </div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight animate-pulse">ZimAIO</h2>
                <div className="flex gap-1 mt-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                </div>
            </div>
        </div>
    );
}
