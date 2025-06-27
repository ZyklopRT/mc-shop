"use client";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { User } from "lucide-react";

interface UserAvatarProps {
  username?: string | null;
  size?: "sm" | "md" | "lg";
  showUsername?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function UserAvatar({
  username,
  size = "md",
  showUsername = false,
  className = "",
  children,
}: UserAvatarProps) {
  const getAvatarUrl = (mcUsername: string) => {
    // Use Minecraft avatar service
    return `https://mc-heads.net/avatar/${mcUsername}/32`;
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "h-6 w-6";
      case "lg":
        return "h-10 w-10";
      case "md":
      default:
        return "h-8 w-8";
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "sm":
        return "text-xs";
      case "lg":
        return "text-base";
      case "md":
      default:
        return "text-sm";
    }
  };

  if (showUsername) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Avatar className={getSizeClass()}>
          {username && (
            <AvatarImage
              src={getAvatarUrl(username)}
              alt={`${username}'s avatar`}
            />
          )}
          <AvatarFallback className="bg-muted">
            {username ? (
              <span className="text-xs font-medium">
                {getInitials(username)}
              </span>
            ) : (
              <User className="h-3 w-3" />
            )}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className={`font-medium ${getTextSize()}`}>
            {username ?? "Unknown User"}
          </span>
          {children}
        </div>
      </div>
    );
  }

  return (
    <Avatar className={`${getSizeClass()} ${className}`}>
      {username && (
        <AvatarImage
          src={getAvatarUrl(username)}
          alt={`${username}'s avatar`}
        />
      )}
      <AvatarFallback className="bg-muted">
        {username ? (
          <span className="text-xs font-medium">{getInitials(username)}</span>
        ) : (
          <User className="h-3 w-3" />
        )}
      </AvatarFallback>
      <div className="flex flex-col">{children}</div>
    </Avatar>
  );
}
