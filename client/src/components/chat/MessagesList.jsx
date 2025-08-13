import React from "react";

const formatTime = (ts) => {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
};

const MessagesList = ({ chats = [], activeId, onSelect }) => {
  return (
    <div className="divide-y rounded-md bg-white border">
      {chats.length === 0 && (
        <div className="p-4 text-sm text-gray-500">No conversations yet.</div>
      )}
      {chats.map((c) => {
        const others = (c.participants || []).filter((p) => !p.isSelf);
        const label = c.isSupport ? "Support" : (others[0]?.name || "Conversation");
        return (
          <button
            key={c._id}
            onClick={() => onSelect(c)}
            className={`w-full text-left p-3 hover:bg-orange-50 ${activeId === c._id ? "bg-orange-50" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs">
                  {(c.isSupport ? "S" : (label?.[0] || "C")).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium flex items-center gap-2">
                    {label}
                    {c.isSupport && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">Support</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 line-clamp-1">{c.lastMessage || "Start chatting"}</div>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 whitespace-nowrap">{formatTime(c.lastMessageAt || c.updatedAt || c.createdAt)}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default MessagesList;
