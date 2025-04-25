import { socketService } from "./socket";
import { create } from "zustand";

const useChatNotificationStore = create((set) => ({
  unreadCount: 0,
  chatNotifications: [],
  setUnreadCount: (count) => set({ unreadCount: count }),
  addChatNotification: (notification) =>
    set((state) => ({
      chatNotifications: [notification, ...state.chatNotifications].slice(0, 5),
    })),
  clearChatNotifications: () => set({ chatNotifications: [] }),
}));

export const chatNotificationService = {
  initialize: (token, userId) => {
    if (!token) return;

    socketService.connect(token);

    // Handle new messages
    socketService.onNewMessage((data) => {
      // Only count messages from sellers to this buyer
      if (data.message.senderId !== userId) {
        useChatNotificationStore.setState((state) => ({
          unreadCount: state.unreadCount + 1,
        }));

        // Add to notifications
        useChatNotificationStore.getState().addChatNotification({
          id: data.message._id,
          senderId: data.message.senderId,
          senderName: data.message.sender?.name || "Seller",
          content:
            data.message.content || (data.message.image ? "Sent an image" : ""),
          chatId: data.chatId,
          createdAt: data.message.createdAt,
        });

        // Could play a notification sound here
        try {
          const audio = new Audio("/notification.mp3");
          audio.volume = 0.5;
          audio.play().catch((e) => console.log("Auto-play prevented:", e));
        } catch (e) {
          console.log("Notification sound error:", e);
        }
      }
    });
  },

  resetUnreadCount: () => {
    useChatNotificationStore.setState({ unreadCount: 0 });
  },

  getUnreadCount: () => {
    return useChatNotificationStore.getState().unreadCount;
  },

  getChatNotifications: () => {
    return useChatNotificationStore.getState().chatNotifications;
  },

  clearNotifications: () => {
    useChatNotificationStore.getState().clearChatNotifications();
  },

  disconnect: () => {
    socketService.disconnect();
  },
};

export { useChatNotificationStore };
