import React, { useState, useRef, useEffect } from "react";
import { Edit2, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MessageEditor = ({
  message,
  currentUserId,
  onEdit,
  onDelete,
  disabled = false,
  showEditButton = true,
  showDeleteButton = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef(null);

  const canEdit = message.senderId === currentUserId && !message.isDeleted;
  const canDelete = message.senderId === currentUserId && !message.isDeleted;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Set cursor at end
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (!canEdit || disabled) return;
    setEditContent(message.content || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content || "");
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent === message.content) {
      handleCancelEdit();
      return;
    }

    setIsSaving(true);
    try {
      await onEdit(message._id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Error editing message:", error);
    } finally {
      setIsSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!canDelete || disabled) return;

    if (
      window.confirm(
        "Are you sure you want to delete this message? This action cannot be undone."
      )
    ) {
      try {
        await onDelete(message._id);
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[60px] resize-none"
          placeholder="Edit your message..."
          disabled={isSaving}
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSaveEdit}
            disabled={
              isSaving || !editContent.trim() || editContent === message.content
            }
            className="h-7"
          >
            <Check className="w-3 h-3 mr-1" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancelEdit}
            disabled={isSaving}
            className="h-7"
          >
            <X className="w-3 h-3 mr-1" />
            Cancel
          </Button>
        </div>
        <div className="text-xs text-gray-500">
          Press Enter to save, Escape to cancel
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {/* Edit button */}
      {showEditButton && canEdit && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleStartEdit}
                disabled={disabled}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit message</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}{" "}
      {/* Delete button */}
      {showDeleteButton && canDelete && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={disabled}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete message</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default MessageEditor;
