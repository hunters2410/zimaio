export function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900">Terms & Conditions</h1>
          <p className="text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing and using ZimAIO, you accept and agree to be bound by the terms and provisions
              of this agreement. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. User Accounts</h2>
            <p className="text-gray-600 mb-4">
              To use certain features of the platform, you must register for an account. You are responsible
              for maintaining the confidentiality of your account credentials and for all activities that
              occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Vendor Obligations</h2>
            <p className="text-gray-600 mb-4">
              Vendors agree to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Provide accurate product descriptions and pricing</li>
              <li>Fulfill orders in a timely manner</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Maintain appropriate business licenses and permits</li>
              <li>Not engage in fraudulent or misleading practices</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Customer Obligations</h2>
            <p className="text-gray-600 mb-4">
              Customers agree to provide accurate information for orders, make timely payments, and
              not engage in fraudulent activities or abuse of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Payments and Refunds</h2>
            <p className="text-gray-600 mb-4">
              All payments are processed securely through our payment providers. Refund policies are
              determined by individual vendors and must comply with applicable consumer protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-600 mb-4">
              The ZimAIO platform and its content are protected by copyright and other intellectual
              property rights. You may not use our content without permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-600 mb-4">
              ZimAIO acts as a marketplace platform connecting vendors and customers. We are not responsible
              for the quality, safety, or legality of products listed by vendors.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Information</h2>
            <p className="text-gray-600">
              For questions about these terms, please contact us at legal@zimaio.com or through our
              contact page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
