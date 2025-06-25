"use client";

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function UserProfile({api}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const profileMenuRef = useRef(null);
  const navigate = useNavigate();

  // Load profile data
  useEffect(() => {
    setLoading(true);
    fetch(`${api}/api/patients/profile`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then(setProfile)
      .catch((err) => console.error("Profile fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  // Handle profile menu click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const res = await fetch(`${api}/api/patients/edit-profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });
    const data = await res.json();
    if (res.ok) {
      setProfile(data.updatedPatient);
      setIsEditProfileOpen(false);
    } else {
      alert(data.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="sticky top-0 z-10 w-full border-b bg-blue-50">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link to="/home" className="flex items-center gap-2 font-semibold">
              {/* Stethoscope icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 4.5c0 2.485-2.015 4.5-4.5 4.5s-4.5-2.015-4.5-4.5 2.015-4.5 4.5-4.5 4.5 2.015 4.5 4.5zM16.5 8.25V16.5c0 2.25-2.25 4.5-4.5 4.5s-4.5-2.25-4.5-4.5v-3.75m9-4.5H4.5c-.967 0-1.75-.784-1.75-1.75s.783-1.75 1.75-1.75h12.5c.967 0 1.75.784 1.75 1.75s-.783 1.75-1.75 1.75z"
                />
              </svg>
              <span className="text-blue-700">HealthCare Storage</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              to="/home"
              className="font-medium transition-colors hover:text-blue-600 flex items-center gap-1"
            >
              {/* File Text icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Home
            </Link>
            <Link
              to="/heartrate"
              className="font-medium transition-colors hover:text-blue-600 flex items-center gap-1"
            >
              {/* Activity icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              HeartRate Dashboard
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-blue-700 hover:bg-blue-100 rounded-full">
              {/* Bell icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-600"></span>
              <span className="sr-only">Notifications</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden"
              >
                {profile?.profilePicture ? (
                  <img
                    src={`${api}${profile.profilePicture}`}
                    alt={`${profile.firstName} ${profile.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-4xl font-bold">
                    {profile?.firstName?.[0]}
                    {profile?.lastName?.[0]}
                  </div>
                )}
              </button>

              {isProfileMenuOpen && (
                <div
                  ref={profileMenuRef}
                  className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50"
                >
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-blue-700 bg-blue-50 flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 bg-gradient-to-b from-blue-50 to-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-800">
              User Profile
            </h1>
            <p className="text-blue-600">
              View and manage your personal information
            </p>
          </div>
          <button
            onClick={() => setIsEditProfileOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {/* Edit icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Profile
          </button>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-lg border border-blue-200 shadow-md overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
            <h2 className="text-xl font-bold text-blue-800">
              Personal Information
            </h2>
            <p className="text-sm text-gray-500">
              Your personal and medical details
            </p>
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center">
                <div className="w-40 h-40 rounded-full border-4 border-blue-100 overflow-hidden mb-4">
                  {profile?.profilePicture ? (
                    <img
                      src={`http://localhost:5000${profile.profilePicture}`}
                      alt={`${profile.firstName} ${profile.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-4xl font-bold">
                      {profile?.firstName?.[0]}
                      {profile?.lastName?.[0]}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {profile?.firstName} {profile?.lastName}
                </h3>
                <p className="text-gray-500 text-sm">
                  Patient ID: {profile?._id?.substring(0, 8) || "N/A"}
                </p>
              </div>

              {/* Profile Details Section */}
              <div className="flex-1 space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Email</h4>
                  <p className="text-gray-800">
                    {profile?.email || "Not provided"}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Allergies
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {profile?.allergies || "No allergies recorded"}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Chronic Conditions
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {profile?.chronicConditions ||
                        "No chronic conditions recorded"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
              >
                <div
                  className="absolute inset-0 bg-gray-500 opacity-75"
                  onClick={() => setIsEditProfileOpen(false)}
                ></div>
              </div>
              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleProfileUpdate}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Edit Profile
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Update your personal information below.
                        </p>
                        <div className="mt-4 space-y-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label
                              htmlFor="firstName"
                              className="text-right text-sm font-medium text-gray-700"
                            >
                              First Name
                            </label>
                            <input
                              id="firstName"
                              name="firstName"
                              defaultValue={profile?.firstName}
                              className="col-span-3 mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label
                              htmlFor="lastName"
                              className="text-right text-sm font-medium text-gray-700"
                            >
                              Last Name
                            </label>
                            <input
                              id="lastName"
                              name="lastName"
                              defaultValue={profile?.lastName}
                              className="col-span-3 mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label
                              htmlFor="email"
                              className="text-right text-sm font-medium text-gray-700"
                            >
                              Email
                            </label>
                            <input
                              id="email"
                              name="email"
                              type="email"
                              defaultValue={profile?.email}
                              className="col-span-3 mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label
                              htmlFor="allergies"
                              className="text-right text-sm font-medium text-gray-700"
                            >
                              Allergies
                            </label>
                            <textarea
                              id="allergies"
                              name="allergies"
                              defaultValue={profile?.allergies}
                              className="col-span-3 mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                              rows={3}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label
                              htmlFor="chronicConditions"
                              className="text-right text-sm font-medium text-gray-700"
                            >
                              Chronic Conditions
                            </label>
                            <textarea
                              id="chronicConditions"
                              name="chronicConditions"
                              defaultValue={profile?.chronicConditions}
                              className="col-span-3 mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                              rows={3}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label
                              htmlFor="profilePicture"
                              className="text-right text-sm font-medium text-gray-700"
                            >
                              Profile Picture
                            </label>
                            <input
                              id="profilePicture"
                              name="profilePicture"
                              type="file"
                              className="col-span-3 mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Save changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditProfileOpen(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
