import { useState, useEffect, useCallback } from "react";
import { getMessages, sendMessage as sendMessageAPI, Message } from "@/lib/chat";

interface UseMessagesOptions {
  connectionId: number;
}

interface UseMessagesReturn {
  messages: Message[];
  sendMessage: (content: string) => Promise<Message>;
  loading: boolean;
  error: string | null;
}

export function useMessages({ connectionId }: UseMessagesOptions): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!connectionId || connectionId <= 0) {
      setError("Valid connection ID is required");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const initialMessages = await getMessages(connectionId);
      setMessages(initialMessages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load messages";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!connectionId || connectionId <= 0) return;

    const interval = window.setInterval(() => {
      loadMessages();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [connectionId, loadMessages]);

  const sendMessage = useCallback(
    async (content: string): Promise<Message> => {
      if (!connectionId || connectionId <= 0) {
        throw new Error("Valid connection ID is required");
      }

      if (!content?.trim()) {
        throw new Error("Message content is required");
      }

      const newMessage = await sendMessageAPI(connectionId, content);
      setMessages((prevMessages) => {
        const exists = prevMessages.some((msg) => msg.id === newMessage.id);
        if (exists) return prevMessages;
        return [...prevMessages, newMessage];
      });
      return newMessage;
    },
    [connectionId]
  );

  return {
    messages,
    sendMessage,
    loading,
    error,
  };
}
