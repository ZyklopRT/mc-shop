"use client";

import { useState } from "react";
import { sendMessageToPlayer } from "../../server/actions/rcon-actions";
import { checkPlayerOnline } from "../../server/actions/rcon-actions";

export default function TestRconPage() {
  const [playerName, setPlayerName] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const [checkPlayerName, setCheckPlayerName] = useState("");
  const [isCheckLoading, setIsCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName.trim() || !message.trim()) {
      setResult("Please fill in both player name and message");
      return;
    }

    setIsLoading(true);
    setResult("");

    try {
      const response = await sendMessageToPlayer({
        playerName: playerName.trim(),
        message: message.trim(),
      });

      if (response.success) {
        setResult(
          `✅ Message sent successfully! Response: ${response.response ?? "No response"}`,
        );
      } else {
        setResult(`❌ Failed to send message: ${response.error}`);
      }
    } catch (error) {
      setResult(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckPlayer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkPlayerName.trim()) {
      setCheckResult("Please enter a player name");
      return;
    }

    setIsCheckLoading(true);
    setCheckResult("");

    try {
      const response = await checkPlayerOnline({
        playerName: checkPlayerName.trim(),
      });

      if (response.success) {
        const onlineStatus = response.isOnline ? "🟢 ONLINE" : "🔴 OFFLINE";
        setCheckResult(
          `${onlineStatus} - Player "${checkPlayerName}" is ${response.isOnline ? "online" : "offline"}\n\nServer response: ${response.response ?? "No response"}`,
        );
      } else {
        setCheckResult(`❌ Failed to check player status: ${response.error}`);
      }
    } catch (error) {
      setCheckResult(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsCheckLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h1 className="mb-6 text-2xl font-bold text-gray-800">
            Test RCON Connection
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="playerName"
                className="text-foreground mb-1 block text-sm font-medium"
              >
                Player Name
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter player name"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="text-foreground mb-1 block text-sm font-medium"
              >
                Message
              </label>
              <input
                type="text"
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter message to send"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send Message"}
            </button>
          </form>

          {result && (
            <div className="mt-6 rounded-md border bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-medium text-gray-800">
                Result:
              </h3>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {result}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-6 text-xl font-bold text-gray-800">
            Check Player Online Status
          </h2>

          <form onSubmit={handleCheckPlayer} className="space-y-4">
            <div>
              <label
                htmlFor="checkPlayerName"
                className="text-foreground mb-1 block text-sm font-medium"
              >
                Player Name to Check
              </label>
              <input
                type="text"
                id="checkPlayerName"
                value={checkPlayerName}
                onChange={(e) => setCheckPlayerName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="Enter player name to check"
                disabled={isCheckLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isCheckLoading}
              className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCheckLoading ? "Checking..." : "Check Player Status"}
            </button>
          </form>

          {checkResult && (
            <div className="mt-6 rounded-md border bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-medium text-gray-800">
                Status Check Result:
              </h3>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {checkResult}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="text-xs text-gray-500">
            <h3 className="mb-2 font-medium">Environment Configuration:</h3>
            <p>
              MINECRAFT_RCON_HOST:{" "}
              {process.env.NEXT_PUBLIC_RCON_HOST ?? "Not set"}
            </p>
            <p>
              MINECRAFT_RCON_PORT:{" "}
              {process.env.NEXT_PUBLIC_RCON_PORT ?? "Not set"}
            </p>
            <p>
              MINECRAFT_RCON_PASSWORD:{" "}
              {process.env.NEXT_PUBLIC_RCON_PASSWORD ? "Set" : "Not set"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
