import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    base_price: number;
    quantity: number;
    image: string;
    vendor: string;
    vendor_id: string;
    options?: Record<string, any>;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: string, options?: any) => void;
    updateQuantity: (id: string, quantity: number, options?: any) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCart();
    }, []);

    useEffect(() => {
        if (!loading) {
            saveCart();
        }
    }, [cartItems, loading]);

    const loadCart = async () => {
        try {
            const savedCart = await AsyncStorage.getItem('zimAio_cart');
            if (savedCart) {
                setCartItems(JSON.parse(savedCart));
            }
        } catch (error) {
            console.error('Failed to load cart', error);
        } finally {
            setLoading(false);
        }
    };

    const saveCart = async () => {
        try {
            await AsyncStorage.setItem('zimAio_cart', JSON.stringify(cartItems));
        } catch (error) {
            console.error('Failed to save cart', error);
        }
    };

    const addToCart = (newItem: CartItem) => {
        setCartItems(prev => {
            const existingItem = prev.find(item =>
                item.id === newItem.id &&
                JSON.stringify(item.options) === JSON.stringify(newItem.options)
            );
            if (existingItem) {
                return prev.map(item =>
                    (item.id === newItem.id && JSON.stringify(item.options) === JSON.stringify(newItem.options))
                        ? { ...item, quantity: item.quantity + newItem.quantity }
                        : item
                );
            }
            return [...prev, newItem];
        });
    };

    const removeFromCart = (id: string, options?: any) => {
        setCartItems(prev => prev.filter(item =>
            !(item.id === id && JSON.stringify(item.options) === JSON.stringify(options))
        ));
    };

    const updateQuantity = (id: string, quantity: number, options?: any) => {
        setCartItems(prev =>
            prev.map(item =>
                (item.id === id && JSON.stringify(item.options) === JSON.stringify(options))
                    ? { ...item, quantity: Math.max(1, quantity) }
                    : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            totalItems,
            totalPrice
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
