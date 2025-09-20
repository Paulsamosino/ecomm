import React, { useEffect, useState, useRef } from 'react';
import { apiGetMaintenance, apiSetMaintenance } from '@/api/admin';

const formatDate = (v) => {
  if (!v) return 'None';
  try {
    const d = new Date(v);
    return isNaN(d.getTime()) ? 'Invalid date' : d.toLocaleString();
  } catch (e) {
    return 'None';
  }
};

const AdminMaintenance = () => {
  const [loading, setLoading] = useState(true);
  const [cfg, setCfg] = useState(null);
  const [maintenance, setMaintenance] = useState(false);
  const [grace, setGrace] = useState(5);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGetMaintenance();
        setCfg(res);
        setMaintenance(!!res.maintenance);
      } catch (err) {
        console.error('Failed to fetch maintenance:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Keep countdown in sync when a scheduled time exists
  useEffect(() => {
    clearInterval(timerRef.current);
    if (!cfg?.maintenanceScheduledAt) {
      setCountdown(null);
      return;
    }

    const target = new Date(cfg.maintenanceScheduledAt).getTime();
    if (isNaN(target)) {
      setCountdown(null);
      return;
    }

    const update = () => {
      const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setCountdown(diff);
    };

    update();
    timerRef.current = setInterval(update, 1000);
    return () => clearInterval(timerRef.current);
  }, [cfg?.maintenanceScheduledAt]);

  const humanCountdown = (sec) => {
    if (sec == null) return null;
    if (sec <= 0) return '0s';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h ? h + 'h ' : ''}${m ? m + 'm ' : ''}${s}s`;
  };

  const getStatusBadge = () => {
    if (cfg?.maintenance) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">ENABLED</span>;
    }
    if (cfg?.maintenanceScheduledAt && new Date(cfg.maintenanceScheduledAt).getTime() > Date.now()) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">SCHEDULED</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">DISABLED</span>;
  };

  const handleToggle = async (e) => {
    e.preventDefault();
    // confirm disable
    if (maintenance) {
      const ok = window.confirm('Are you sure you want to disable maintenance? This will allow users to log back in.');
      if (!ok) return;
    }

    setSaving(true);
    setMessage('');
    try {
      let body;
      if (!maintenance) {
        // enabling
        body = { maintenance: true, graceMinutes: Number(grace) || 0 };
      } else {
        // disabling
        body = { maintenance: false };
      }

      await apiSetMaintenance(body);

      // Re-fetch the authoritative config from server to ensure UI is correct
      const fresh = await apiGetMaintenance();
      setCfg(fresh);
      setMaintenance(!!fresh.maintenance);
      setMessage('Updated maintenance state');
    } catch (err) {
      console.error('Failed to set maintenance:', err);
      setMessage(err?.response?.data?.message || 'Failed to update maintenance state');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Maintenance Mode</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4 max-w-2xl">
          <div className="bg-white p-4 rounded shadow flex items-center justify-between">
            <div>
              <p className="font-medium">Current state: {getStatusBadge()}</p>
              <p className="text-sm text-gray-600 mt-2">Scheduled At: <span className="font-medium">{formatDate(cfg?.maintenanceScheduledAt)}</span></p>
              {countdown != null && countdown > 0 && (
                <p className="text-sm text-amber-700">Starts in: <span className="font-semibold">{humanCountdown(countdown)}</span></p>
              )}
              <p className="text-sm text-gray-600">Activated At: <span className="font-medium">{formatDate(cfg?.maintenanceActivatedAt)}</span></p>
              <p className="text-sm text-gray-600">Token Invalid Before: <span className="font-medium">{cfg?.tokenInvalidBefore ? new Date(cfg.tokenInvalidBefore * 1000).toLocaleString() : 'None'}</span></p>
            </div>
            <div className="text-right text-sm text-gray-500">Last updated: <br />{formatDate(cfg?.updatedAt || cfg?.maintenanceActivatedAt)}</div>
          </div>

          <div className="bg-white p-4 rounded shadow space-y-3">
            <label className="block font-medium">Grace minutes before activation (0 = immediate)</label>
            <input type="number" value={grace} onChange={(e) => setGrace(e.target.value)} className="w-32 px-3 py-2 border rounded" />
            <div className="pt-2">
              <button
                onClick={handleToggle}
                disabled={saving}
                className={`px-4 py-2 rounded text-white ${maintenance ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}
              >
                {saving ? 'Saving...' : maintenance ? 'Disable Maintenance' : 'Enable Maintenance'}
              </button>
            </div>
            {message && <p className="text-sm text-red-600">{message}</p>}
            <p className="text-xs text-gray-500">Notes: Scheduling will notify connected non-admin users and optionally force logout when activation occurs.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMaintenance;
