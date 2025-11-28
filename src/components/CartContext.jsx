import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth/AuthContext';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    // Return safe defaults if context is not available
    return {
      cart: [],
      addToCart: () => console.warn('CartProvider not found'),
      removeFromCart: () => console.warn('CartProvider not found'),
      updateQuantity: () => console.warn('CartProvider not found'),
      clearCart: () => console.warn('CartProvider not found'),
      getCartTotal: () => 0,
      getCartCount: () => 0,
      isPurchased: () => false
    };
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const { user } = useAuth();

  // Load cart from localStorage on mount
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

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('atom_eve_cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cart]);

  const addToCart = (item) => {
    setCart((prevCart) => {
      // Check if item already exists in cart
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        // If it exists, increase quantity
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: (cartItem.quantity || 1) + 1 }
            : cartItem
        );
      }
      // If it doesn't exist, add it with quantity 1
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prevCart) => prevCart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = typeof item.price === 'number' ? item.price : 0;
      const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
      return total + (price * quantity);
    }, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => {
      const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
      return count + quantity;
    }, 0);
  };

  // Check if a game is purchased by checking user's purchased_items
  const isPurchased = (gameId) => {
    if (!user || !user.purchased_items) return false;
    return user.purchased_items.includes(gameId);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
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