"use client";

import { useState } from "react";
import { sendMessageToPlayer } from "../../server/actions/rcon-actions";

export default function TestRconPage() {
  const [playerName, setPlayerName] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");

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

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">
          Test RCON Connection
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="playerName"
              className="mb-1 block text-sm font-medium text-gray-700"
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
              className="mb-1 block text-sm font-medium text-gray-700"
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
            <h3 className="mb-2 text-sm font-medium text-gray-800">Result:</h3>
            <p className="text-sm whitespace-pre-wrap text-gray-600">
              {result}
            </p>
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500">
          <h3 className="mb-2 font-medium">Environment Variables Required:</h3>
          <ul className="space-y-1">
            <li>• MINECRAFT_RCON_HOST</li>
            <li>• MINECRAFT_RCON_PORT (default: 25575)</li>
            <li>• MINECRAFT_RCON_PASSWORD</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
