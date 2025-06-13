import React, { useState } from "react";
import { format } from "date-fns";
import {
  Download,
  FileText,
  Image,
  Music,
  Video,
  Eye,
  Reply,
  MoreVertical,
  CheckCheck,
  Check,
  Edit2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import MessageReactions from "./MessageReactions";
import MessageEditor from "./MessageEditor";

const MESSAGE_STATUS = {
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  READ: "READ",
};

const EnhancedMessage = ({
  message,
  currentUserId,
  isOwn,
  showSender = true,
  onEdit,
  onDelete,
  onAddReaction,
  onRemoveReaction,
  onReply,
  onDownloadFile,
  disabled = false,
}) => {
  const [showFullImage, setShowFullImage] = useState(false);

  const getFileIcon = (type) => {
    switch (type) {
      case "image":
        return <Image className="w-4 h-4" />;
      case "document":
        return <FileText className="w-4 h-4" />;
      case "audio":
        return <Music className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = () => {
    if (!isOwn) return null;

    switch (message.status) {
      case MESSAGE_STATUS.SENT:
        return <Check className="w-3 h-3 text-gray-400" />;
      case MESSAGE_STATUS.DELIVERED:
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case MESSAGE_STATUS.READ:
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const renderAttachment = (attachment) => {
    const { type, url, filename, size, mimeType } = attachment;

    switch (type) {
      case "image":
        return (
          <div className="relative max-w-xs">
            <img
              src={url}
              alt={filename}
              className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setShowFullImage(true)}
              style={{ maxHeight: "200px", width: "auto" }}
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 h-6 w-6 p-0 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
              onClick={(e) => {
                e.stopPropagation();
                onDownloadFile?.(attachment);
              }}
            >
              <Download className="w-3 h-3" />
            </Button>
          </div>
        );

      case "video":
        return (
          <div className="relative max-w-xs">
            <video
              controls
              className="rounded-lg"
              style={{ maxHeight: "200px", width: "auto" }}
            >
              <source src={url} type={mimeType} />
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case "audio":
        return (
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg max-w-xs">
            <Music className="w-5 h-5 text-blue-500" />
            <div className="flex-1 min-w-0">
              <audio controls className="w-full">
                <source src={url} type={mimeType} />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        );

      default:
        return (
          <div
            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg max-w-xs hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => onDownloadFile?.(attachment)}
          >
            {getFileIcon(type)}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {filename}
              </div>
              <div className="text-xs text-gray-500">
                {formatFileSize(size)}
              </div>
            </div>
            <Download className="w-4 h-4 text-gray-400" />
          </div>
        );
    }
  };

  const renderReplyToMessage = () => {
    if (!message.replyTo) return null;

    return (
      <div className="mb-2 pl-3 border-l-2 border-gray-300 bg-gray-50 rounded p-2">
        <div className="text-xs text-gray-500 mb-1">
          Replying to {message.replyTo.sender?.name || "Unknown"}
        </div>
        <div className="text-sm text-gray-700 truncate">
          {message.replyTo.content}
        </div>
      </div>
    );
  };

  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
        <div className="max-w-xs lg:max-w-md">
          <div
            className={`
            p-3 rounded-lg border border-gray-200 bg-gray-50
            ${isOwn ? "rounded-br-sm" : "rounded-bl-sm"}
          `}
          >
            <div className="text-sm text-gray-500 italic">
              This message was deleted
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">
                {format(new Date(message.createdAt), "HH:mm")}
              </span>
              {getStatusIcon()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4 group`}
    >
      <div className="max-w-xs lg:max-w-md">
        {/* Sender info */}
        {showSender && !isOwn && (
          <div className="flex items-center mb-1">
            <Avatar className="w-6 h-6 mr-2">
              <AvatarImage src={message.sender?.avatar} />
              <AvatarFallback className="text-xs">
                {message.sender?.name?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-600 font-medium">
              {message.sender?.name || "Unknown"}
            </span>
          </div>
        )}

        {/* Message content */}
        <div
          className={`
          relative p-3 rounded-lg
          ${
            isOwn
              ? "bg-blue-500 text-white rounded-br-sm"
              : "bg-gray-100 text-gray-900 rounded-bl-sm"
          }
          ${
            message.type === "system"
              ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
              : ""
          }
        `}
        >
          {/* Reply reference */}
          {renderReplyToMessage()}

          {/* Message content */}
          {message.content && (
            <MessageEditor
              message={message}
              currentUserId={currentUserId}
              onEdit={onEdit}
              onDelete={onDelete}
              disabled={disabled}
            />
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, index) => (
                <div key={index}>{renderAttachment(attachment)}</div>
              ))}
            </div>
          )}

          {/* Message footer */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <span
                className={`text-xs ${
                  isOwn ? "text-blue-100" : "text-gray-500"
                }`}
              >
                {format(new Date(message.createdAt), "HH:mm")}
                {message.isEdited && (
                  <span className="ml-1 italic">(edited)</span>
                )}
              </span>
            </div>

            <div className="flex items-center space-x-1">
              {getStatusIcon()}

              {/* Message actions */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-6 w-6 p-0 ${
                        isOwn
                          ? "text-blue-100 hover:text-white"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onReply?.(message)}>
                      <Reply className="w-4 h-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                    {message.senderId === currentUserId && (
                      <>
                        <DropdownMenuItem
                          onClick={() => onEdit?.(message._id, message.content)}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete?.(message._id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Reactions */}
        {(message.reactions?.length > 0 || !disabled) && (
          <div className="mt-1">
            <MessageReactions
              reactions={message.reactions || []}
              currentUserId={currentUserId}
              onAddReaction={(emoji) => onAddReaction?.(message._id, emoji)}
              onRemoveReaction={(emoji) =>
                onRemoveReaction?.(message._id, emoji)
              }
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMessage;
