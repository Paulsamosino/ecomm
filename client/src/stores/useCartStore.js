import { create } from "zustand";

const useCartStore = create((set) => ({
  // Cart items array
  items: [],

  // Add item to cart
  addItem: (product) =>
    set((state) => {
      const existingItem = state.items.find((item) => item.id === product.id);

      if (existingItem) {
        // If item exists, increase quantity
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }

      // If item doesn't exist, add new item with quantity 1
      return {
        items: [...state.items, { ...product, quantity: 1 }],
      };
    }),

  // Remove item from cart
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    })),

  // Update item quantity
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(0, quantity) }
          : item
      ),
    })),

  // Clear cart
  clearCart: () => set({ items: [] }),

  // Get cart total
  getTotal: () => {
    const store = useCartStore.getState();
    return store.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  },

  // Get total number of items
  getItemCount: () => {
    const store = useCartStore.getState();
    return store.items.reduce((count, item) => count + item.quantity, 0);
  },
}));

export default useCartStore;
