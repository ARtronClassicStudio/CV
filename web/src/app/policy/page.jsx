import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import {
  MapPin,
  Users,
  ArrowRight,
  MessageCircle,
  User,
  Map,
} from "lucide-react";

export default function PolicyPage() {
  const { data: user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState(null);
  const [locations, setLocations] = useState([]);
  const [currentLocationId, setCurrentLocationId] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [usersInLocation, setUsersInLocation] = useState([]);

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
    fetch("/api/locations")
      .then((res) => res.json())
      .then((data) => {
        setLocations(data.locations || []);
        setCurrentLocationId(data.currentLocation);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleJoinLocation = async (locationId) => {
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location_id: locationId }),
      });

      if (res.ok) {
        setCurrentLocationId(locationId);
        window.location.href = "/chat";
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
            className="flex items-center gap-3 rounded-lg bg-blue-600 px-4 py-3 text-white"
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

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h2 className="mb-2 text-3xl font-bold text-white">
              Choose Your Location
            </h2>
            <p className="text-gray-400">
              Select a place to join and start chatting with people there
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((location) => (
              <div
                key={location.id}
                className={`rounded-lg border-2 p-6 transition-all ${
                  currentLocationId === location.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-700 bg-[#1e293b] hover:border-gray-600"
                }`}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {location.name}
                    </h3>
                  </div>
                </div>
                <p className="mb-4 text-sm text-gray-400">
                  {location.description}
                </p>
                <button
                  onClick={() => handleJoinLocation(location.id)}
                  disabled={currentLocationId === location.id}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    currentLocationId === location.id
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {currentLocationId === location.id
                    ? "Current Location"
                    : "Join"}
                  {currentLocationId !== location.id && (
                    <ArrowRight size={16} />
                  )}
                </button>
              </div>
            ))}
          </div>

          {currentLocationId && (
            <div className="mt-8 text-center">
              <button
                onClick={() => (window.location.href = "/chat")}
                className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700"
              >
                Go to Chat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
