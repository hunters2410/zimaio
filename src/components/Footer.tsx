import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone } from 'lucide-react';
import { useSiteSettings } from '../contexts/SiteSettingsContext';

export function Footer() {
  const { settings } = useSiteSettings();

  return (
    <footer className="bg-gray-900 text-gray-300">
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
            <div className="flex space-x-4">
              {settings.social_facebook && (
                <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings.social_twitter && (
                <a href={settings.social_twitter} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {settings.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-green-400 transition">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-green-400 transition">Contact Us</Link></li>
              <li><Link to="/faq" className="hover:text-green-400 transition">FAQ</Link></li>
              <li><Link to="/vendor-signup" className="hover:text-green-400 transition">Become a Seller</Link></li>
              <li><Link to="/logistic-signup" className="hover:text-green-400 transition">Join Our Logistics</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/support" className="hover:text-green-400 transition">Help Center</Link></li>
              <li><Link to="/shipping" className="hover:text-green-400 transition">Shipping Info</Link></li>
              <li><Link to="/returns" className="hover:text-green-400 transition">Returns</Link></li>
              <li><Link to="/track-order" className="hover:text-green-400 transition">Track Order</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">For Customers</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contract/customer_terms" className="hover:text-cyan-400 transition font-medium">
                  Customer Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/contract/customer_privacy" className="hover:text-cyan-400 transition font-medium">
                  Customer Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">For Vendors</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contract/vendor_terms" className="hover:text-cyan-400 transition font-medium">
                  Vendor Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/contract/vendor_privacy" className="hover:text-cyan-400 transition font-medium">
                  Vendor Privacy Policy
                </Link>
              </li>
            </ul>
            <div className="mt-4">
              <h4 className="text-white font-semibold mb-2 text-sm">Contact</h4>
              <ul className="space-y-2 text-xs">
                {settings.contact_phone && (
                  <li className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>{settings.contact_phone}</span>
                  </li>
                )}
                {settings.support_email && (
                  <li className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>{settings.support_email}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} {settings.site_name}. All rights reserved.</p>
          {settings.custom_footer_text && <p className="mt-2 text-xs text-gray-500">{settings.custom_footer_text}</p>}
        </div>
      </div>
    </footer>
  );
}
