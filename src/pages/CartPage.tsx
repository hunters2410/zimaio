import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag, Store, ShieldCheck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useSettings } from '../contexts/SettingsContext';

export function CartPage() {
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const { formatPrice } = useCurrency();
  const { settings, calculatePrice } = useSettings();

  const subtotal = cartItems.reduce((sum, item) => sum + (item.base_price * item.quantity), 0);
  const { totalCommission, totalTax, totalWithTax } = cartItems.reduce((acc, item) => {
    const prices = calculatePrice(item.base_price);
    return {
      totalCommission: acc.totalCommission + (prices.commission * item.quantity),
      totalTax: acc.totalTax + (prices.vat * item.quantity),
      totalWithTax: acc.totalWithTax + (prices.total * item.quantity)
    };
  }, { totalCommission: 0, totalTax: 0, totalWithTax: 0 });

  const shipping = 0; // Shipping is calculated at checkout
  const total = totalWithTax + shipping;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-900/5">
            <ShoppingCart className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">Your cart is empty</h2>
          <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-xs mb-10 max-w-xs mx-auto">
            Looks like you haven't added any premium pieces to your collection yet.
          </p>
          <Link
            to="/products"
            className="inline-block px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Shopping Cart</h1>
          <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
            <ShoppingBag className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {cartItems.length} Premium items in your secure cart
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="bg-gray-50 dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-6 hover:shadow-xl hover:shadow-emerald-900/5 dark:shadow-slate-950/20 transition-all duration-300 group">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-32 h-32 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{item.name}</h3>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-3">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Store className="w-3 h-3" /> {item.vendor}
                      </p>
                      {item.options?.color && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-100 dark:border-slate-600">
                          <div className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ backgroundColor: item.options.color }} />
                          <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{item.options.color}</span>
                        </div>
                      )}
                      {item.options?.shipping && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-orange-100 dark:border-orange-900/30">
                          {item.options.shipping}
                        </div>
                      )}
                    </div>
                    <p className="text-xl font-black text-emerald-600">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center bg-gray-50 dark:bg-slate-700 rounded-xl p-1 border border-gray-100 dark:border-slate-600">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.options)}
                        className="p-2 hover:bg-white dark:hover:bg-slate-600 hover:text-emerald-600 rounded-lg transition-all active:scale-90"
                      >
                        <Minus className="h-4 w-4 text-gray-400 dark:text-gray-300" />
                      </button>
                      <span className="w-10 text-center font-black text-gray-900 dark:text-white text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.options)}
                        className="p-2 hover:bg-white dark:hover:bg-slate-600 hover:text-emerald-600 rounded-lg transition-all active:scale-90"
                      >
                        <Plus className="h-4 w-4 text-gray-400 dark:text-gray-300" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id, item.options)}
                      className="flex items-center gap-1.5 text-red-400 hover:text-red-600 text-[10px] font-black uppercase tracking-widest transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> Remove Item
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 p-8 shadow-sm dark:shadow-slate-950/20 sticky top-24">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Secure Checkout</h3>

              <div className="space-y-4 mb-10">
                <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  <span>Subtotal (Base)</span>
                  <span className="text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
                </div>
                {settings?.commission_enabled && (
                  <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    <span>Handling Fee</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(totalCommission)}</span>
                  </div>
                )}
                {settings?.is_enabled && (
                  <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    <span>VAT ({settings.default_rate}%)</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(totalTax)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  <span>Shipping Fee</span>
                  <span className="text-gray-400 dark:text-gray-500 italic text-[10px]">Calculated at checkout</span>
                </div>
                <div className="border-t border-gray-100 dark:border-slate-700 pt-6 flex justify-between items-end">
                  <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Grand Total</span>
                  <span className="text-3xl font-black text-emerald-600 leading-none">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  to="/checkout"
                  className="block w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs text-center hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95 mb-4"
                >
                  Complete Purchase
                </Link>
                <Link
                  to="/products"
                  className="block w-full py-5 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-300 rounded-2xl font-black uppercase tracking-widest text-xs text-center hover:bg-gray-100 dark:hover:bg-slate-600 transition-all active:scale-95"
                >
                  Continue Browsing
                </Link>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-50 dark:border-slate-700">
                <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                  <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">
                    PCI Compliant Secure Checkout System Activated
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
