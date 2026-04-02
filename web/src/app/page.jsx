import { useState, useEffect, useCallback, useRef } from "react";
import useUser from "@/utils/useUser";
import useUpload from "@/utils/useUpload";
import {
  MessageCircle,
  Send,
  Paperclip,
  Image,
  Mic,
  Users,
  Plus,
  Search,
  X,
  Smile,
} from "lucide-react";

export default function ChatApp() {
  const { data: user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [showUserList, setShowUserList] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedPrivateUser, setSelectedPrivateUser] = useState(null);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [viewMode, setViewMode] = useState("rooms"); // "rooms" or "private"
  const messagesEndRef = useRef(null);
  const [upload, { loading: uploading }] = useUpload();

  // Fetch profile
  useEffect(() => {
    if (user) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.profile) {
            setProfile(data.profile);
          } else {
            // Redirect to onboarding if no profile
            window.location.href = "/onboarding";
          }
        })
        .catch((err) => console.error(err));
    }
  }, [user]);

  // Fetch rooms
  const fetchRooms = useCallback(() => {
    fetch("/api/rooms")
      .then((res) => res.json())
      .then((data) => setRooms(data.rooms || []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (profile) {
      fetchRooms();
    }
  }, [profile, fetchRooms]);

  // Fetch messages for selected room
  const fetchMessages = useCallback(() => {
    if (selectedRoom) {
      fetch(`/api/messages?room_id=${selectedRoom.id}`)
        .then((res) => res.json())
        .then((data) => setMessages(data.messages || []))
        .catch((err) => console.error(err));
    }
  }, [selectedRoom]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedRoom, fetchMessages]);

  // Fetch private messages
  const fetchPrivateMessages = useCallback(() => {
    if (selectedPrivateUser) {
      fetch(
        `/api/private-messages?other_user_id=${selectedPrivateUser.user_id}`,
      )
        .then((res) => res.json())
        .then((data) => setPrivateMessages(data.messages || []))
        .catch((err) => console.error(err));
    }
  }, [selectedPrivateUser]);

  useEffect(() => {
    if (selectedPrivateUser) {
      fetchPrivateMessages();
      const interval = setInterval(fetchPrivateMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedPrivateUser, fetchPrivateMessages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, privateMessages]);

  // Fetch users
  const fetchUsers = useCallback(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch((err) => console.error(err));
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoomName,
          description: newRoomDescription,
        }),
      });
      if (res.ok) {
        setNewRoomName("");
        setNewRoomDescription("");
        setShowCreateRoom(false);
        fetchRooms();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      if (viewMode === "rooms" && selectedRoom) {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room_id: selectedRoom.id,
            content: newMessage,
            message_type: "text",
          }),
        });
        if (res.ok) {
          setNewMessage("");
          fetchMessages();
        }
      } else if (viewMode === "private" && selectedPrivateUser) {
        const res = await fetch("/api/private-messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            receiver_id: selectedPrivateUser.user_id,
            content: newMessage,
            message_type: "text",
          }),
        });
        if (res.ok) {
          setNewMessage("");
          fetchPrivateMessages();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

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

        if (viewMode === "rooms" && selectedRoom) {
          await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              room_id: selectedRoom.id,
              content: file.name,
              message_type: file.type.startsWith("image/") ? "image" : "file",
              file_url: url,
              file_name: file.name,
            }),
          });
          fetchMessages();
        } else if (viewMode === "private" && selectedPrivateUser) {
          await fetch("/api/private-messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              receiver_id: selectedPrivateUser.user_id,
              content: file.name,
              message_type: file.type.startsWith("image/") ? "image" : "file",
              file_url: url,
              file_name: file.name,
            }),
          });
          fetchPrivateMessages();
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
    }
  };

  if (userLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">
            Welcome to Chat
          </h1>
          <p className="mb-8 text-white">Please sign in to continue</p>
          <a
            href="/account/signin"
            className="rounded-lg bg-white px-6 py-3 font-medium text-blue-600 hover:bg-gray-100"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">Loading profile...</div>
      </div>
    );
  }

  const currentMessages = viewMode === "rooms" ? messages : privateMessages;
  const currentChat = viewMode === "rooms" ? selectedRoom : selectedPrivateUser;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar - Rooms/Users List */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Chat App</h2>
            <a
              href="/account/logout"
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Logout
            </a>
          </div>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setViewMode("rooms");
                setSelectedPrivateUser(null);
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                viewMode === "rooms"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Rooms
            </button>
            <button
              onClick={() => {
                setViewMode("private");
                setSelectedRoom(null);
                fetchUsers();
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                viewMode === "private"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Private
            </button>
          </div>
          {viewMode === "rooms" && (
            <button
              onClick={() => setShowCreateRoom(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <Plus size={20} />
              Create Room
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {viewMode === "rooms" ? (
            rooms.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No rooms yet. Create one!
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`cursor-pointer border-b border-gray-100 p-4 hover:bg-gray-50 ${
                    selectedRoom?.id === room.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                      {room.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {room.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {room.member_count} members
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : users.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No users found</div>
          ) : (
            users
              .filter((u) => u.user_id !== user.id)
              .map((u) => (
                <div
                  key={u.id}
                  onClick={() => setSelectedPrivateUser(u)}
                  className={`cursor-pointer border-b border-gray-100 p-4 hover:bg-gray-50 ${
                    selectedPrivateUser?.id === u.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white font-bold">
                      {u.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {u.username}
                      </h3>
                      <p className="text-sm text-gray-500">{u.status}</p>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${viewMode === "rooms" ? "bg-blue-600" : "bg-purple-600"} text-white font-bold`}
                  >
                    {viewMode === "rooms"
                      ? currentChat.name[0].toUpperCase()
                      : currentChat.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800">
                      {viewMode === "rooms"
                        ? currentChat.name
                        : currentChat.username}
                    </h2>
                    {viewMode === "rooms" && currentChat.description && (
                      <p className="text-sm text-gray-500">
                        {currentChat.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
              {currentMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div className="space-y-4">
                  {currentMessages.map((msg) => {
                    const isOwn =
                      viewMode === "rooms"
                        ? msg.user_id === user.id
                        : msg.sender_id === user.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-md ${isOwn ? "order-2" : "order-1"}`}
                        >
                          {!isOwn && (
                            <div className="mb-1 text-xs text-gray-600">
                              {viewMode === "rooms"
                                ? msg.username
                                : msg.sender_username}
                            </div>
                          )}
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              isOwn
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-800"
                            }`}
                          >
                            {msg.message_type === "image" && msg.file_url ? (
                              <img
                                src={msg.file_url}
                                alt={msg.file_name}
                                className="max-w-xs rounded"
                              />
                            ) : msg.message_type === "file" && msg.file_url ? (
                              <a
                                href={msg.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 underline"
                              >
                                <Paperclip size={16} />
                                {msg.file_name}
                              </a>
                            ) : (
                              <p>{msg.content}</p>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 bg-white p-4">
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
                  className="cursor-pointer rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                >
                  <Paperclip size={20} />
                </label>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
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
          <div className="flex h-full items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <MessageCircle size={64} className="mx-auto mb-4 text-gray-400" />
              <p className="text-xl">
                {viewMode === "rooms"
                  ? "Select a room to start chatting"
                  : "Select a user to start a private conversation"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Create New Room</h3>
              <button
                onClick={() => setShowCreateRoom(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter room name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description (optional)
                </label>
                <textarea
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter room description"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Create Room
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
