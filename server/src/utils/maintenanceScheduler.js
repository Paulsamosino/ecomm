const SiteConfig = require('../models/SiteConfig');
const websocketService = require('../services/websocketService');

let scheduledTimeout = null;

async function getConfig() {
  let cfg = await SiteConfig.findOne();
  if (!cfg) {
    cfg = new SiteConfig();
    await cfg.save();
  }
  return cfg;
}

async function activateMaintenanceNow() {
  const cfg = await getConfig();
  cfg.maintenance = true;
  cfg.maintenanceActivatedAt = new Date();
  cfg.tokenInvalidBefore = Math.floor(Date.now() / 1000);
  cfg.maintenanceScheduledAt = null;
  await cfg.save();

  // Notify all connected clients about maintenance start
  try {
  websocketService.emitToNonAdmins && websocketService.emitToNonAdmins('maintenance_started', { message: 'System is under maintenance' });
  // Force disconnect non-admins
  websocketService.disconnectNonAdmins && websocketService.disconnectNonAdmins('maintenance_started');
  } catch (err) {
    console.error('Failed to emit maintenance_started:', err);
  }

  return cfg;
}

async function scheduleMaintenanceInMinutes(minutes) {
  clearScheduled();
  const cfg = await getConfig();
  const when = new Date(Date.now() + minutes * 60 * 1000);
  cfg.maintenanceScheduledAt = when;
  await cfg.save();

  // notify connected clients of scheduled maintenance
  try {
  websocketService.emitToNonAdmins && websocketService.emitToNonAdmins('maintenance_scheduled', { message: 'System maintenance scheduled', startsAt: when, minutes });
  } catch (err) {
    console.error('Failed to emit maintenance_scheduled:', err);
  }

  scheduledTimeout = setTimeout(async () => {
    await activateMaintenanceNow();
  }, minutes * 60 * 1000);

  return cfg;
}

async function cancelScheduledMaintenance() {
  clearScheduled();
  const cfg = await getConfig();
  cfg.maintenanceScheduledAt = null;
  await cfg.save();

  try {
  websocketService.emitToNonAdmins && websocketService.emitToNonAdmins('maintenance_cancelled', { message: 'Scheduled maintenance cancelled' });
  } catch (err) {
    console.error('Failed to emit maintenance_cancelled:', err);
  }

  return cfg;
}

function clearScheduled() {
  if (scheduledTimeout) {
    clearTimeout(scheduledTimeout);
    scheduledTimeout = null;
  }
}

async function disableMaintenance() {
  clearScheduled();
  const cfg = await getConfig();
  cfg.maintenance = false;
  cfg.tokenInvalidBefore = 0;
  cfg.maintenanceActivatedAt = null;
  cfg.maintenanceScheduledAt = null;
  await cfg.save();

  try {
  websocketService.emitToNonAdmins && websocketService.emitToNonAdmins('maintenance_disabled', { message: 'Maintenance disabled' });
  } catch (err) {
    console.error('Failed to emit maintenance_disabled:', err);
  }

  return cfg;
}

async function initScheduler() {
  try {
    const cfg = await getConfig();
    if (cfg.maintenanceScheduledAt && cfg.maintenanceScheduledAt > new Date()) {
      const ms = cfg.maintenanceScheduledAt.getTime() - Date.now();
      scheduledTimeout = setTimeout(async () => {
        await activateMaintenanceNow();
      }, ms);
      console.log('Maintenance scheduled to run in', Math.round(ms / 1000 / 60), 'minutes');
    }
  } catch (err) {
    console.error('Failed to init maintenance scheduler:', err);
  }
}

module.exports = {
  activateMaintenanceNow,
  scheduleMaintenanceInMinutes,
  cancelScheduledMaintenance,
  disableMaintenance,
  initScheduler,
  getConfig
};
