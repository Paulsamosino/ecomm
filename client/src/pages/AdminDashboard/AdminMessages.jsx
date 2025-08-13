import React, { useEffect, useState } from "react";
import api from "@/api/axios";
import MessagesList from "@/components/chat/MessagesList";
import ChatThread from "@/components/chat/ChatThread";

const AdminMessages = () => {
  const [chats, setChats] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetId, setTargetId] = useState("");
  const [productId, setProductId] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/chat");
        setChats(data);
        if (!active && data[0]) setActive(data[0]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const refresh = async () => {
    const { data } = await api.get("/chat");
    setChats(data);
  };

  const startDirect = async (e) => {
    e.preventDefault();
    if (!targetId.trim()) return;
    const { data } = await api.post("/chat/create-or-get", { participantId: targetId.trim(), productId: productId.trim() || undefined });
    setChats((prev) => {
      const exists = prev.find((c) => c._id === data._id);
      if (exists) return prev;
      return [data, ...prev];
    });
    setActive(data);
  };

  return (
    <div className="h-[calc(100vh-120px)] bg-white border rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-3 overflow-hidden min-h-0">
      <div className="md:border-r overflow-y-auto overflow-x-hidden h-full min-h-0">
        <div className="p-3 space-y-2">
          <div className="font-semibold flex items-center justify-between">
            <span>Support & Direct Messages</span>
            <button onClick={refresh} className="text-xs px-2 py-1 rounded-md bg-orange-500 text-white hover:bg-orange-600">Refresh</button>
          </div>
          <form onSubmit={startDirect} className="flex items-center gap-2">
            <input value={targetId} onChange={(e)=>setTargetId(e.target.value)} placeholder="User ID" className="flex-1 border px-2 py-1 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-orange-300" />
            <input value={productId} onChange={(e)=>setProductId(e.target.value)} placeholder="Product ID (opt)" className="flex-1 border px-2 py-1 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-orange-300" />
            <button className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50">Start</button>
          </form>
        </div>
        {loading ? <div className="p-3 text-sm text-gray-500">Loading...</div> : (
          <MessagesList chats={chats} activeId={active?._id} onSelect={setActive} />
        )}
      </div>
  <div className="md:col-span-2 h-full min-h-0">
        {active ? (
          <ChatThread chat={active} onBack={() => setActive(null)} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">Select a conversation</div>
        )}
      </div>
    </div>
  );
};

export default AdminMessages;
