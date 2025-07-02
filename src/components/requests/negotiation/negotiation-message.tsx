"use client";

import { Badge } from "~/components/ui/badge";
import { UserAvatar } from "~/components/ui/user-avatar";
import { getMessageTypeConfig, formatDate } from "~/lib/utils/request-status";
import { CurrencyDisplay } from "../ui/currency-display";
import type { NegotiationMessageWithSender } from "~/lib/types/request";

interface NegotiationMessageProps {
  message: NegotiationMessageWithSender;
  currentUserId: string;
  requestCurrency: string;
  className?: string;
}

export function NegotiationMessage({
  message,
  currentUserId,
  requestCurrency,
  className = "",
}: NegotiationMessageProps) {
  const isCurrentUser = message.sender.id === currentUserId;
  const config = getMessageTypeConfig(message.messageType);
  const Icon = config.icon;

  return (
    <div
      className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""} ${className}`}
    >
      <UserAvatar
        username={message.sender.mcUsername}
        size="sm"
        className="flex-shrink-0"
      />

      <div
        className={`max-w-[70%] flex-1 ${isCurrentUser ? "text-right" : ""}`}
      >
        <div
          className={`rounded-lg p-3 ${
            isCurrentUser ? "bg-blue-500 text-white" : "border bg-gray-100"
          }`}
        >
          {/* Message header */}
          <div className="mb-2 flex items-center gap-2">
            <Icon
              className={`h-4 w-4 ${isCurrentUser ? "text-white" : config.color}`}
            />
            <Badge
              variant={isCurrentUser ? "secondary" : "outline"}
              className={`text-xs ${isCurrentUser ? "bg-blue-600 text-white" : ""}`}
            >
              {config.label}
            </Badge>
            <span
              className={`text-xs ${
                isCurrentUser ? "text-blue-100" : "text-gray-500"
              }`}
            >
              {formatDate(message.createdAt)}
            </span>
          </div>

          {/* Counter-offer price display */}
          {message.messageType === "COUNTER_OFFER" &&
            message.priceOffer !== null && (
              <div className="mb-2">
                <CurrencyDisplay
                  amount={message.priceOffer}
                  currency={requestCurrency}
                  className={`font-semibold ${isCurrentUser ? "text-white" : "text-gray-900"}`}
                  size="lg"
                />
              </div>
            )}

          {/* Accept message with price confirmation */}
          {message.messageType === "ACCEPT" && message.priceOffer !== null && (
            <div className="mb-2">
              <div
                className={`text-sm ${isCurrentUser ? "text-blue-100" : "text-muted-foreground"}`}
              >
                Accepting terms:
              </div>
              <CurrencyDisplay
                amount={message.priceOffer}
                currency={requestCurrency}
                className={`font-semibold ${isCurrentUser ? "text-white" : "text-green-600"}`}
              />
            </div>
          )}

          {/* Message content */}
          <div className={`${isCurrentUser ? "text-white" : "text-gray-900"}`}>
            {message.content}
          </div>
        </div>

        {/* Sender name */}
        <div
          className={`mt-1 text-xs text-gray-500 ${
            isCurrentUser ? "text-right" : "text-left"
          }`}
        >
          {isCurrentUser ? "You" : message.sender.mcUsername}
        </div>
      </div>
    </div>
  );
}

interface MessageListProps {
  messages: NegotiationMessageWithSender[];
  currentUserId: string;
  requestCurrency: string;
  className?: string;
}

export function MessageList({
  messages,
  currentUserId,
  requestCurrency,
  className = "",
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className={`py-8 text-center text-gray-500 ${className}`}>
        No messages yet. Start the conversation!
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {messages.map((message) => (
        <NegotiationMessage
          key={message.id}
          message={message}
          currentUserId={currentUserId}
          requestCurrency={requestCurrency}
        />
      ))}
    </div>
  );
}
