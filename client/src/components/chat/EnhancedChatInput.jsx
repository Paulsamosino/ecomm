import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, X, Smile, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import FileUpload from "./FileUpload";
import toast from "react-hot-toast";

const EMOJI_SHORTCUTS = [
  { emoji: "😀", shortcut: ":)" },
  { emoji: "😢", shortcut: ":(" },
  { emoji: "😂", shortcut: ":D" },
  { emoji: "😮", shortcut: ":O" },
  { emoji: "😍", shortcut: "<3" },
  { emoji: "👍", shortcut: ":+1:" },
  { emoji: "👎", shortcut: ":-1:" },
];

const QUICK_EMOJIS = [
  "😀",
  "😂",
  "😢",
  "😮",
  "😍",
  "👍",
  "👎",
  "❤️",
  "🔥",
  "💯",
];

const EnhancedChatInput = ({
  value,
  onChange,
  onSend,
  onFileSelect,
  onTyping,
  replyToMessage,
  onCancelReply,
  disabled = false,
  placeholder = "Type a message...",
  maxLength = 1000,
}) => {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const textareaRef = useRef(null);
  const fileUploadRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [value]);

  // Focus on mount
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    // Typing indicator
    if (e.key !== "Enter") {
      onTyping?.(true);

      // Clear typing indicator after 3 seconds
      clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        onTyping?.(false);
      }, 3000);
    }
  };

  const handleSend = () => {
    if (!value.trim() && attachments.length === 0) return;
    if (disabled) return;

    const messageData = {
      content: value.trim(),
      type: attachments.length > 0 ? "file" : "text",
      attachments: attachments,
      replyTo: replyToMessage?._id || null,
    };

    onSend?.(messageData);

    // Clear input and attachments
    onChange?.("");
    setAttachments([]);
    onCancelReply?.();
    onTyping?.(false);
  };

  const handleFileSelect = (fileData) => {
    setAttachments((prev) => [...prev, fileData]);
    setShowFileUpload(false);
    onFileSelect?.(fileData);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + emoji + value.substring(end);
      onChange?.(newValue);

      // Focus and set cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  // Replace emoji shortcuts in text
  const processEmojiShortcuts = (text) => {
    let processedText = text;
    EMOJI_SHORTCUTS.forEach(({ emoji, shortcut }) => {
      processedText = processedText.replace(new RegExp(shortcut, "g"), emoji);
    });
    return processedText;
  };

  const handleTextChange = (e) => {
    let newValue = e.target.value;

    // Process emoji shortcuts
    newValue = processEmojiShortcuts(newValue);

    // Enforce max length
    if (newValue.length <= maxLength) {
      onChange?.(newValue);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="border-t bg-white p-4">
      {/* Reply indicator */}
      {replyToMessage && (
        <div className="mb-3 p-2 bg-gray-50 border-l-4 border-blue-500 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">
                Replying to {replyToMessage.sender?.name || "Unknown"}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelReply}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          <div className="text-sm text-gray-700 mt-1 truncate">
            {replyToMessage.content}
          </div>
        </div>
      )}

      {/* File attachments preview */}
      {attachments.length > 0 && (
        <div className="mb-3 space-y-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded"
            >
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {attachment.type}
                </Badge>
                <span className="text-sm font-medium truncate">
                  {attachment.name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatFileSize(attachment.size)}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeAttachment(index)}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* File upload area */}
      {showFileUpload && (
        <div className="mb-3">
          <FileUpload
            onFileSelect={handleFileSelect}
            onUploadProgress={setUploadProgress}
            disabled={disabled}
          />
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end space-x-2">
        {/* File upload button */}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setShowFileUpload(!showFileUpload)}
          disabled={disabled}
          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        {/* Emoji picker */}
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" side="top">
            <div className="grid grid-cols-5 gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded text-lg"
                  onClick={() => insertEmoji(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Text input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[40px] max-h-[120px] resize-none pr-12"
            rows={1}
          />

          {/* Character count */}
          {value.length > maxLength * 0.8 && (
            <div
              className={`absolute bottom-2 right-2 text-xs ${
                value.length > maxLength ? "text-red-500" : "text-gray-400"
              }`}
            >
              {value.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={disabled || (!value.trim() && attachments.length === 0)}
          className="h-8 w-8 p-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Typing indicator */}
      <div className="mt-2 text-xs text-gray-500">
        {EMOJI_SHORTCUTS.map(({ shortcut, emoji }) => (
          <span key={shortcut} className="mr-3">
            {shortcut} = {emoji}
          </span>
        ))}
      </div>
    </div>
  );
};

export default EnhancedChatInput;
