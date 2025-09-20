import React, { useState } from 'react';
import { apiResetUserCredentials, apiUpdateUserCredentials } from '@/api/admin';

const AdminUserCredentials = () => {
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  const doReset = async () => {
    setMessage('');
    setTempPassword('');
    if (!userId) return setMessage('Enter user id');
    if (!window.confirm('Reset credentials? Temp password will be shown once.')) return;
    try {
      const res = await apiResetUserCredentials(userId);
      setTempPassword(res.tempPassword);
      setMessage('Credentials reset. TEMP PASSWORD shown once.');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to reset');
    }
  };

  const doUpdate = async () => {
    setMessage('');
    if (!userId) return setMessage('Enter user id');
    try {
      await apiUpdateUserCredentials(userId, { email: email || undefined, role: role || undefined });
      setMessage('User updated');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to update');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">User Credentials</h1>

      <div className="bg-white shadow rounded p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium">User ID</label>
          <input value={userId} onChange={(e)=>setUserId(e.target.value)} className="w-full px-3 py-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium">New email (optional)</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full px-3 py-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium">Role (optional)</label>
          <input value={role} onChange={(e)=>setRole(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="admin | buyer | seller" />
        </div>

        <div className="flex gap-2">
          <button onClick={doUpdate} className="px-3 py-2 bg-blue-600 text-white rounded">Update Credentials</button>
          <button onClick={doReset} className="px-3 py-2 bg-yellow-500 text-white rounded">Reset Password</button>
        </div>

        {tempPassword && (
          <div className="p-2 bg-yellow-50 border rounded">
            <strong>Temp password:</strong> <code>{tempPassword}</code>
            <div className="text-xs text-gray-500">Showed once. Advise user to change on first login.</div>
          </div>
        )}

        {message && <div className="text-sm text-red-600">{message}</div>}
      </div>
    </div>
  );
};

export default AdminUserCredentials;
