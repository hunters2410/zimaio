export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl shadow-slate-900/5 p-8 md:p-12 border-2 border-slate-50 dark:border-slate-700">
          <div className="mb-10">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Privacy Policy</h1>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-2 px-1">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs">01</span>
                Information We Collect
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                We collect information that you provide directly to us, including when you create an account,
                make a purchase, or communicate with us. This may include your name, email address, phone number,
                shipping address, and payment information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs">02</span>
                How We Use Your Information
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium mb-4">
                We use the information we collect to:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-2">
                {[
                  'Process and fulfill your orders',
                  'Communicate regarding account status',
                  'Provide specialized customer support',
                  'Distribution of marketing materials',
                  'Platform performance optimization',
                  'Fraud detection and prevention'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs">03</span>
                Information Sharing
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                We share your information with vendors when you make a purchase, with service providers who help
                us operate our platform, and when required by law. We do not sell your personal information to
                third parties.
              </p>
            </section>

            <section className="pt-10 border-t-2 border-slate-50 dark:border-slate-700">
              <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">Contact Protocol</h2>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-loose">
                  If you have any questions about this Privacy Policy, please contact us at <span className="text-cyan-600 dark:text-cyan-400">privacy@zimaio.com</span>
                  or through our official support channels.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
