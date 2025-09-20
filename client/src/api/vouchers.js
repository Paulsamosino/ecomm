const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function validateVoucher(code, totalAmount) {
  const res = await fetch(`${API_URL}/api/vouchers/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, totalAmount })
  });
  if (!res.ok) {
    const data = await res.json().catch(()=>({}));
    throw new Error(data.reason || data.message || 'Invalid voucher');
  }
  return res.json();
}

export async function createVoucher(data, token) {
  const res = await fetch(`${API_URL}/api/vouchers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create voucher');
  return res.json();
}
