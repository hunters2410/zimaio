import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useSettings } from '../../contexts/SettingsContext';
import {
    Search,
    ShoppingCart,
    User,
    Trash2,
    Plus,
    Minus,
    CreditCard,
    Banknote,
    X,
    Printer,
    CheckCircle,
    Package,
    Maximize as Scan,
    Download
} from 'lucide-react';

interface Product {
    id: string;
    name: string;
    price: number;
    base_price: number;
    stock_quantity: number;
    image_url: string;
    sku: string;
}

interface CartItem extends Product {
    quantity: number;
}

interface VendorPOSProps {
    overrideVendorId?: string | null;
    onTabChange?: (tab: string) => void;
}

export function VendorPOS({ overrideVendorId, onTabChange }: VendorPOSProps) {
    const { profile } = useAuth();
    const { formatPrice } = useCurrency();
    const { calculatePrice } = useSettings();
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [checkoutModal, setCheckoutModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
    const [submitting, setSubmitting] = useState(false);
    const [orderComplete, setOrderComplete] = useState<any>(null);
    const [vendorId, setVendorId] = useState<string | null>(overrideVendorId || null);
    const [shopName, setShopName] = useState<string>('');

    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (overrideVendorId) {
            setVendorId(overrideVendorId);
        }
    }, [overrideVendorId]);

    useEffect(() => {
        fetchVendorAndProducts();
        // Shortcut for search
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [profile, vendorId]);

    const fetchVendorAndProducts = async () => {
        let currentVendorId = vendorId;

        if (!currentVendorId && profile?.id) {
            try {
                const { data: vendor } = await supabase
                    .from('vendor_profiles')
                    .select('id, shop_name')
                    .eq('user_id', profile.id)
                    .single();

                if (vendor) {
                    currentVendorId = vendor.id;
                    setVendorId(vendor.id);
                    setShopName(vendor.shop_name);
                }
            } catch (err) {
                console.error('Error fetching vendor ID:', err);
            }
        }

        if (currentVendorId) {
            try {
                // If we already have currentVendorId but not shopName (e.g. override), fetch it
                if (!shopName) {
                    const { data: v } = await supabase
                        .from('vendor_profiles')
                        .select('shop_name')
                        .eq('id', currentVendorId)
                        .single();
                    if (v) setShopName(v.shop_name);
                }

                // Fetch from products table with correct column names
                // base_price instead of price
                // images is an array, we'll take the first one as image_url
                const { data: prods, error } = await supabase
                    .from('products')
                    .select('id, name, base_price, stock_quantity, images, sku')
                    .eq('vendor_id', currentVendorId)
                    .eq('is_active', true)
                    .gt('stock_quantity', 0)
                    .order('name');

                if (error) throw error;

                // Map database fields to the component's Product interface
                const mappedProducts: Product[] = (prods || []).map(p => {
                    const priceInfo = calculatePrice(p.base_price);
                    return {
                        id: p.id,
                        name: p.name,
                        price: priceInfo.total,
                        base_price: p.base_price,
                        stock_quantity: p.stock_quantity,
                        image_url: p.images && p.images.length > 0 ? p.images[0] : '',
                        sku: p.sku
                    };
                });

                setProducts(mappedProducts);
            } catch (err: any) {
                console.error('Error fetching POS products:', err);
                alert('Terminal Error: Could not fetch products. ' + err.message);
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock_quantity) return prev;
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };



    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQty = Math.max(1, Math.min(item.quantity + delta, item.stock_quantity));
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCheckout = async () => {
        if (cart.length === 0 || !vendorId) return;
        setSubmitting(true);

        try {
            // Generate a simple order number
            const orderNumber = `ZIM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Calculate total base, comm, and vat for the whole order
            let orderBaseTotal = 0;
            let orderCommTotal = 0;
            let orderVatTotal = 0;

            const purchaseItems = cart.map(item => {
                const info = calculatePrice(item.base_price || item.price);
                orderBaseTotal += (item.base_price || item.price) * item.quantity;
                orderCommTotal += info.commission * item.quantity;
                orderVatTotal += info.vat * item.quantity;

                return {
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    base_price: item.base_price || item.price,
                    commission: info.commission,
                    vat: info.vat
                };
            });

            // Construct payload for RPC
            const orderPayload = {
                order_number: orderNumber,
                vendor_id: vendorId,
                customer_id: null,
                total: total,
                subtotal: orderBaseTotal,
                commission_amount: orderCommTotal,
                vat_amount: orderVatTotal,
                status: 'delivered',
                payment_status: 'paid',
                payment_method: paymentMethod,
                shipping_address: { type: 'POS', details: 'Walk-in Customer / POS Store' },
                items: purchaseItems
            };

            // Call the RPC 
            const { data: order, error } = await supabase.rpc('create_pos_order', {
                order_payload: orderPayload,
                items_payload: purchaseItems
            });

            if (error) throw error;
            if (!order) throw new Error('Failed to create order');

            setOrderComplete(order);
            setCart([]);
            setCheckoutModal(false);
            // Refresh products to show new stock
            fetchVendorAndProducts();
        } catch (err: any) {
            console.error('Checkout error:', err);
            alert('Checkout failed: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };



    const handleDownloadReceipt = async () => {
        if (!orderComplete) return;
        const receiptElement = document.getElementById('printable-receipt');
        if (!receiptElement) return;

        try {
            const canvas = await html2canvas(receiptElement, {
                scale: 3,
                backgroundColor: '#ffffff',
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [80, 230]
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Receipt-${orderComplete.order_number}.pdf`);
        } catch (error) {
            console.error('Error downloading receipt:', error);
            alert('Could not download receipt. Please try printing instead.');
        }
    };

    const [activeTab, setActiveTab] = useState('register');

    if (loading) return (
        <div className="flex items-center justify-center h-[600px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
            {/* Left Navigation Sidebar */}
            <div className="w-20 md:w-24 bg-slate-900 flex flex-col items-center py-6 gap-8 z-20 shadow-xl">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <Scan size={20} strokeWidth={3} />
                </div>

                <div className="flex flex-col gap-4 w-full px-3">
                    <button
                        onClick={() => setActiveTab('register')}
                        className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === 'register' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <ShoppingCart size={20} />
                        <span className="text-[9px] font-black uppercase tracking-wider">Sell</span>
                    </button>
                    <button
                        onClick={() => onTabChange && onTabChange('orders')}
                        className="p-3 rounded-xl flex flex-col items-center gap-1 text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <Package size={20} />
                        <span className="text-[9px] font-black uppercase tracking-wider">Orders</span>
                    </button>
                    <button className="p-3 rounded-xl flex flex-col items-center gap-1 text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                        <User size={20} />
                        <span className="text-[9px] font-black uppercase tracking-wider">Cust.</span>
                    </button>
                </div>

                <div className="mt-auto flex flex-col gap-4 w-full px-3">
                    <button className="p-3 rounded-xl flex flex-col items-center gap-1 text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                        <Printer size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">{shopName || 'POS Terminal'}</h1>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-bold uppercase tracking-wider">Online</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 border border-slate-200">
                            <Search className="h-4 w-4 text-slate-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Global Search..."
                                className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-48 placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="text-right hidden md:block">
                                <p className="text-xs font-black text-slate-900">{profile?.full_name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{profile?.role}</p>
                            </div>
                            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black text-xs border border-indigo-200">
                                {profile?.email?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Body (Register View) */}
                <div className="flex-1 overflow-hidden p-4 md:p-6">
                    {activeTab === 'register' && (
                        <div className="h-full flex flex-col lg:flex-row gap-6">
                            {/* Products Side */}
                            <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-slate-100 flex gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Search products..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-3 pl-10 pr-4 text-xs font-bold outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 px-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <Package size={16} className="text-slate-400" />
                                        <span className="text-xs font-black text-slate-700">{filteredProducts.length}</span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {filteredProducts.map(product => (
                                            <button
                                                key={product.id}
                                                onClick={() => addToCart(product)}
                                                className="group bg-white rounded-xl p-3 border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left flex flex-col h-full"
                                            >
                                                <div className="w-full aspect-square rounded-lg bg-slate-100 mb-3 overflow-hidden relative">
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-xl">IMG</div>
                                                    )}
                                                    <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                                                        {product.stock_quantity}
                                                    </div>
                                                </div>
                                                <h3 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2 mb-1 group-hover:text-emerald-600 transition-colors">{product.name}</h3>
                                                <p className="text-[10px] font-medium text-slate-400 mb-2">{product.sku}</p>
                                                <div className="mt-auto font-black text-sm text-slate-900">{formatPrice(product.price)}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Cart Side */}
                            <div className="w-full lg:w-[400px] bg-white rounded-2xl border border-slate-200 flex flex-col shadow-xl shadow-slate-200/50 h-[calc(100vh-140px)] lg:h-auto">
                                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
                                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-900 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        Current Order
                                    </h2>
                                    <button onClick={() => setCart([])} className="text-slate-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex gap-3 bg-white border border-slate-100 p-2 rounded-xl group hover:border-slate-200 transition-all">
                                            <div className="w-12 h-12 bg-slate-100 rounded-lg shrink-0 overflow-hidden">
                                                <img src={item.image_url} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-xs font-bold text-slate-900 truncate pr-2">{item.name}</p>
                                                    <p className="text-xs font-black text-slate-900">{formatPrice(item.price * item.quantity)}</p>
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <p className="text-[10px] text-slate-400">{formatPrice(item.price)} x {item.quantity}</p>
                                                    <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                                                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded shadow-sm text-slate-500"><Minus size={10} /></button>
                                                        <span className="text-[10px] font-bold w-4 text-center">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded shadow-sm text-slate-500"><Plus size={10} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {cart.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                            <ShoppingCart size={32} className="mb-2 opacity-50" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Cart Empty</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-xs text-slate-500">
                                            <span>Subtotal</span>
                                            <span className="font-bold">{formatPrice(total)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-500">
                                            <span>Tax</span>
                                            <span className="font-bold">$0.00</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-200">
                                            <span>Total</span>
                                            <span className="text-emerald-600">{formatPrice(total)}</span>
                                        </div>
                                    </div>
                                    <button
                                        disabled={cart.length === 0}
                                        onClick={() => setCheckoutModal(true)}
                                        className="w-full py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Checkout
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Checkout Modal */}
            {checkoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Checkout</h3>
                            <button onClick={() => setCheckoutModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'cash', label: 'Cash', icon: <Banknote size={20} /> },
                                    { id: 'card', label: 'Card', icon: <CreditCard size={20} /> },
                                    { id: 'transfer', label: 'Other', icon: <User size={20} /> }
                                ].map(method => (
                                    <button
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id as any)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === method.id ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                                    >
                                        {method.icon}
                                        <span className="text-[10px] font-black uppercase">{method.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="text-center py-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Amount Due</p>
                                <p className="text-4xl font-black text-slate-900 mt-1">{formatPrice(total)}</p>
                            </div>

                            <button onClick={handleCheckout} disabled={submitting} className="w-full py-4 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
                                {submitting ? 'Processing...' : 'Complete Sale'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal & Receipt - Simplified */}
            {/* Success Modal & Receipt - Professional Design */}
            {orderComplete && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="bg-emerald-500 p-6 text-center text-white shrink-0">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                                <CheckCircle size={24} />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Payment Success</h2>
                        </div>

                        <div className="p-6 overflow-y-auto bg-slate-50 flex flex-col items-center">
                            {/* Receipt Container - This is captured for PDF */}
                            <div id="printable-receipt" className="bg-white p-6 w-full shadow-sm border border-gray-100 text-center relative mb-6">
                                {/* Receipt Header */}
                                <div className="border-b-2 border-dashed border-gray-200 pb-4 mb-4 text-center">
                                    <h3 className="font-black text-slate-900 uppercase text-lg leading-none mb-1">{shopName || 'Store Receipt'}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date().toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Order #{orderComplete.order_number}</p>
                                </div>

                                {/* Items List */}
                                <div className="space-y-3 mb-4 text-left min-h-[60px]">
                                    {orderComplete.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-start text-xs font-bold text-slate-700">
                                            <div className="flex flex-col">
                                                <span>{item.name}</span>
                                                <span className="text-[10px] text-slate-400">x{item.quantity} @ {formatPrice(item.price)}</span>
                                            </div>
                                            <span>{formatPrice(item.price * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="border-t-2 border-dashed border-gray-200 pt-4 space-y-1">
                                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(orderComplete.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-black text-slate-900 uppercase tracking-tight mt-2">
                                        <span>Total Paid</span>
                                        <span>{formatPrice(orderComplete.total)}</span>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Thank you for your business!</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button onClick={handleDownloadReceipt} className="py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-black transition-all flex items-center justify-center gap-2">
                                    <Download size={16} /> Save PDF
                                </button>
                                <button onClick={() => window.print()} className="py-3 bg-white border border-gray-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                    <Printer size={16} /> Print
                                </button>
                                <button onClick={() => setOrderComplete(null)} className="col-span-2 py-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-all">
                                    Start New Order
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
