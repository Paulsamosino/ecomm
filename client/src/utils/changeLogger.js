/**
 * Change Logging Service
 * Tracks all changes made to inventory and breeding records
 */

const LOG_STORAGE_KEY = "change_logs_v1";

export const LOG_TYPES = {
  INVENTORY: {
    ADD: 'inventory_add',
    UPDATE: 'inventory_update',
    DELETE: 'inventory_delete',
    ARCHIVE: 'inventory_archive',
    RESTORE: 'inventory_restore',
    DUPLICATE: 'inventory_duplicate',
    IMPORT: 'inventory_import',
    EXPORT: 'inventory_export'
  },
  BREEDING: {
    CREATE: 'breeding_create',
    EDIT: 'breeding_edit',
    ARCHIVE: 'breeding_archive',
    RESTORE: 'breeding_restore',
    DELETE: 'breeding_delete',
    DUPLICATE: 'breeding_duplicate'
  }
};

class ChangeLogger {
  constructor() {
    this.logs = this.loadLogs();
  }

  loadLogs() {
    try {
      const saved = localStorage.getItem(LOG_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load change logs:', e);
      return [];
    }
  }

  saveLogs() {
    try {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
    } catch (e) {
      console.error('Failed to save change logs:', e);
    }
  }

  logChange(type, entity, action, details = {}, userId = 'current_user') {
    const logEntry = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      entity, // 'inventory' or 'breeding'
      action, // specific action like 'add', 'update', etc.
      details,
      userId
    };

    this.logs.unshift(logEntry); // Add to beginning for chronological order (newest first)

    // Keep only last 1000 entries to prevent localStorage bloat
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(0, 1000);
    }

    this.saveLogs();
    return logEntry;
  }

  getLogs(filters = {}) {
    let filteredLogs = [...this.logs];

    if (filters.entity) {
      filteredLogs = filteredLogs.filter(log => log.entity === filters.entity);
    }

    if (filters.type) {
      filteredLogs = filteredLogs.filter(log => log.type === filters.type);
    }

    if (filters.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filters.action);
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= toDate);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log =>
        JSON.stringify(log.details).toLowerCase().includes(searchTerm) ||
        log.type.toLowerCase().includes(searchTerm) ||
        log.action.toLowerCase().includes(searchTerm)
      );
    }

    return filteredLogs;
  }

  clearLogs() {
    this.logs = [];
    this.saveLogs();
  }

  getLogStats() {
    const stats = {
      total: this.logs.length,
      byEntity: {},
      byType: {},
      byAction: {},
      recentActivity: this.logs.slice(0, 10)
    };

    this.logs.forEach(log => {
      stats.byEntity[log.entity] = (stats.byEntity[log.entity] || 0) + 1;
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
    });

    return stats;
  }
}

// Create singleton instance
const changeLogger = new ChangeLogger();

export default changeLogger;

// Helper functions for common logging patterns
export const logInventoryChange = (action, itemDetails, additionalDetails = {}) => {
  return changeLogger.logChange(
    LOG_TYPES.INVENTORY[action.toUpperCase()],
    'inventory',
    action,
    { item: itemDetails, ...additionalDetails }
  );
};

export const logBreedingChange = (action, recordDetails, additionalDetails = {}) => {
  return changeLogger.logChange(
    LOG_TYPES.BREEDING[action.toUpperCase()],
    'breeding',
    action,
    { record: recordDetails, ...additionalDetails }
  );
};

// Utility function to format log entries for display
export const formatLogEntry = (log) => {
  const date = new Date(log.timestamp);
  const timeString = date.toLocaleString();

  const actionDescriptions = {
    // Inventory actions
    'inventory_add': 'Added item to inventory',
    'inventory_update': 'Updated inventory item',
    'inventory_delete': 'Removed item from inventory',
    'inventory_archive': 'Archived inventory item',
    'inventory_restore': 'Restored inventory item',
    'inventory_duplicate': 'Duplicated inventory item',
    'inventory_import': 'Imported inventory items',
    'inventory_export': 'Exported inventory data',

    // Breeding actions
    'breeding_create': 'Created breeding record',
    'breeding_edit': 'Edited breeding record',
    'breeding_archive': 'Archived breeding record',
    'breeding_restore': 'Restored breeding record',
    'breeding_delete': 'Deleted breeding record',
    'breeding_duplicate': 'Duplicated breeding record'
  };

  const description = actionDescriptions[log.type] || `${log.entity} ${log.action}`;

  // Create human-readable details
  const readableDetails = formatDetailsForDisplay(log);

  return {
    ...log,
    formattedTime: timeString,
    description,
    readableDetails,
    summary: `${description} at ${timeString}`
  };
};

