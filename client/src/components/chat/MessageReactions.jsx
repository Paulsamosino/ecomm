import React, { useState, useRef, useEffect } from "react";
import { Smile, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const COMMON_EMOJIS = [
  { emoji: "👍", name: "thumbs up" },
  { emoji: "👎", name: "thumbs down" },
  { emoji: "❤️", name: "heart" },
  { emoji: "😂", name: "laughing" },
  { emoji: "😢", name: "crying" },
  { emoji: "😮", name: "surprised" },
  { emoji: "😡", name: "angry" },
  { emoji: "🔥", name: "fire" },
  { emoji: "💯", name: "hundred" },
  { emoji: "🎉", name: "party" },
  { emoji: "✅", name: "check" },
  { emoji: "❌", name: "cross" },
  { emoji: "🤔", name: "thinking" },
  { emoji: "😍", name: "heart eyes" },
  { emoji: "👏", name: "clapping" },
  { emoji: "🙏", name: "pray" },
];

const MessageReactions = ({
  reactions = [],
  currentUserId,
  onAddReaction,
  onRemoveReaction,
  disabled = false,
  size = "sm",
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((groups, reaction) => {
    const emoji = reaction.emoji;
    if (!groups[emoji]) {
      groups[emoji] = [];
    }
    groups[emoji].push(reaction);
    return groups;
  }, {});

  const handleEmojiSelect = (emoji) => {
    const existingReaction = reactions.find(
      (r) => r.userId === currentUserId && r.emoji === emoji
    );

    if (existingReaction) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleReactionClick = (emoji) => {
    const existingReaction = reactions.find(
      (r) => r.userId === currentUserId && r.emoji === emoji
    );

    if (existingReaction) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
  };

  const getReactionTooltip = (reactionGroup) => {
    const names = reactionGroup
      .map((r) => r.user?.name || "Unknown")
      .join(", ");
    const count = reactionGroup.length;

    if (count === 1) {
      return names;
    } else if (count <= 3) {
      return names;
    } else {
      const firstTwo = reactionGroup
        .slice(0, 2)
        .map((r) => r.user?.name || "Unknown")
        .join(", ");
      return `${firstTwo} and ${count - 2} others`;
    }
  };

  const isCurrentUserReacted = (reactionGroup) => {
    return reactionGroup.some((r) => r.userId === currentUserId);
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Existing reactions */}
      {Object.entries(groupedReactions).map(([emoji, reactionGroup]) => (
        <TooltipProvider key={emoji}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={size}
                className={`
                  h-6 px-2 py-1 text-xs rounded-full transition-colors
                  ${
                    isCurrentUserReacted(reactionGroup)
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "bg-gray-100 hover:bg-gray-200"
                  }
                  ${
                    disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }
                `}
                onClick={() => !disabled && handleReactionClick(emoji)}
                disabled={disabled}
              >
                <span className="mr-1">{emoji}</span>
                <span className="font-medium">{reactionGroup.length}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">{getReactionTooltip(reactionGroup)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}

      {/* Add reaction button */}
      {!disabled && (
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size={size}
              className="h-6 w-6 p-0 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Smile className="w-3 h-3 text-gray-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" side="top">
            <div className="grid grid-cols-8 gap-1">
              {COMMON_EMOJIS.map(({ emoji, name }) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded text-lg"
                  onClick={() => handleEmojiSelect(emoji)}
                  title={name}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default MessageReactions;
