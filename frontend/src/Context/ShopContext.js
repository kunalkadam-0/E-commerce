// frontend/src/Context/ShopContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Create the context
export const ShopContext = createContext(null);

const ShopContextProvider = (props) => {
    const [cartItemsCount, setCartItemsCount] = useState(0);

    // Function to fetch the current total number of items in the user's cart
    const fetchCartCount = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setCartItemsCount(0); // If no token, cart is empty
            return;
        }
        try {
            const response = await axios.get('http://localhost:5000/api/cart', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            // Calculate total quantity of items in the cart
            const totalCount = response.data.reduce((sum, item) => sum + item.quantity, 0);
            setCartItemsCount(totalCount);
        } catch (error) {
            console.error("Error fetching cart count:", error);
            setCartItemsCount(0); // Reset count on error or unauthorized
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                // If token expired/invalid, clear it and redirect (handled by component specific logic)
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
            }
        }
    }, []); // No dependencies as it uses local storage and axios.

    // Effect to fetch count on initial load and when token changes
    useEffect(() => {
        fetchCartCount();
        // You might want to re-fetch cart count on login/logout
        // or set up an event listener if authentication state changes globally.
        // For simplicity, we assume token change will trigger this.
    }, [fetchCartCount]);

    // Function to update cart count after an action (add/remove/update)
    const updateCartCount = useCallback(() => {
        fetchCartCount(); // Just re-fetch the count
    }, [fetchCartCount]);

    // Context value to be provided to consumers
    const contextValue = { cartItemsCount, updateCartCount };

    return (
        <ShopContext.Provider value={contextValue}>
            {props.children}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;