// Function to format details in a human-readable way
const formatDetailsForDisplay = (log) => {
  const { type, details } = log;

  switch (type) {
    case 'inventory_add':
      return {
        title: 'Item Added',
        items: [
          { label: 'Name', value: details.item?.name || 'Unknown' },
          { label: 'Quantity', value: details.item?.qty || 'N/A' },
          { label: 'Category', value: details.item?.category || 'Uncategorized' }
        ]
      };

    case 'inventory_update':
      const changes = [];
      if (details.previousQty !== undefined && details.newQty !== undefined) {
        changes.push({ label: 'Quantity', value: `${details.previousQty} → ${details.newQty}` });
      }
      if (details.addedQty) {
        changes.push({ label: 'Added Quantity', value: `+${details.addedQty}` });
      }
      return {
        title: 'Item Updated',
        items: [
          { label: 'Name', value: details.item?.name || 'Unknown' },
          ...changes,
          { label: 'Category', value: details.item?.category || 'N/A' }
        ]
      };

    case 'inventory_delete':
      return {
        title: 'Item Removed',
        items: [
          { label: 'Name', value: details.item?.name || 'Unknown' },
          { label: 'Quantity', value: details.item?.qty || 'N/A' },
          { label: 'Category', value: details.item?.category || 'Uncategorized' }
        ]
      };

    case 'inventory_archive':
    case 'inventory_restore':
      return {
        title: `Item ${type.includes('archive') ? 'Archived' : 'Restored'}`,
        items: [
          { label: 'Name', value: details.item?.name || 'Unknown' },
          { label: 'Status', value: type.includes('archive') ? 'Archived' : 'Active' }
        ]
      };

    case 'inventory_duplicate':
      return {
        title: 'Item Duplicated',
        items: [
          { label: 'Original', value: details.originalItem?.name || 'Unknown' },
          { label: 'Copy', value: details.item?.name || 'Unknown' }
        ]
      };

    case 'inventory_import':
      return {
        title: 'Items Imported',
        items: [
          { label: 'Items Imported', value: details.importedCount || 'N/A' },
          { label: 'Total Items', value: details.totalItems || 'N/A' }
        ]
      };

    case 'breeding_create':
      return {
        title: 'Breeding Record Created',
        items: [
          { label: 'Parent 1', value: details.record?.parent1?.name || 'Unknown' },
          { label: 'Parent 2', value: details.record?.parent2?.name || 'Unknown' },
          { label: 'Offspring Name', value: details.record?.offspring?.name || 'Not named' }
        ]
      };

    case 'breeding_edit':
      return {
        title: 'Breeding Record Edited',
        items: [
          { label: 'Record ID', value: details.record?.id?.substring(0, 8) + '...' || 'Unknown' },
          { label: 'Changes Made', value: 'Record details updated' }
        ]
      };

    case 'breeding_archive':
    case 'breeding_restore':
      return {
        title: `Breeding Record ${type.includes('archive') ? 'Archived' : 'Restored'}`,
        items: [
          { label: 'Record ID', value: details.record?.id?.substring(0, 8) + '...' || 'Unknown' },
          { label: 'Status', value: type.includes('archive') ? 'Archived' : 'Active' }
        ]
      };

    case 'breeding_delete':
      return {
        title: 'Breeding Record Deleted',
        items: [
          { label: 'Record ID', value: details.record?.id?.substring(0, 8) + '...' || 'Unknown' },
          { label: 'Parent 1', value: details.record?.parent1?.name || 'Unknown' },
          { label: 'Parent 2', value: details.record?.parent2?.name || 'Unknown' }
        ]
      };

    case 'breeding_duplicate':
      return {
        title: 'Breeding Record Duplicated',
        items: [
          { label: 'Original ID', value: details.originalRecord?.id?.substring(0, 8) + '...' || 'Unknown' },
          { label: 'New ID', value: details.record?.id?.substring(0, 8) + '...' || 'Unknown' }
        ]
      };

    default:
      return {
        title: 'Change Details',
        items: [
          { label: 'Action', value: log.action },
          { label: 'Entity', value: log.entity }
        ]
      };
  }
};