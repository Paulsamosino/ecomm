/**
 * Safe Storage Utility
 * Provides a localStorage wrapper that handles access restrictions gracefully
 * Falls back to in-memory storage when localStorage is not available
 */

class SafeStorage {
  constructor() {
    this.isLocalStorageAvailable = this.checkLocalStorageAvailability();
    this.fallbackStorage = new Map();

    if (!this.isLocalStorageAvailable) {
      console.warn(
        "localStorage is not available. Using in-memory storage fallback."
      );
    }
  }

  checkLocalStorageAvailability() {
    try {
      const testKey = "__localStorage_test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn("localStorage access failed:", error.message);
      return false;
    }
  }

  getItem(key) {
    try {
      if (this.isLocalStorageAvailable) {
        return localStorage.getItem(key);
      } else {
        return this.fallbackStorage.get(key) || null;
      }
    } catch (error) {
      console.warn(`Failed to get item "${key}" from storage:`, error.message);
      return this.fallbackStorage.get(key) || null;
    }
  }

  setItem(key, value) {
    try {
      if (this.isLocalStorageAvailable) {
        localStorage.setItem(key, value);
      }
      // Always store in fallback as backup
      this.fallbackStorage.set(key, value);
      return true;
    } catch (error) {
      console.warn(`Failed to set item "${key}" in storage:`, error.message);
      // Store only in fallback storage
      this.fallbackStorage.set(key, value);
      return false;
    }
  }

  removeItem(key) {
    try {
      if (this.isLocalStorageAvailable) {
        localStorage.removeItem(key);
      }
      this.fallbackStorage.delete(key);
      return true;
    } catch (error) {
      console.warn(
        `Failed to remove item "${key}" from storage:`,
        error.message
      );
      this.fallbackStorage.delete(key);
      return false;
    }
  }

  clear() {
    try {
      if (this.isLocalStorageAvailable) {
        localStorage.clear();
      }
      this.fallbackStorage.clear();
      return true;
    } catch (error) {
      console.warn("Failed to clear storage:", error.message);
      this.fallbackStorage.clear();
      return false;
    }
  }

  // Get all keys from storage
  keys() {
    try {
      if (this.isLocalStorageAvailable) {
        return Object.keys(localStorage);
      } else {
        return Array.from(this.fallbackStorage.keys());
      }
    } catch (error) {
      console.warn("Failed to get storage keys:", error.message);
      return Array.from(this.fallbackStorage.keys());
    }
  }

  // Check if storage is working
  isAvailable() {
    return this.isLocalStorageAvailable;
  }

  // Get storage type for debugging
  getStorageType() {
    return this.isLocalStorageAvailable ? "localStorage" : "memory";
  }
}

// Create and export singleton instance
const safeStorage = new SafeStorage();

export default safeStorage;

// Export individual methods for convenience
export const {
  getItem,
  setItem,
  removeItem,
  clear,
  keys,
  isAvailable,
  getStorageType,
} = safeStorage;
