import { Mail, Phone, Send } from 'lucide-react';
import { useState } from 'react';

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="bg-gradient-to-r from-cyan-600 to-green-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-cyan-50">We'd love to hear from you</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-2xl mx-auto">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm text-center border border-gray-100 dark:border-slate-700">
            <div className="bg-cyan-100 dark:bg-cyan-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Email Us</h3>
            <p className="text-gray-600 dark:text-gray-400">support@zimaio.com</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm text-center border border-gray-100 dark:border-slate-700">
            <div className="bg-cyan-100 dark:bg-cyan-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Call Us</h3>
            <p className="text-gray-600 dark:text-gray-400">+263 123 456 789</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8 border border-gray-100 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send us a Message</h2>

          {submitted && (
            <div className="mb-6 p-4 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-lg">
              Thank you for contacting us! We'll get back to you soon.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-green-700 transition flex items-center justify-center"
            >
              <Send className="h-5 w-5 mr-2" />
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
