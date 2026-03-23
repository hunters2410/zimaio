import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MessageCircle, ShieldCheck, CheckCircle2, DollarSign, Zap } from 'lucide-react';
import { useSiteSettings } from '../contexts/SiteSettingsContext';

export function Footer() {
  const { settings } = useSiteSettings();

  return (
    <footer className="bg-white dark:bg-slate-950 text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-slate-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div>
            <Link to="/" className="inline-block mb-4">
              <img
                src={settings.site_logo}
                alt={settings.site_name}
                className="h-10"
                onError={(e) => {
                  e.currentTarget.src = '/zimaio_mineral_edition,_no_background_v1.2.png';
                }}
              />
            </Link>
            <p className="text-sm mb-4">
              {settings.site_tagline || 'Your trusted multi-vendor marketplace for quality products from verified sellers.'}
            </p>

            {/* Social Media Icons */}
            <div className="flex space-x-4 mb-8">
              {settings.social_facebook && (
                <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer"
                  title="Facebook" className="hover:text-[#1877F2] transition-colors duration-200">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings.social_twitter && (
                <a href={settings.social_twitter} target="_blank" rel="noopener noreferrer"
                  title="Twitter / X" className="hover:text-[#1DA1F2] transition-colors duration-200">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {settings.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer"
                  title="Instagram" className="hover:text-[#E1306C] transition-colors duration-200">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {settings.social_whatsapp && (
                <a href={settings.social_whatsapp} target="_blank" rel="noopener noreferrer"
                  title="WhatsApp" className="hover:text-[#25D366] transition-colors duration-200">
                  <MessageCircle className="h-5 w-5" />
                </a>
              )}
            </div>

            <div className="mt-8">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-3 text-sm">Get Our App</h3>
              <div className="flex flex-col gap-3">
                <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" className="inline-block transition-transform hover:-translate-y-1">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" className="h-10 w-auto" />
                </a>
                <a href="https://play.google.com/store/apps" target="_blank" rel="noopener noreferrer" className="inline-block transition-transform hover:-translate-y-1">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" className="h-10 w-auto" />
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-blue-400 transition">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-blue-400 transition">Contact Us</Link></li>
              <li><Link to="/faq" className="hover:text-blue-400 transition">FAQ</Link></li>
              <li><Link to="/vendor-signup" className="hover:text-green-400 transition">Become a Seller</Link></li>
              {/* <li><Link to="/logistic-signup" className="hover:text-green-400 transition">Join Our Logistics</Link></li> */}
            </ul>
          </div>

          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/support" className="hover:text-blue-400 transition">Help Center</Link></li>
              <li><Link to="/shipping" className="hover:text-blue-400 transition">Shipping Info</Link></li>
              <li><Link to="/returns" className="hover:text-blue-400 transition">Returns</Link></li>
              <li><Link to="/track-order" className="hover:text-blue-400 transition">Track Order</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">For Customers</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contract/customer_terms" className="hover:text-blue-400 transition font-medium">
                  Customer Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/contract/customer_privacy" className="hover:text-blue-400 transition font-medium">
                  Customer Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">For Vendors</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contract/vendor_terms" className="hover:text-blue-400 transition font-medium">
                  Vendor Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/contract/vendor_privacy" className="hover:text-blue-400 transition font-medium">
                  Vendor Privacy Policy
                </Link>
              </li>
            </ul>
            <div className="mt-4">
              <h4 className="text-gray-900 dark:text-white font-semibold mb-2 text-sm">Contact</h4>
              <ul className="space-y-2 text-xs">
                {settings.contact_phone && (
                  <li className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>{settings.contact_phone}</span>
                  </li>
                )}
                {settings.support_email && (
                  <li className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <span>{settings.support_email}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Trust Bar */}
        <div className="border-t border-gray-100 dark:border-slate-800 mt-12 pt-8 pb-8">
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              <span>Secure Payments</span>
            </div>
            <span className="hidden md:block text-gray-300 dark:text-gray-700">|</span>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Verified Vendors</span>
            </div>
            <span className="hidden md:block text-gray-300 dark:text-gray-700">|</span>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <span>Transparent Pricing</span>
            </div>
            <span className="hidden md:block text-gray-300 dark:text-gray-700">|</span>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Fast Support</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-slate-800 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} {settings.site_name}. All rights reserved.</p>
          {settings.custom_footer_text && <p className="mt-2 text-xs text-gray-500">{settings.custom_footer_text}</p>}
        </div>
      </div>
    </footer>
  );
}
