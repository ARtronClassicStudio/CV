import { useState, useEffect, useCallback, useRef } from "react";
import useUser from "@/utils/useUser";
import useUpload from "@/utils/useUpload";
import { MessageCircle, Send, Paperclip, User, Map, Users } from "lucide-react";

export default function ChatPage() {
  const { data: user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [usersInLocation, setUsersInLocation] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const [upload, { loading: uploading }] = useUpload();

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
    // Get current location
    fetch("/api/locations")
      .then((res) => res.json())
      .then((data) => {
        if (!data.currentLocation) {
          window.location.href = "/policy";
        } else {
          const location = data.locations.find(
            (l) => l.id === data.currentLocation,
          );
          setCurrentLocation(location);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    // Fetch users in current location
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        setUsersInLocation(
          (data.users || []).filter((u) => u.user_id !== user?.id),
        );
      })
      .catch((err) => console.error(err));
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target.result;
        const { url, error } = await upload({ base64 });

        if (error) {
          console.error(error);
          return;
        }

        // Send file message (you'd need to implement this in your API)
        console.log("File uploaded:", url);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // For now, just log - you'd need to implement location-based messaging
    console.log("Sending message to location:", newMessage);
    setNewMessage("");
  };

  if (userLoading || !profile || !currentLocation) {
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
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-700"
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

      {/* Users in Location */}
      <div className="w-80 border-r border-gray-700 bg-[#1e293b]">
        <div className="border-b border-gray-700 p-4">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-blue-500" />
            <h2 className="text-lg font-bold text-white">
              {currentLocation.name}
            </h2>
          </div>
          <p className="text-sm text-gray-400">
            {usersInLocation.length} people here
          </p>
        </div>
        <div className="overflow-y-auto">
          {usersInLocation.map((user) => (
            <div
              key={user.id}
              className="border-b border-gray-700 p-4 hover:bg-gray-700"
            >
              <div className="flex items-center gap-3">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white font-bold">
                    {user.username[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{user.username}</h3>
                  <p className="text-xs text-gray-400">
                    {user.character || "No character"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col">
        <div className="border-b border-gray-700 bg-[#1e293b] p-4">
          <h2 className="text-xl font-bold text-white">Location Chat</h2>
          <p className="text-sm text-gray-400">
            Everyone in {currentLocation.name} can see these messages
          </p>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#0f172a] p-4">
          <div className="flex h-full items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto mb-4 text-gray-600" />
              <p className="text-xl">Location chat coming soon!</p>
              <p className="text-sm">For now, use private messages</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 bg-[#1e293b] p-4">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2"
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,audio/*,.pdf,.doc,.docx"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer rounded-lg p-2 text-gray-400 hover:bg-gray-700"
            >
              <Paperclip size={20} />
            </label>
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
      </div>
    </div>
  );
}
