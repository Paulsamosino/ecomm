import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Bell,
  MessageSquare,
  FileText,
  Heart,
  Edit,
  Trash2,
} from "lucide-react";
import { socketService } from "@/services/socket";

const ChatNotificationService = ({ user, isConnected }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!isConnected || !user) return;

    // Set up notification handlers
    const handleNewMessage = (data) => {
      const { message, chatId } = data;

      // Don't show notification for own messages
      if (message.senderId === user._id) return;

      // Show toast notification
      toast(
        (t) => (
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <div>
              <div className="font-medium">
                {message.sender?.name || "Unknown"}
              </div>
              <div className="text-sm text-gray-600">
                {message.type === "file" ? (
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    Sent a file
                  </div>
                ) : message.content.length > 50 ? (
                  message.content.substring(0, 50) + "..."
                ) : (
                  message.content
                )}
              </div>
            </div>
          </div>
        ),
        {
          duration: 4000,
          position: "top-right",
        }
      );

      // Play notification sound (if enabled)
      playNotificationSound();
    };

    const handleMessageEdited = (data) => {
      const { messageId, newContent } = data;

      toast(
        (t) => (
          <div className="flex items-center space-x-3">
            <Edit className="w-5 h-5 text-orange-500" />
            <div>
              <div className="font-medium">Message edited</div>
              <div className="text-sm text-gray-600">
                {newContent.length > 50
                  ? newContent.substring(0, 50) + "..."
                  : newContent}
              </div>
            </div>
          </div>
        ),
        {
          duration: 3000,
          position: "top-right",
        }
      );
    };

    const handleMessageDeleted = (data) => {
      toast(
        (t) => (
          <div className="flex items-center space-x-3">
            <Trash2 className="w-5 h-5 text-red-500" />
            <div>
              <div className="font-medium">Message deleted</div>
              <div className="text-sm text-gray-600">A message was deleted</div>
            </div>
          </div>
        ),
        {
          duration: 3000,
          position: "top-right",
        }
      );
    };

    const handleReactionAdded = (data) => {
      const { reaction, messageId } = data;

      // Don't show notification for own reactions
      if (reaction.userId === user._id) return;

      toast(
        (t) => (
          <div className="flex items-center space-x-3">
            <Heart className="w-5 h-5 text-pink-500" />
            <div>
              <div className="font-medium">
                {reaction.user?.name || "Someone"}
              </div>
              <div className="text-sm text-gray-600">
                Reacted with {reaction.emoji}
              </div>
            </div>
          </div>
        ),
        {
          duration: 2000,
          position: "top-right",
        }
      );
    };

    const handleFileUploadProgress = (data) => {
      const { userId, fileName, progress } = data;

      // Don't show for own uploads
      if (userId === user._id) return;

      // Show upload progress for other users
      if (progress < 100) {
        toast.loading(`${fileName} - ${progress}%`, {
          id: `upload-${userId}-${fileName}`,
          position: "bottom-right",
        });
      } else {
        toast.success(`${fileName} uploaded`, {
          id: `upload-${userId}-${fileName}`,
          position: "bottom-right",
        });
      }
    };

    const handleChatBlocked = (data) => {
      toast.error("Chat has been blocked", {
        duration: 4000,
        position: "top-center",
      });
    };

    const handleChatBlockedByOther = (data) => {
      toast(
        (t) => (
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-red-500" />
            <div>
              <div className="font-medium">Chat Blocked</div>
              <div className="text-sm text-gray-600">
                The other participant has blocked this chat
              </div>
            </div>
          </div>
        ),
        {
          duration: 5000,
          position: "top-center",
        }
      );
    };

    const handleUserStatus = (data) => {
      const { userId, status } = data;

      // Don't show notification for own status changes
      if (userId === user._id) return;

      // Only show notifications for important status changes
      if (status === "online") {
        // Could show "User came online" but might be too noisy
        // toast.success(`${userId} came online`, { duration: 1000 });
      }
    };

    // Register socket event listeners
    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageEdited(handleMessageEdited);
    socketService.onMessageDeleted(handleMessageDeleted);
    socketService.onReactionAdded(handleReactionAdded);
    socketService.onFileUploadProgress(handleFileUploadProgress);
    socketService.onChatBlocked(handleChatBlocked);
    socketService.onChatBlockedByOther(handleChatBlockedByOther);
    socketService.on("user_status", handleUserStatus);

    // Cleanup function
    return () => {
      socketService.off("new_message", handleNewMessage);
      socketService.off("message_edited", handleMessageEdited);
      socketService.off("message_deleted", handleMessageDeleted);
      socketService.off("reaction_added", handleReactionAdded);
      socketService.off("file_upload_progress", handleFileUploadProgress);
      socketService.off("chat_blocked", handleChatBlocked);
      socketService.off("chat_blocked_by_other", handleChatBlockedByOther);
      socketService.off("user_status", handleUserStatus);
    };
  }, [isConnected, user]);

  const playNotificationSound = () => {
    // Check if notifications are enabled and user hasn't muted
    const notificationSettings = JSON.parse(
      localStorage.getItem("chatNotificationSettings") ||
        '{"sound": true, "desktop": true}'
    );

    if (notificationSettings.sound) {
      // Create and play notification sound
      const audio = new Audio("/notification-sound.mp3");
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Fail silently if audio can't be played
      });
    }

    // Show desktop notification if enabled and permission granted
    if (
      notificationSettings.desktop &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      // Desktop notifications could be implemented here
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default ChatNotificationService;
