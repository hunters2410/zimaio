
export function LoadingFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
            <div className="flex flex-col items-center">
                <div className="relative mb-6">
                    <div className="absolute inset-x-[-20px] inset-y-[-20px] bg-emerald-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                    <img
                        src="/zimaio_mineral_edition,_no_background_v1.2.png"
                        alt="ZimAIO Logo"
                        className="w-32 h-auto relative z-10 animate-pulse"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                </div>
            </div>
        </div>
    );
}
