import axiosInstance from "@/services/axiosInstance";

export async function getWallet() {
  // axiosInstance.baseURL already points to `${API_URL}/api`
  const res = await axiosInstance.get(`/wallet/balance`);
  return res.data.wallet;
}

export async function captureTopup({ orderId, amount }) {
  const res = await axiosInstance.post(`/wallet/topup/capture`, {
    orderId,
    amount,
  });
  return res.data;
}

export default { getWallet, captureTopup };
