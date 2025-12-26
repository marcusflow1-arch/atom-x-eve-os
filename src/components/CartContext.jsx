import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth/AuthContext';
import { toast } from 'sonner';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    return {
      cart: [],
      isCartOpen: false,
      addToCart: () => {},
      removeFromCart: () => {},
      clearCart: () => {},
      openCart: () => {},
      closeCart: () => {},
      getCartTotal: () => 0,
      getCartCount: () => 0,
      isPurchased: () => false
    };
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('atom_eve_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('atom_eve_cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cart]);

  const addToCart = (item) => {
    setCart((prevCart) => {
      // Check if item already exists
      if (prevCart.find(i => i.id === item.id && i.type === item.type)) {
        toast.info("Item already in cart");
        return prevCart;
      }
      toast.success("Added to cart");
      return [...prevCart, { ...item, addedAt: new Date().toISOString() }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (itemId) => {
    setCart((prevCart) => prevCart.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (Number(item.price) || 0), 0);
  };

  const getCartCount = () => cart.length;

  const isPurchased = (gameId) => {
    if (!user || !user.purchased_items) return false;
    return user.purchased_items.includes(gameId);
  };

  const value = {
    cart,
    isCartOpen,
    addToCart,
    removeFromCart,
    clearCart,
    openCart,
    closeCart,
    getCartTotal,
    getCartCount,
    isPurchased
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};