import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useSettings } from '../../contexts/SettingsContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
                    .select('id, name, base_price, stock_quantity, images, sku, commission_rate')
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
            } catch (err) {
                console.error('Error fetching POS products:', err);
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

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
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
    const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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

            cart.forEach(item => {
                const info = calculatePrice(item.base_price || item.price); // fallback
                orderBaseTotal += (item.base_price || item.price) * item.quantity;
                orderCommTotal += info.commission * item.quantity;
                orderVatTotal += info.vat * item.quantity;
            });

            // 1. Create order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    order_number: orderNumber,
                    vendor_id: vendorId,
                    customer_id: null, // Walk-in
                    total: total,
                    subtotal: orderBaseTotal,
                    commission_amount: orderCommTotal,
                    vat_amount: orderVatTotal,
                    status: 'delivered',
                    payment_status: 'paid',
                    payment_method: paymentMethod,
                    shipping_address: { type: 'POS', details: 'Walk-in Customer / POS Store' },
                    items: cart.map(item => {
                        const info = calculatePrice(item.base_price || item.price);
                        return {
                            id: item.id,
                            name: item.name,
                            quantity: item.quantity,
                            price: item.price,
                            base_price: item.base_price || item.price,
                            commission: info.commission,
                            vat: info.vat
                        };
                    })
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create order items and update stock
            for (const item of cart) {
                await supabase.from('order_items').insert({
                    order_id: order.id,
                    product_id: item.id,
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: item.price * item.quantity
                });

                // Decrement stock
                await supabase.rpc('decrement_stock', {
                    product_id: item.id,
                    amount: item.quantity
                });
            }

            setOrderComplete(order);
            setCart([]);
            setCheckoutModal(false);
            // Refresh products to show new stock
            fetchVendorAndProducts();
        } catch (err: any) {
            alert('Checkout failed: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('printable-receipt');
        if (!element || !orderComplete) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [80, 150] // Receipt size
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`receipt-${orderComplete.order_number}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[600px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Products Side */}
            <div className="flex-1 flex flex-col bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-2xl shadow-gray-200/50">
                <div className="p-8 border-b border-gray-50 flex flex-col gap-6 bg-gray-50/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600">
                                <Scan size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Product Catalog</h2>
                                <p className="text-[10px] font-bold text-gray-500">Select items to add to the point of sale cart.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-[10px] font-black uppercase text-gray-400 border border-gray-100">
                            <Package size={14} />
                            {products.length} Items Available
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search by name or SKU... (Ctrl+F)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-gray-100 border focus:border-emerald-500 rounded-[24px] py-5 pl-14 pr-6 text-sm font-bold transition-all outline-none shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-white">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="group flex flex-col items-start bg-gray-50/50 hover:bg-emerald-50 rounded-[32px] p-2 transition-all border border-transparent hover:border-emerald-100 active:scale-95 text-left"
                            >
                                <div className="w-full aspect-square rounded-[24px] overflow-hidden mb-4 shadow-sm bg-white">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-200 bg-gray-50 font-black text-lg">ZIM</div>
                                    )}
                                </div>
                                <div className="px-3 pb-3 w-full">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">{product.sku || 'NO-SKU'}</p>
                                    <h3 className="font-black text-gray-900 text-sm leading-tight mb-2 line-clamp-2 h-10">{product.name}</h3>
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-emerald-600 font-black text-sm tabular-nums">{formatPrice(product.price)}</span>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase bg-white px-2 py-1 rounded-lg border border-gray-100">
                                            Stock: {product.stock_quantity}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))}
                        {filteredProducts.length === 0 && (
                            <div className="col-span-full py-20 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300 mb-4">
                                    <Search size={32} />
                                </div>
                                <p className="text-sm font-bold text-gray-400 italic">No products found {searchTerm ? `for "${searchTerm}"` : ""}</p>
                                {!searchTerm && onTabChange && (
                                    <button
                                        onClick={() => onTabChange('products')}
                                        className="mt-6 inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition"
                                    >
                                        <Plus size={16} />
                                        Add Your First Product
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cart Side */}
            <div className="w-full md:w-[450px] bg-white rounded-[40px] flex flex-col shadow-2xl shadow-gray-200/50 border border-gray-100 p-2">
                <div className="p-8 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-gray-900">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                            <ShoppingCart size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Active Cart</h2>
                            <p className="text-[10px] font-bold text-gray-400">{itemsCount} Items Added</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setCart([])}
                        className="p-3 text-gray-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-xl"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
                    {cart.map(item => (
                        <div key={item.id} className="bg-white border border-gray-100 rounded-3xl p-4 flex gap-4 group hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-50/50 transition-all">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm bg-gray-50 shrink-0 border border-gray-100">
                                <img src={item.image_url} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{item.name}</h4>
                                <p className="text-[10px] text-gray-400 mb-3 font-black">{formatPrice(item.price)} each</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1 border border-gray-100">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-white rounded-lg transition-all shadow-sm"><Minus size={12} /></button>
                                        <span className="text-[11px] font-black text-gray-900 w-6 text-center tabular-nums">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-white rounded-lg transition-all shadow-sm"><Plus size={12} /></button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-black text-emerald-600 tabular-nums">{formatPrice(item.price * item.quantity)}</span>
                                        <button onClick={() => removeFromCart(item.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 p-1.5 rounded-lg"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center px-10">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6 border border-gray-100">
                                <ShoppingCart size={40} />
                            </div>
                            <h3 className="text-gray-400 font-black text-lg mb-2 uppercase tracking-wide">Empty Cart</h3>
                            <p className="text-gray-300 text-[10px] font-bold">Select premium products from the catalog to build your order.</p>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-gray-50 rounded-[36px] mt-2 border border-gray-100">
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between text-gray-500">
                            <span className="text-[11px] font-black uppercase tracking-widest">Subtotal</span>
                            <span className="font-bold tabular-nums text-xs text-gray-900">{formatPrice(total)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                            <span className="text-[11px] font-black uppercase tracking-widest">Platform Fee (0%)</span>
                            <span className="font-bold tabular-nums text-xs text-gray-900">$0.00</span>
                        </div>
                        <div className="h-px bg-gray-200" />
                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Grand Total</span>
                            <span className="text-2xl font-black text-emerald-600 tabular-nums">{formatPrice(total)}</span>
                        </div>
                    </div>

                    <button
                        disabled={cart.length === 0}
                        onClick={() => setCheckoutModal(true)}
                        className="w-full bg-gray-900 hover:bg-black text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-gray-200 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                    >
                        Terminal Checkout
                    </button>
                </div>
            </div>

            {/* Checkout Modal */}
            {checkoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Final Settlement</h3>
                                <p className="text-[10px] font-bold text-gray-500">Confirm payment method and finalize transaction.</p>
                            </div>
                            <button onClick={() => setCheckoutModal(false)} className="p-3 text-gray-400 hover:text-gray-900 transition-colors bg-white rounded-2xl shadow-sm border border-gray-100">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Payment Method</p>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: 'cash', label: 'Cash', icon: <Banknote /> },
                                        { id: 'card', label: 'Card', icon: <CreditCard /> },
                                        { id: 'transfer', label: 'Transfer', icon: <User /> }
                                    ].map(method => (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id as any)}
                                            className={`flex flex-col items-center gap-3 p-6 rounded-[28px] border-2 transition-all active:scale-95 ${paymentMethod === method.id
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-lg shadow-emerald-100'
                                                : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'
                                                }`}
                                        >
                                            <div className={paymentMethod === method.id ? 'text-emerald-500' : 'text-gray-400'}>
                                                {method.icon}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wider">{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gray-50 p-8 rounded-[32px] text-center space-y-2 border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Payable Amount</p>
                                <h4 className="text-4xl font-black text-gray-900 tabular-nums">{formatPrice(total)}</h4>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={submitting}
                                className="w-full bg-gray-900 text-white py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95 disabled:opacity-50"
                            >
                                {submitting ? 'Authenticating Transaction...' : 'Complete Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal & Receipt */}
            {orderComplete && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto py-6">
                    <div className="bg-white w-full max-w-[340px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in flex flex-col">
                        <div className="p-5 text-center space-y-3 bg-emerald-50 shrink-0 relative">
                            <button
                                onClick={() => setOrderComplete(null)}
                                className="absolute top-4 right-4 p-1.5 text-emerald-400 hover:text-emerald-700 transition-colors rounded-xl hover:bg-white/50 border border-emerald-100/50"
                            >
                                <X size={18} />
                            </button>
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-sm border border-emerald-100">
                                <CheckCircle size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Sale Completed</h3>
                                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Transaction Verified</p>
                            </div>
                        </div>

                        {/* Printable Receipt Area */}
                        <div className="p-5 bg-white overflow-y-auto max-h-[40vh] custom-scrollbar" id="printable-receipt">
                            <div className="border-2 border-dashed border-gray-100 rounded-2xl p-4 space-y-4">
                                <div className="text-center space-y-0.5">
                                    <h2 className="text-base font-black uppercase tracking-tighter text-gray-900 leading-none">{shopName || 'ZimAI Store'}</h2>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Transaction Receipt</p>
                                </div>

                                <div className="flex justify-between border-y border-gray-50 py-2.5">
                                    <div className="space-y-0.5">
                                        <p className="text-[7px] font-black text-gray-400 uppercase">Order</p>
                                        <p className="text-[9px] font-black text-gray-900">#{orderComplete.order_number}</p>
                                    </div>
                                    <div className="text-right space-y-0.5">
                                        <p className="text-[7px] font-black text-gray-400 uppercase">Date</p>
                                        <p className="text-[9px] font-black text-gray-900">{new Date(orderComplete.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[7px] font-black text-gray-400 uppercase">Items</p>
                                    <div className="space-y-1.5">
                                        {orderComplete.items?.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-start gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[9px] font-black text-gray-900 uppercase leading-none truncate">{item.name}</p>
                                                    <p className="text-[8px] font-bold text-gray-400 mt-0.5">{item.quantity} × {formatPrice(item.price)}</p>
                                                </div>
                                                <p className="text-[9px] font-black text-gray-900 shrink-0">{formatPrice(item.price * item.quantity)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-3 border-t-2 border-dashed border-gray-100 space-y-1.5">
                                    <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none">
                                        <span>Subtotal</span>
                                        <span className="text-gray-900">{formatPrice(orderComplete.total)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none">
                                        <span>Method</span>
                                        <span className="text-gray-900 uppercase text-[8px]">{orderComplete.payment_method || 'Cash'}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1.5 px-0.5">
                                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Paid</span>
                                        <span className="text-lg font-black text-emerald-600 font-mono tracking-tighter">{formatPrice(orderComplete.total)}</span>
                                    </div>
                                </div>

                                <div className="pt-3 text-center">
                                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">Thank you</p>
                                    <div className="mt-2.5 flex justify-center opacity-5">
                                        <Scan size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 pt-0 space-y-2.5 shrink-0">
                            <div className="grid grid-cols-2 gap-2.5">
                                <button
                                    onClick={() => {
                                        const style = document.createElement('style');
                                        style.innerHTML = `
                                            @media print {
                                                body * { visibility: hidden; }
                                                #printable-receipt, #printable-receipt * { visibility: visible; }
                                                #printable-receipt { 
                                                    position: absolute; 
                                                    left: 0; 
                                                    top: 0; 
                                                    width: 100%;
                                                    padding: 0;
                                                    margin: 0;
                                                }
                                            }
                                        `;
                                        document.head.appendChild(style);
                                        window.print();
                                        document.head.removeChild(style);
                                    }}
                                    className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                                >
                                    <Printer size={12} />
                                    Print
                                </button>
                                <button
                                    onClick={handleDownloadPDF}
                                    className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                                >
                                    <Download size={12} />
                                    PDF
                                </button>
                            </div>
                            <button
                                onClick={() => setOrderComplete(null)}
                                className="w-full bg-emerald-50 text-emerald-600 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-95 border border-emerald-100/50"
                            >
                                New Sale
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
