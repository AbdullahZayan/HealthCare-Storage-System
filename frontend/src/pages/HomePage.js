import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Chatbot from './ChatBot';

export default function HomePage({api}) {
  const [profile, setProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [checkupEmail, setCheckupEmail] = useState(profile?.email);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingReportId, setEditingReportId] = useState(null);
  const [editedComment, setEditedComment] = useState("");
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isUploadReportOpen, setIsUploadReportOpen] = useState(false);
  const [isCheckupReminderOpen, setIsCheckupReminderOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const [showChatbot, setShowChatbot] = useState(false);

  const profileMenuRef = useRef(null);
  const navigate = useNavigate();


  useEffect(() => {
    setCheckupEmail(profile?.email);
  },[profile])

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    fetch(`${api}/api/patients/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setProfile)
      .catch(console.error);

    fetch(`${api}/api/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => (Array.isArray(data) ? setReports(data) : setReports([])))
      .catch(console.error);
  }, [navigate]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target)
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

  const handleEditComment = (id, current) => {
    setEditingReportId(id);
    setEditedComment(current);
  };

  const saveComment = async (id) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${api}/api/reports/comment/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: editedComment, author: profile.firstName }),
    });
    const data = await res.json();

    if (res.ok) {
      setReports(
        reports.map((r) =>
          r._id === id
            ? {
                ...r,
                comments: [
                  ...(r.comments || []),
                  { text: editedComment, author: profile.firstName },
                ],
              }
            : r
        )
      );
      setEditingReportId(null);
    } else {
      alert(data.message);
    }
  };

  const handleDownload = async (id, fileName = "report.pdf") => {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${api}/api/reports/download/${id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const error = await res.json();
      alert(error.message || "Failed to download");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName; // still uses display name
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const token = localStorage.getItem("token");

    const res = await fetch(`${api}/api/patients/edit-profile`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
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

  const handleReportUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const token = localStorage.getItem("token");

    const res = await fetch(`${api}/api/reports/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      const uploadedReport = {
        ...data.report,
        comments: data.report.comments || [
          {
            text: formData.get("comments"),
            author: profile.firstName,
          },
        ],
      };
      setReports((prev) => [uploadedReport, ...prev]);
      setIsUploadReportOpen(false);
    } else {
      alert(data.message);
    }
  };

  const handleCheckupReminderSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${api}/api/patients/set-checkup-date`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          checkupDate: formData.get("last-checkup"),
          checkupEmail 
        }),
      }
    );
    if (res.ok) {
      setProfile((prev) => ({
        ...prev,
        lastCheckupDate: formData.get("last-checkup"),
        checkupEmail

      }));
      setIsCheckupReminderOpen(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    const message = new FormData(e.target).get("feedback");
    const token = localStorage.getItem("token");

    const res = await fetch(`${api}/api/feedback/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });

    if (res.ok) {
      alert("Thank you for your feedback");
      setIsFeedbackOpen(false);
    }
  };

  const filteredReports = reports.filter((r) =>
    [
      typeof r.fileName === "string" ? r.fileName : "",
      typeof r.reportType === "string" ? r.reportType : "",
      Array.isArray(r.comments)
        ? r.comments.map((c) => c.text).join(" ")
        : typeof r.comments === "string"
        ? r.comments
        : "",
    ].some(
      (field) =>
        typeof field === "string" &&
        field.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (!profile) return <div className="text-center mt-10">Loading...</div>;
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
              <span className=" text-blue-700">HealthCare Storage</span>
            </Link>
          </div>
          <nav className="flex items-center gap-6 text-sm">
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
              <p className="hidden md:flex">Home</p>
            </Link>
            <Link
              to="/heartrate"
              className=" font-medium transition-colors hover:text-blue-600 flex items-center gap-1"
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

              <p className="hidden md:flex">HeartRate Dashboard</p>

            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {/* <button className="relative p-2 text-blue-700 hover:bg-blue-100 rounded-full">
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
            </button> */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden"
              >
                {profile?.profilePicture ? (
                  <img
                    src={`${api}${profile.profilePicture}`}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-blue-600 text-white font-semibold">
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
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
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
          <div className="flex items-center gap-4">
            <div className="hidden md:block">

              {profile?.profilePicture ? (
                <img
                  src={`${api}${profile.profilePicture}`}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  className="h-24 w-24 rounded-full border-4 border-blue-100 object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full border-4 border-blue-100 bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                  {profile?.firstName?.[0]}
                  {profile?.lastName?.[0]}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-blue-800">
                Welcome, {profile?.firstName} {profile?.lastName}
              </h1>
              <p className="text-blue-600">
                Manage your medical records and reports
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
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

            <button
              onClick={() => setIsUploadReportOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 bg-white rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {/* Upload icon */}
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Upload Report
            </button>

            <button
              onClick={() => setIsCheckupReminderOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-green-300 text-green-700 bg-white rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              {/* Calendar icon */}
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Check Up Reminder
            </button>

            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-200 text-blue-800 rounded-md hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {/* Message Square icon */}
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Send Feedback
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-blue-200 shadow-md overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
            <h2 className="text-xl font-bold text-blue-800">Medical Reports</h2>
            <p className="text-sm text-gray-500">
              View and download your medical reports
            </p>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="search"
                  placeholder="Search reports..."
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="rounded-md border overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Report Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Comments
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.length > 0 ? (
                    filteredReports.map((report) => (
                      <tr key={report._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {report.fileName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(report.uploadDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {editingReportId === report._id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editedComment}
                                onChange={(e) =>
                                  setEditedComment(e.target.value)
                                }
                                className="flex-1 px-3 py-1 text-sm border rounded-md"
                              />
                              <button
                                onClick={async () => {
                                  const token = localStorage.getItem("token");
                                  const res = await fetch(
                                    `${api}/api/reports/comment/${report._id}`,
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`,
                                      },
                                      body: JSON.stringify({
                                        text: editedComment,
                                        author: profile.firstName,
                                      }),
                                    }
                                  );
                                  const data = await res.json();
                                  if (res.ok) {
                                    setReports((prev) =>
                                      prev.map((r) =>
                                        r._id === report._id
                                          ? {
                                              ...r,
                                              comments: [
                                                {
                                                  text: editedComment,
                                                  author: profile.firstName,
                                                },
                                              ],
                                            }
                                          : r
                                      )
                                    );
                                    setEditingReportId(null);
                                  } else {
                                    alert(data.message);
                                  }
                                }}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {Array.isArray(report.comments) &&
                              report.comments.length > 0 ? (
                                <div className="text-sm text-gray-700">
                                  <span className="font-medium text-blue-600">
                                    {report.comments[0].author || "You"}:
                                  </span>{" "}
                                  {report.comments[0].text}
                                </div>
                              ) : report.comments &&
                                typeof report.comments === "string" ? (
                                <div className="text-sm text-gray-700">
                                  <span className="font-medium text-blue-600">
                                    You:
                                  </span>{" "}
                                  {report.comments}
                                </div>
                              ) : null}
                              <button
                                onClick={() =>
                                  handleEditComment(
                                    report._id,
                                    (Array.isArray(report.comments)
                                      ? report.comments[0]?.text
                                      : report.comments) || ""
                                  )
                                }
                                className="mt-1 text-xs text-blue-500 hover:underline"
                              >
                                {report.comments?.length ||
                                typeof report.comments === "string"
                                  ? "Edit Comment"
                                  : "Add Comment"}
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {report.reportType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() =>
                              handleDownload(report._id, report.fileName)
                            }
                            className="inline-flex items-center gap-1 px-3 py-1 text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                          >
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
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                            Download
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        {reports.length === 0
                          ? "No reports found. Upload your first report!"
                          : "No reports found matching your search."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-blue-50 border-t border-blue-100 px-6 py-4 flex justify-between">
            <p className="text-sm text-blue-600">
              Showing {filteredReports.length} of {reports.length} reports
            </p>
          </div>
        </div>
      </main>

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

      {/* Upload Report Modal */}
      {isUploadReportOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setIsUploadReportOpen(false)}
              ></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleReportUpload}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Upload Medical Report
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Upload your medical reports for safekeeping and easy
                        access.
                      </p>
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-2">
                          <label
                            htmlFor="report-name"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Report Name
                          </label>
                          <input
                            id="report-name"
                            name="fileName"
                            placeholder="e.g., Blood Test Results"
                            required
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label
                            htmlFor="report-comments"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Comments
                          </label>
                          <textarea
                            id="report-comments"
                            name="comments"
                            placeholder="Add comments about this report..."
                            required
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label
                            htmlFor="report-type"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Report Type
                          </label>
                          <input
                            id="report-type"
                            name="reportType"
                            placeholder="e.g., Laboratory, Radiology"
                            required
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label
                            htmlFor="report-file"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Report File
                          </label>
                          <input
                            id="report-file"
                            name="file"
                            type="file"
                            required
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
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
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsUploadReportOpen(false)}
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

      {/* Check Up Reminder Modal */}
      {isCheckupReminderOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setIsCheckupReminderOpen(false)}
              ></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCheckupReminderSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Set Check Up Reminder
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        We'll send you a reminder email one year after your last
                        check-up.
                      </p>
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-2">
                          <label
                            htmlFor="last-checkup"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Date of Last Check Up
                          </label>
                          <input
                            id="last-checkup"
                            name="last-checkup"
                            type="date"
                            defaultValue={profile?.lastCheckup}
                            required
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Email for Reminder
                          </label>
                          <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="your.email@example.com"
                            // defaultValue={profile?.email}
                            value={checkupEmail}
                            onChange={(e) => setCheckupEmail(e.target.value)}
                            required
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                          />
                          {/* {checkupEmail} */}
                        </div>
                        <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm text-blue-700">
                          <div className="flex items-start gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <p>
                              We'll send you a reminder email exactly one year
                              after your last check-up date. This helps ensure
                              you maintain regular health monitoring.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Set Reminder
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCheckupReminderOpen(false)}
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

      {/* Send Feedback Modal */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setIsFeedbackOpen(false)}
              ></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleFeedbackSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Send Feedback
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        We value your opinion. Please share your thoughts with
                        us. Your feedback will be reviewed by our
                        administrators.
                      </p>
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-2">
                          <label
                            htmlFor="feedback"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Your Feedback
                          </label>
                          <textarea
                            id="feedback"
                            name="feedback"
                            placeholder="Tell us what you think about our services..."
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border min-h-[150px]"
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
                    Submit Feedback
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFeedbackOpen(false)}
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


      
      <footer
  className="fixed bottom-5 right-5 bg-white px-4 py-2 text-sm text-gray-800 rounded-lg shadow-md z-50 cursor-pointer border border-gray-300 hover:bg-gray-100"
  onClick={() => setShowChatbot(!showChatbot)}
>
  Need Help?Ask ChatBot ? 💬
</footer>

{showChatbot && <Chatbot onClose={() => setShowChatbot(false)} api={api} />}




    </div>
  );
}
