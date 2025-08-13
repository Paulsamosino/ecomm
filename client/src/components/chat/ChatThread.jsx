import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "@/api/axios";
import { io } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";

const getSocketUrl = () => (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

const ChatThread = ({ chat, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const listRef = useRef(null);
  const socketRef = useRef(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef(null);
  const typingTimerRef = useRef(null);
  const emittedTypingRef = useRef(false);
  const fileInputRef = useRef(null);
  const formatTime = (ts) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  // socket connect + join
  useEffect(() => {
    if (!chat?._id) return;
    const socket = io(getSocketUrl(), { transports: ["websocket"], withCredentials: true });
    socketRef.current = socket;
    socket.emit("join_chat", { chatId: chat._id });
    socket.on("new_message", (evt) => {
      if (evt.chatId === chat._id) {
        const msg = evt.message;
        setMessages((m) => (m.some((x) => x?._id === msg?._id) ? m : [...m, msg]));
      }
    });
    socket.on("typing", (evt) => {
      if (evt.chatId === chat._id) {
        setIsOtherTyping(!!evt.isTyping);
        if (evt.isTyping) {
          clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
        }
      }
    });
    socket.on("read_receipt", (evt) => {
      if (evt.chatId === chat._id && evt.userId !== user?._id) {
        setMessages((m) => m.map((msg) => (msg.sender === user?._id ? { ...msg, status: "READ", readBy: [...(msg.readBy || []), evt.userId] } : msg)));
      }
    });
    return () => {
      socket.emit("leave_chat", { chatId: chat._id });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [chat?._id]);

  // initial load
  useEffect(() => {
    const load = async () => {
      if (!chat?._id) return;
        const res = await api.get(`/chat/${chat._id}/messages?limit=50`);
        setMessages(res.data.messages || []);
        setNextCursor(res.data.nextCursor || null);
      // mark as read for current user
      try {
        await api.post(`/chat/${chat._id}/read`);
      } catch (e) {
        // no-op
      }
    };
    load();
  }, [chat?._id]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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

  // Emit typing debounce
  useEffect(() => {
    if (!chat?._id) return;
    const el = textareaRef.current;
    if (!el || !socketRef.current) return;
    const handler = () => {
      if (!emittedTypingRef.current) {
        emittedTypingRef.current = true;
        socketRef.current.emit("typing", { chatId: chat._id, isTyping: true });
      }
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        emittedTypingRef.current = false;
        socketRef.current.emit("typing", { chatId: chat._id, isTyping: false });
      }, 1200);
    };
    const onInput = () => handler();
    el.addEventListener("input", onInput);
    return () => el.removeEventListener("input", onInput);
  }, [chat?._id]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(e);
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

  const onListScroll = async (e) => {
    if (!nextCursor || isLoadingMore) return;
    const target = e.currentTarget;
    if (target.scrollTop <= 16) {
      try {
        setIsLoadingMore(true);
        const prevHeight = target.scrollHeight;
        const { data } = await api.get(`/chat/${chat._id}/messages?limit=50&cursor=${nextCursor}`);
        const older = data.messages || [];
        if (older.length > 0) {
          setMessages((m) => [...older, ...m]);
          setNextCursor(data.nextCursor || null);
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

  const formatDateLabel = (d) => {
    const labelDate = new Date(d);
    const today = new Date();
    const yday = new Date();
    yday.setDate(today.getDate() - 1);
    if (labelDate.toDateString() === today.toDateString()) return "Today";
    if (labelDate.toDateString() === yday.toDateString()) return "Yesterday";
    return labelDate.toLocaleDateString();
  };

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    const { data } = await api.post(`/chat/${chat._id}/messages`, { content: text });
    setMessages((m) => (m.some((x) => x?._id === data?._id) ? m : [...m, data]));
    setShowEmoji(false);
  };

  const onPickImage = () => fileInputRef.current?.click();
  const onSelectFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await api.post("/upload/image", form, { headers: { "Content-Type": "multipart/form-data" } });
      const url = res.data?.url;
      if (!url) return;
      const payload = {
        content: input.trim() || "",
        attachments: [{ url, type: "image", name: file.name, size: file.size }],
      };
      setInput("");
      const { data } = await api.post(`/chat/${chat._id}/messages`, payload);
      setMessages((m) => (m.some((x) => x?._id === data?._id) ? m : [...m, data]));
  requestAnimationFrame(() => textareaRef.current?.focus());
    } catch {}
  };

  const other = (chat.participants || []).find((p) => p._id !== user?._id);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-3 border-b flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="px-2 py-1 text-sm border rounded-md hover:bg-gray-50">Back</button>
          )}
          <div className="w-8 h-8 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center text-xs">
            {(other?.name?.[0] || "C").toUpperCase()}
          </div>
          <div className="font-medium text-sm">{other?.name || "Conversation"}</div>
        </div>
      </div>
      <div ref={listRef} onScroll={onListScroll} className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50 min-h-0">
        {isLoadingMore && <div className="text-[10px] text-gray-400 text-center">Loading…</div>}
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">Start the conversation…</p>
        ) : (
          (() => {
            const out = [];
            let lastDay = "";
            for (const m of messages) {
              const day = m.createdAt ? new Date(m.createdAt).toDateString() : "";
              if (day && day !== lastDay) {
                lastDay = day;
                out.push(
                  <div key={`sep-${day}`} className="text-[10px] text-gray-500 text-center">{formatDateLabel(m.createdAt)}</div>
                );
              }
              out.push(
                <div key={m._id} className={`text-sm max-w-[80%] ${m.sender === user?._id ? "ml-auto bg-orange-100" : "mr-auto bg-white"} px-3 py-2 rounded-xl shadow-sm`}>
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
                      {m.sender === user?._id && (
                        <span className="text-[10px] text-gray-400">{m.status === "READ" ? "Seen" : "Sent"}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            }
            return out;
          })()
        )}
        {isOtherTyping && <div className="text-xs text-gray-500 italic">Typing…</div>}
      </div>
      <div className="p-3 border-t bg-white">
        <form onSubmit={send} className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
              placeholder="Type a message"
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
          <button type="button" onClick={() => setShowEmoji((s) => !s)} className="px-2 py-2 border rounded-md hover:bg-gray-50" title="Emoji">😊</button>
          <button className="px-3 py-2 bg-orange-500 text-white rounded-md text-sm hover:bg-orange-600">Send</button>
        </form>
        <div className="mt-1 text-[10px] text-gray-400">Press Enter to send • Shift+Enter for new line</div>
      </div>
    </div>
  );
};

export default ChatThread;
