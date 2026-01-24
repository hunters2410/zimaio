import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Minimal product type for favorites to avoid circular deps if needed
export interface FavoriteProduct {
    id: string;
    name: string;
    base_price: number;
    images: string[];
}

interface FavoritesContextType {
    favorites: FavoriteProduct[];
    addFavorite: (product: FavoriteProduct) => void;
    removeFavorite: (productId: string) => void;
    isFavorite: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
    favorites: [],
    addFavorite: () => { },
    removeFavorite: () => { },
    isFavorite: () => false,
});

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
    const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            const stored = await AsyncStorage.getItem('user_favorites');
            if (stored) {
                setFavorites(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load favorites", e);
        }
    };

    const saveFavorites = async (newFavorites: FavoriteProduct[]) => {
        try {
            await AsyncStorage.setItem('user_favorites', JSON.stringify(newFavorites));
        } catch (e) {
            console.error("Failed to save favorites", e);
        }
    };

    const addFavorite = (product: FavoriteProduct) => {
        if (!isFavorite(product.id)) {
            const newFavs = [...favorites, product];
            setFavorites(newFavs);
            saveFavorites(newFavs);
        }
    };

    const removeFavorite = (productId: string) => {
        const newFavs = favorites.filter(p => p.id !== productId);
        setFavorites(newFavs);
        saveFavorites(newFavs);
    };

    const isFavorite = (productId: string) => {
        return favorites.some(p => p.id === productId);
    };

    return (
        <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => useContext(FavoritesContext);
