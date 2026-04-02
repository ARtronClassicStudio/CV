import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import { MessageCircle, User, Map, Send } from "lucide-react";

export default function MessagesPage() {
  const { data: user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (user) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.profile) {
            setProfile(data.profile);
          } else {
            window.location.href = "/onboarding";
          }
        })
        .catch((err) => console.error(err));
    }
  }, [user]);

  useEffect(() => {
    // Fetch all users to show conversation list
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        const users = (data.users || []).filter((u) => u.user_id !== user?.id);
        setConversations(users);
      })
      .catch((err) => console.error(err));
  }, [user]);

  useEffect(() => {
    if (selectedConvo) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConvo]);

  const fetchMessages = () => {
    if (!selectedConvo) return;

    fetch(`/api/private-messages?other_user_id=${selectedConvo.user_id}`)
      .then((res) => res.json())
      .then((data) => setMessages(data.messages || []))
      .catch((err) => console.error(err));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConvo) return;

    try {
      const res = await fetch("/api/private-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_id: selectedConvo.user_id,
          content: newMessage,
          message_type: "text",
        }),
      });

      if (res.ok) {
        setNewMessage("");
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (userLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0f172a]">
      {/* Navigation */}
      <div className="w-64 border-r border-gray-700 bg-[#1e293b] p-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Chat App</h1>
          <p className="text-sm text-gray-400">Welcome, {profile.username}</p>
        </div>
        <nav className="space-y-2">
          <a
            href="/policy"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-700"
          >
            <Map size={20} />
            Policy
          </a>
          <a
            href="/messages"
            className="flex items-center gap-3 rounded-lg bg-blue-600 px-4 py-3 text-white"
          >
            <MessageCircle size={20} />
            Messages
          </a>
          <a
            href="/profile"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-700"
          >
            <User size={20} />
            Profile
          </a>
        </nav>
        <div className="mt-auto pt-8">
          <a
            href="/account/logout"
            className="block rounded-lg bg-gray-700 px-4 py-2 text-center text-sm text-gray-300 hover:bg-gray-600"
          >
            Logout
          </a>
        </div>
      </div>

      {/* Conversations List */}
      <div className="w-80 border-r border-gray-700 bg-[#1e293b]">
        <div className="border-b border-gray-700 p-4">
          <h2 className="text-xl font-bold text-white">Private Messages</h2>
        </div>
        <div className="overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConvo(conv)}
                className={`cursor-pointer border-b border-gray-700 p-4 hover:bg-gray-700 ${
                  selectedConvo?.id === conv.id ? "bg-gray-700" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {conv.avatar_url ? (
                    <img
                      src={conv.avatar_url}
                      alt={conv.username}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white font-bold">
                      {conv.username[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">
                      {conv.username}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {conv.city || "Unknown city"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col">
        {selectedConvo ? (
          <>
            <div className="border-b border-gray-700 bg-[#1e293b] p-4">
              <div className="flex items-center gap-3">
                {selectedConvo.avatar_url ? (
                  <img
                    src={selectedConvo.avatar_url}
                    alt={selectedConvo.username}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white font-bold">
                    {selectedConvo.username[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-white">
                    {selectedConvo.username}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {selectedConvo.character || "No character"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#0f172a] p-4">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div className="max-w-md">
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              isOwn
                                ? "bg-blue-600 text-white"
                                : "bg-[#1e293b] text-white"
                            }`}
                          >
                            <p>{msg.content}</p>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-gray-700 bg-[#1e293b] p-4">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg bg-[#0f172a] border border-gray-600 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-[#0f172a]">
            <div className="text-center text-gray-500">
              <MessageCircle size={64} className="mx-auto mb-4 text-gray-600" />
              <p className="text-xl">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
