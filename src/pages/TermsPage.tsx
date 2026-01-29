export function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl shadow-slate-900/5 p-8 md:p-12 border-2 border-slate-50 dark:border-slate-700">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Terms & Conditions</h1>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-2">Operational Protocol v2.4 • Updated {new Date().toLocaleDateString()}</p>
          </div>

          <div className="space-y-8">
            <section className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-3xl border-2 border-slate-100 dark:border-slate-800 transition-all hover:border-cyan-500/30 group">
              <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-cyan-500 rounded-full group-hover:scale-y-125 transition-transform"></div>
                1. Acceptance of Terms
              </h2>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-wide">
                By accessing and using ZimAIO, you accept and agree to be bound by the terms and provisions
                of this agreement. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-3xl border-2 border-slate-100 dark:border-slate-800 transition-all hover:border-emerald-500/30 group">
              <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full group-hover:scale-y-125 transition-transform"></div>
                2. User Accounts
              </h2>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-wide">
                To use certain features of the platform, you must register for an account. You are responsible
                for maintaining the confidentiality of your account credentials and for all activities that
                occur under your account.
              </p>
            </section>

            <section className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-3xl border-2 border-slate-100 dark:border-slate-800 transition-all hover:border-amber-500/30 group">
              <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-amber-500 rounded-full group-hover:scale-y-125 transition-transform"></div>
                3. Content Protocol
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Accurate resource description',
                  'Timely fulfillment metrics',
                  'Legal & regulatory compliance',
                  'Verified business licensure'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="pt-10 border-t-2 border-slate-50 dark:border-slate-700 text-center">
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">
                Legal Inquiries: <span className="text-cyan-600 dark:text-cyan-400">legal@zimaio.com</span>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
