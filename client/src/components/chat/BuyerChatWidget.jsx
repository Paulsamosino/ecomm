import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";

const getSocketUrl = () => {
  // Reuse API base URL
  const http = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
  return http;
};

const BuyerChatWidget = () => {
  const { user } = useAuth();
  const isBuyer = !!user && !user.isSeller && !user.isAdmin;

  const [open, setOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [active, setActive] = useState(null); // active chat object
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pendingTarget, setPendingTarget] = useState(null); // { support: true } or { sellerId, productId }
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const socketRef = useRef(null);
  const listRef = useRef(null);
  const typingTimerRef = useRef(null);
  const emittedTypingRef = useRef(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const otherName = useMemo(() => {
    if (!active?.participants || !user?._id) return "Conversation";
    const others = active.participants.filter((p) => p._id !== user._id);
    return active.isSupport ? "Support" : (others[0]?.name || "Conversation");
  }, [active, user?._id]);

  const formatTime = (ts) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  // Listen for open chat requests via window.postMessage
  useEffect(() => {
    if (!isBuyer) return;
    const handler = (e) => {
      const { type, payload } = e.data || {};
      if (type === "OPEN_SUPPORT_CHAT") {
        setOpen(true);
        setPendingTarget({ support: true });
      } else if (type === "OPEN_DIRECT_CHAT" && payload?.sellerId) {
        setOpen(true);
        setPendingTarget({ sellerId: payload.sellerId, productId: payload.productId || null });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [isBuyer]);

  // Connect socket when widget opens
  useEffect(() => {
    if (!isBuyer || !open) return;
    const socket = io(getSocketUrl(), { transports: ["websocket"], withCredentials: true });
    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isBuyer, open]);

  // Load chats when opening, and handle pending target creation
  useEffect(() => {
    const init = async () => {
      if (!isBuyer || !open) return;
      try {
        const res = await api.get("/chat");
        setChats(res.data || []);
      } catch {}

      if (pendingTarget) {
        try {
          let created;
          if (pendingTarget.support) {
            ({ data: created } = await api.post("/chat/support"));
          } else if (pendingTarget.sellerId) {
            ({ data: created } = await api.post("/chat/create-or-get", {
              participantId: pendingTarget.sellerId,
              productId: pendingTarget.productId || undefined,
            }));
          }
          if (created?._id) setActive(created);
        } finally {
          setPendingTarget(null);
        }
      }
    };
    init();
  }, [isBuyer, open, pendingTarget]);

  // Join room and load messages when active chat changes
  useEffect(() => {
    if (!active?._id || !open || !isBuyer) return;
    const socket = socketRef.current;
    let unsub;
    const joinAndLoad = async () => {
      socket?.emit("join_chat", { chatId: active._id });
      try {
        const msgs = await api.get(`/chat/${active._id}/messages?limit=50`);
        setMessages(msgs.data.messages || []);
        setNextCursor(msgs.data.nextCursor || null);
      } catch {
        setMessages([]);
        setNextCursor(null);
      }
      try { await api.post(`/chat/${active._id}/read`); } catch {}
      const onNew = (evt) => {
        if (evt.chatId === active._id) {
          const msg = evt.message;
          setMessages((m) => (m.some((x) => x?._id === msg?._id) ? m : [...m, msg]));
          // optimistically mark as read when viewing
          try { api.post(`/chat/${active._id}/read`); } catch {}
        }
      };
      const onTyping = (evt) => {
        if (evt.chatId === active._id) {
          setIsOtherTyping(!!evt.isTyping);
          if (evt.isTyping) {
            // safety auto-clear after 3s
            clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
          }
        }
      };
      const onRead = (evt) => {
        if (evt.chatId === active._id && evt.userId !== user?._id) {
          // Mark my sent messages as READ locally
          setMessages((m) => m.map((msg) => (msg.sender === user?._id ? { ...msg, status: "READ", readBy: [...(msg.readBy || []), evt.userId] } : msg)));
        }
      };
      socket?.on("new_message", onNew);
      socket?.on("typing", onTyping);
      socket?.on("read_receipt", onRead);
      unsub = () => {
        socket?.emit("leave_chat", { chatId: active._id });
        socket?.off("new_message", onNew);
        socket?.off("typing", onTyping);
        socket?.off("read_receipt", onRead);
        setIsOtherTyping(false);
      };
    };
    joinAndLoad();
    return () => { unsub && unsub(); };
  }, [active?._id, open, isBuyer]);

  // Auto-scroll to bottom on message changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length]);

  // Emit typing with debounce while user types
  useEffect(() => {
    if (!active?._id) return;
    if (!socketRef.current) return;
    const handler = () => {
      if (!emittedTypingRef.current) {
        emittedTypingRef.current = true;
        socketRef.current.emit("typing", { chatId: active._id, isTyping: true });
      }
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        emittedTypingRef.current = false;
        socketRef.current.emit("typing", { chatId: active._id, isTyping: false });
      }, 1200);
    };
    // Attach to input changes via a custom event
    const el = textareaRef.current;
    if (!el) return;
    const onInput = () => handler();
    el.addEventListener("input", onInput);
    return () => el && el.removeEventListener("input", onInput);
  }, [active?._id, open]);

  const onSend = async (e) => {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || !active?._id) return;
    try {
  const { data } = await api.post(`/chat/${active._id}/messages`, { content: text });
  setMessages((m) => (m.some((x) => x?._id === data?._id) ? m : [...m, data]));
      setInput("");
      setShowEmoji(false);
      // refresh chat list silently
      try {
        const res = await api.get("/chat");
        setChats(res.data || []);
      } catch {}
    } catch {}
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const emojis = useMemo(
    () => [
      "😀","😃","😄","😁","😆","😅","😂","😊","🙂","😉","😍","😘","🤔","🤗","😎","😇","🙃","😭","👍","👎","🙏","🔥","🎉","❤️","💯","🐔","🛒"
    ],
    []
  );

  const insertEmoji = (emoji) => {
    const el = textareaRef.current;
    if (!el) {
      setInput((v) => v + emoji);
      return;
    }
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    const next = input.slice(0, start) + emoji + input.slice(end);
    setInput(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const onPickImage = () => fileInputRef.current?.click();

  const onSelectFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset for subsequent picks
    if (!file || !active?._id) return;
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await api.post("/upload/image", form, { headers: { "Content-Type": "multipart/form-data" } });
      const url = res.data?.url;
      if (!url) return;
      const payload = {
        content: input.trim() || "",
        attachments: [
          { url, type: "image", name: file.name, size: file.size },
        ],
      };
      setInput("");
      const { data } = await api.post(`/chat/${active._id}/messages`, payload);
      setMessages((m) => (m.some((x) => x?._id === data?._id) ? m : [...m, data]));
  // keep user flow smooth
  requestAnimationFrame(() => textareaRef.current?.focus());
    } catch {}
  };

  const onListScroll = async (e) => {
    if (!nextCursor || isLoadingMore) return;
    const target = e.currentTarget;
    if (target.scrollTop <= 16) {
      try {
        setIsLoadingMore(true);
        const prevHeight = target.scrollHeight;
        const { data } = await api.get(`/chat/${active._id}/messages?limit=50&cursor=${nextCursor}`);
        const older = data.messages || [];
        if (older.length > 0) {
          setMessages((m) => [...older, ...m]);
          setNextCursor(data.nextCursor || null);
          // maintain scroll position
          requestAnimationFrame(() => {
            const newHeight = target.scrollHeight;
            target.scrollTop = newHeight - prevHeight;
          });
        } else {
          setNextCursor(null);
        }
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  const renderWithDateSeparators = (msgs) => {
    const items = [];
    let lastDay = "";
    for (const m of msgs) {
      const day = m.createdAt ? new Date(m.createdAt).toDateString() : "";
      if (day && day !== lastDay) {
        lastDay = day;
        const labelDate = new Date(m.createdAt);
        const today = new Date();
        const yday = new Date();
        yday.setDate(today.getDate() - 1);
        let label = labelDate.toLocaleDateString();
        if (labelDate.toDateString() === today.toDateString()) label = "Today";
        else if (labelDate.toDateString() === yday.toDateString()) label = "Yesterday";
        items.push(
          <div key={`sep-${day}`} className="text-[10px] text-gray-500 text-center my-2">{label}</div>
        );
      }
      items.push(
        <div
          key={m._id}
          className={`text-sm max-w-[85%] ${m.sender === user._id ? "ml-auto bg-orange-100" : "mr-auto bg-white"} px-3 py-2 rounded-xl shadow-sm`}
        >
          {m.attachments && m.attachments.length > 0 && (
            <div className="flex flex-col gap-2 mb-1">
              {m.attachments.map((att, idx) => (
                att.type === "image" ? (
                  <a key={idx} href={att.url} target="_blank" rel="noreferrer">
                    <img src={att.url} alt={att.name || "image"} className="max-w-[260px] max-h-[200px] rounded-md border" />
                  </a>
                ) : (
                  <a key={idx} href={att.url} className="text-blue-600 underline" target="_blank" rel="noreferrer">{att.name || "Attachment"}</a>
                )
              ))}
            </div>
          )}
          {m.content && <div>{m.content}</div>}
          {m.createdAt && (
            <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-2 justify-end">
              <span>{formatTime(m.createdAt)}</span>
              {m.sender === user._id && (
                <span className="text-[10px] text-gray-400">{m.status === "READ" ? "Seen" : "Sent"}</span>
              )}
            </div>
          )}
        </div>
      );
    }
    return items;
  };

  // Auto-resize textarea and auto-scroll when images load
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(120, el.scrollHeight) + "px";
    }
  }, [input]);

  useEffect(() => {
    const wrap = listRef.current;
    if (!wrap) return;
    const imgs = wrap.querySelectorAll("img");
    const onLoad = () => {
      wrap.scrollTo({ top: wrap.scrollHeight });
    };
    imgs.forEach((img) => img.addEventListener("load", onLoad));
    return () => imgs.forEach((img) => img.removeEventListener("load", onLoad));
  }, [messages]);

  if (!isBuyer) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 rounded-full bg-orange-500 text-white w-14 h-14 shadow-lg z-[1000]"
          title="Chat with support or sellers"
          aria-label="Open chat"
        >
          💬
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[90vw] h-[60vh] bg-white border rounded-xl shadow-xl flex flex-col overflow-hidden z-[1000]">
          <div className="p-3 border-b flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
            <div className="flex items-center gap-3">
              {active && (
                <button onClick={() => { setActive(null); setMessages([]); }} className="text-xs px-2 py-1 border rounded-md hover:bg-gray-50">Back</button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 text-xs">{(active?.isSupport ? "S" : (otherName?.[0] || "C")).toUpperCase()}</div>
                <div>
                  <div className="font-semibold text-sm leading-tight">{active ? otherName : "Messages"}</div>
                  {active?.isSupport && <div className="text-[10px] text-orange-600">Support</div>}
                </div>
              </div>
            </div>
            <button onClick={() => { setOpen(false); setActive(null); }} aria-label="Close" className="text-gray-500 hover:text-gray-700">✕</button>
          </div>

          {!active ? (
            <div className="flex-1 overflow-auto p-3 space-y-3 bg-gray-50">
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    try {
                      const { data } = await api.post("/chat/support");
                      setActive(data);
                      const res = await api.get("/chat");
                      setChats(res.data || []);
                    } catch {}
                  }}
                  className="w-full text-left px-3 py-2 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-sm hover:bg-blue-100 flex items-center gap-2"
                >
                  <span>💬</span>
                  Contact Support
                </button>
              </div>

              <div className="pt-2 border-t">
                <div className="text-xs font-semibold text-gray-500 mb-2">Recent</div>
                <div className="divide-y rounded-md bg-white border">
                  {chats.filter(c => !c.isSupport).length === 0 && (
                    <div className="p-2 text-sm text-gray-500">No conversations yet.</div>
                  )}
                  {chats.filter(c => !c.isSupport).map((c) => {
                    const others = (c.participants || []).filter((p) => p._id !== user?._id);
                    const label = others[0]?.name || "Conversation";
                    return (
                      <button key={c._id} onClick={() => setActive(c)} className={`w-full text-left p-3 hover:bg-orange-50 ${active?._id === c._id ? "bg-orange-50" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-medium flex items-center gap-2">
                              {label}
                            </div>
                            <div className="text-xs text-gray-500 line-clamp-1">{(c.lastMessage || "Start chatting").substring(0, 50)}{(c.lastMessage || "").length > 50 ? "..." : ""}</div>
                          </div>
                          <div className="text-[10px] text-gray-400 whitespace-nowrap">{formatTime(c.lastMessageAt || c.updatedAt || c.createdAt)}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div ref={listRef} onScroll={onListScroll} className="flex-1 overflow-auto p-3 space-y-2 bg-gray-50">
                {isLoadingMore && (
                  <div className="text-[10px] text-gray-400 text-center">Loading…</div>
                )}
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-500">Start the conversation…</p>
                ) : (
                  renderWithDateSeparators(messages)
                )}
                {isOtherTyping && (
                  <div className="text-xs text-gray-500 italic">Typing…</div>
                )}
              </div>
              <div className="p-3 border-t bg-white">
                <form onSubmit={onSend} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none min-h-[38px]"
                      placeholder="Type a message…"
                      style={{ maxHeight: 120, overflow: "auto" }}
                    />
                    {showEmoji && (
                      <div className="absolute bottom-full mb-2 left-0 z-10 w-56 max-h-40 overflow-auto rounded-md border bg-white shadow-lg p-2 grid grid-cols-8 gap-1">
                        {emojis.map((em) => (
                          <button key={em} type="button" className="hover:bg-orange-50 rounded text-lg" onClick={() => insertEmoji(em)}>
                            {em}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onSelectFile} />
                  <button type="button" onClick={onPickImage} className="px-3 py-2 border rounded-md hover:bg-gray-50 text-sm h-[38px] flex items-center justify-center" title="Image">🖼️</button>
                  <button type="button" onClick={() => setShowEmoji((s) => !s)} className="px-3 py-2 border rounded-md hover:bg-gray-50 text-sm h-[38px] flex items-center justify-center" title="Emoji">😊</button>
                  <button className="px-3 py-2 bg-orange-500 text-white rounded-md text-sm hover:bg-orange-600 h-[38px] flex items-center justify-center">Send</button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );

};

export default BuyerChatWidget;
