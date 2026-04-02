import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import useUpload from "@/utils/useUpload";
import { User, Map, MessageCircle, Camera } from "lucide-react";

const CHARACTER_OPTIONS = [
  {
    value: "adventurer",
    label: "🗺️ Adventurer",
    desc: "Always seeking new experiences",
  },
  {
    value: "creator",
    label: "🎨 Creator",
    desc: "Loves to make and build things",
  },
  { value: "thinker", label: "🧠 Thinker", desc: "Deep and philosophical" },
  { value: "helper", label: "💝 Helper", desc: "Always there for others" },
  { value: "leader", label: "👑 Leader", desc: "Natural born organizer" },
  { value: "dreamer", label: "✨ Dreamer", desc: "Full of imagination" },
];

export default function ProfilePage() {
  const { data: user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [city, setCity] = useState("");
  const [interests, setInterests] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [character, setCharacter] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [upload, { loading: uploading }] = useUpload();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = () => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          setUsername(data.profile.username || "");
          setCity(data.profile.city || "");
          setInterests(data.profile.interests || "");
          setAboutMe(data.profile.about_me || "");
          setCharacter(data.profile.character || "");
          setAvatarUrl(data.profile.avatar_url || "");
        } else {
          window.location.href = "/onboarding";
        }
      })
      .catch((err) => console.error(err));
  };

  const handleAvatarUpload = async (e) => {
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

        setAvatarUrl(url);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          city,
          interests,
          about_me: aboutMe,
          character,
          avatar_url: avatarUrl,
        }),
      });

      if (res.ok) {
        setEditing(false);
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const selectedCharacter = CHARACTER_OPTIONS.find(
    (c) => c.value === character,
  );

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
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
            className="flex items-center gap-3 rounded-lg bg-blue-600 px-4 py-3 text-white"
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

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white">My Profile</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    fetchProfile();
                  }}
                  className="rounded-lg bg-gray-700 px-6 py-2 text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-[#1e293b] border border-gray-700 p-8">
            {/* Avatar */}
            <div className="mb-8 text-center">
              <div className="relative mx-auto mb-4 h-32 w-32">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-32 w-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-purple-600 text-4xl font-bold text-white">
                    {username[0]?.toUpperCase()}
                  </div>
                )}
                {editing && (
                  <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-blue-600 p-2 text-white hover:bg-blue-700">
                    <Camera size={20} />
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      accept="image/*"
                    />
                  </label>
                )}
              </div>
              <div className="text-sm text-gray-400">ID: {profile.id}</div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Username
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg bg-[#0f172a] border border-gray-600 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-white">{username}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Character
                </label>
                {editing ? (
                  <div className="grid grid-cols-2 gap-3">
                    {CHARACTER_OPTIONS.map((char) => (
                      <button
                        key={char.value}
                        type="button"
                        onClick={() => setCharacter(char.value)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          character === char.value
                            ? "border-blue-500 bg-blue-500/20"
                            : "border-gray-600 bg-[#0f172a] hover:border-gray-500"
                        }`}
                      >
                        <div className="text-xl mb-1">
                          {char.label.split(" ")[0]}
                        </div>
                        <div className="text-white text-sm font-medium">
                          {char.label.split(" ").slice(1).join(" ")}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-white">
                    {selectedCharacter ? selectedCharacter.label : "Not set"}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  City
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg bg-[#0f172a] border border-gray-600 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-white">{city || "Not set"}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Interests
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    className="w-full rounded-lg bg-[#0f172a] border border-gray-600 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-white">{interests || "Not set"}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  About Me
                </label>
                {editing ? (
                  <textarea
                    value={aboutMe}
                    onChange={(e) => setAboutMe(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg bg-[#0f172a] border border-gray-600 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-white whitespace-pre-wrap">
                    {aboutMe || "Not set"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
