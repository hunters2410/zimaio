import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface WishlistContextType {
    wishlistedIds: Set<string>;
    wishlistCount: number;
    toggleWishlist: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
    refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());

    const fetchWishlist = async () => {
        if (!user) {
            setWishlistedIds(new Set());
            return;
        }
        const { data } = await supabase
            .from('wishlists')
            .select('product_id')
            .eq('user_id', user.id);
        if (data) {
            setWishlistedIds(new Set(data.map(w => w.product_id)));
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, [user]);

    const toggleWishlist = async (productId: string) => {
        if (!user) return;

        const isWishlisted = wishlistedIds.has(productId);
        try {
            if (isWishlisted) {
                await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId);
                setWishlistedIds(prev => {
                    const next = new Set(prev);
                    next.delete(productId);
                    return next;
                });
            } else {
                await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
                setWishlistedIds(prev => new Set([...prev, productId]));
            }
        } catch (err) {
            console.error('Error toggling wishlist:', err);
        }
    };

    const isInWishlist = (productId: string) => wishlistedIds.has(productId);

    return (
        <WishlistContext.Provider value={{
            wishlistedIds,
            wishlistCount: wishlistedIds.size,
            toggleWishlist,
            isInWishlist,
            refreshWishlist: fetchWishlist
        }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}
