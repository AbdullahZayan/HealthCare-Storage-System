import { useState, useRef, useEffect } from "react";

export default function Dashboard({api}) {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showFeedback, setShowFeedback] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false)
  const settingsRef = useRef(null)
  const [activeChart, setActiveChart] = useState("bar")

  const [patients, setPatients] = useState([])
  const [feedback, setFeedback] = useState([])
  const [stats, setStats] = useState({ totalPatients: 0, totalReports: 0 })


  // ✅ Destructure stats immediately so they are in scope
  const { totalPatients, totalReports } = stats

  useEffect(() => {
  const token = localStorage.getItem("token");

  // ✅ Fetch dashboard stats
  fetch(`${api}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((data) => setStats(data))
    .catch((err) => console.error("Error fetching dashboard stats:", err));

  // ✅ Fetch patients for admin management table
  fetch(`${api}/api/admin/patients`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then(setPatients)
    .catch((err) => console.error("Error fetching patients:", err));

  // ✅ Fetch feedback submitted by patients
  fetch(`${api}/api/admin/feedback`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then(setFeedback)
    .catch((err) => console.error("Error fetching feedback:", err));
}, []);

  const totalFeedback = feedback.length
  const activePatients = patients.filter((p) => p.status === "active").length
  const inactivePatients = patients.filter((p) => p.status !== "active").length
  const maxValue = Math.max(activePatients, inactivePatients, totalReports, totalFeedback)

  const handleStatusChange = async (id, newStatus) => {
    const token = localStorage.getItem("token")
    const res = await fetch(`${api}/api/admin/patients/update-status/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    })

    if (res.ok) {
      setPatients((prev) => prev.map((p) => (p._id === id ? { ...p, status: newStatus } : p)))
    }
  }

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token")
    const res = await fetch(`${api}/api/admin/patients/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.ok) {
      setPatients((prev) => prev.filter((p) => p._id !== id))
    }
  }

  const openFeedback = (item) => setSelectedFeedback(item)

  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettingsDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/admin-login"; // Ensure redirection to admin login page
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 bg-white border-r">
        <div className="flex items-center h-16 px-4 border-b bg-teal-600 text-white">
          <h1 className="text-xl font-bold">HealthCare Storage</h1>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="space-y-1 px-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center w-full px-3 py-2 text-left rounded-md ${activeTab === "dashboard" ? "bg-teal-50 text-teal-700" : "text-gray-700 hover:bg-gray-100"}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Dashboard
            </button>
            <button
              onClick={() => setShowFeedback(true)}
              className={`flex items-center w-full px-3 py-2 text-left rounded-md text-gray-700 hover:bg-gray-100`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              Feedback
            </button>
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                className={`flex items-center w-full px-3 py-2 text-left rounded-md text-gray-700 hover:bg-gray-100`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
              {showSettingsDropdown && (
                <div className="absolute left-0 mt-1 w-full bg-white border rounded-md shadow-lg z-10">
                  <button 
                   onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-64">
        <header className="bg-white shadow-sm border-b h-16 flex items-center px-4">
          <h1 className="text-xl font-semibold text-gray-800">Admin Dashboard</h1>
          <div className="ml-auto flex items-center gap-4">
            <button
              onClick={() => setShowFeedback(true)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              View Feedback
            </button>
          </div>
        </header>

        <main className="p-4 md:p-6">
          {/* Stats cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <div className="text-sm font-medium text-gray-500 mb-2">Total Patients</div>
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-500 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-gray-800">{totalPatients}</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <div className="text-sm font-medium text-gray-500 mb-2">Total Medical Reports</div>
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-gray-800">{totalReports}</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <div className="text-sm font-medium text-gray-500 mb-2">Total Feedback</div>
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-gray-800">{totalFeedback}</div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="mb-6">
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <div className="mb-2">
                <h2 className="text-lg font-semibold text-gray-800">System Analytics</h2>
                <p className="text-sm text-gray-500">Overview of system data</p>
              </div>

              {/* Chart Type Selector */}
              <div className="flex space-x-2 mb-4 border-b pb-2">
                <button
                  onClick={() => setActiveChart("bar")}
                  className={`px-3 py-1.5 text-sm rounded-md flex items-center ${activeChart === "bar" ? "bg-teal-50 text-teal-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Bar Chart
                </button>
                <button
                  onClick={() => setActiveChart("line")}
                  className={`px-3 py-1.5 text-sm rounded-md flex items-center ${activeChart === "line" ? "bg-teal-50 text-teal-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                  Line Chart
                </button>
                <button
                  onClick={() => setActiveChart("pie")}
                  className={`px-3 py-1.5 text-sm rounded-md flex items-center ${activeChart === "pie" ? "bg-teal-50 text-teal-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                    />
                  </svg>
                  Pie Chart
                </button>
              </div>

              {/* Bar Chart */}
              {activeChart === "bar" && (
                <div className="mt-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Active Patients</span>
                        <span>{activePatients}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full"
                          style={{ width: `${(activePatients / maxValue) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Inactive Patients</span>
                        <span>{inactivePatients}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-gray-500 h-2.5 rounded-full"
                          style={{ width: `${(inactivePatients / maxValue) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Medical Reports</span>
                        <span>{totalReports}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-green-500 h-2.5 rounded-full"
                          style={{ width: `${(totalReports / maxValue) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Feedback</span>
                        <span>{totalFeedback}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-amber-500 h-2.5 rounded-full"
                          style={{ width: `${(totalFeedback / maxValue) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Line Chart */}
              {activeChart === "line" && (
                <div className="mt-6">
                  <div className="h-64 w-full">
                    <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                      {/* Grid lines */}
                      <g className="grid">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <line
                            key={`h-${i}`}
                            x1="0"
                            y1={i * 50}
                            x2="400"
                            y2={i * 50}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                          />
                        ))}
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                          <line
                            key={`v-${i}`}
                            x1={i * 50}
                            y1="0"
                            x2={i * 50}
                            y2="200"
                            stroke="#e5e7eb"
                            strokeWidth="1"
                          />
                        ))}
                      </g>

                      {/* Y-axis labels */}
                      <text x="5" y="15" fontSize="10" fill="#6b7280">
                        20
                      </text>
                      <text x="5" y="65" fontSize="10" fill="#6b7280">
                        15
                      </text>
                      <text x="5" y="115" fontSize="10" fill="#6b7280">
                        10
                      </text>
                      <text x="5" y="165" fontSize="10" fill="#6b7280">
                        5
                      </text>
                      <text x="5" y="195" fontSize="10" fill="#6b7280">
                        0
                      </text>

                      {/* X-axis labels */}
                      <text x="50" y="195" fontSize="10" fill="#6b7280">
                        Jan
                      </text>
                      <text x="100" y="195" fontSize="10" fill="#6b7280">
                        Feb
                      </text>
                      <text x="150" y="195" fontSize="10" fill="#6b7280">
                        Mar
                      </text>
                      <text x="200" y="195" fontSize="10" fill="#6b7280">
                        Apr
                      </text>
                      <text x="250" y="195" fontSize="10" fill="#6b7280">
                        May
                      </text>
                      <text x="300" y="195" fontSize="10" fill="#6b7280">
                        Jun
                      </text>
                      <text x="350" y="195" fontSize="10" fill="#6b7280">
                        Jul
                      </text>

                      {/* Active Patients Line */}
                      <polyline
                        points="50,150 100,130 150,120 200,100 250,90 300,70 350,60"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                      />
                      <g>
                        {[50, 100, 150, 200, 250, 300, 350].map((x, i) => (
                          <circle
                            key={`ap-${i}`}
                            cx={x}
                            cy={[150, 130, 120, 100, 90, 70, 60][i]}
                            r="3"
                            fill="#3b82f6"
                          />
                        ))}
                      </g>

                      {/* Medical Reports Line */}
                      <polyline
                        points="50,160 100,140 150,130 200,110 250,100 300,80 350,70"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                      />
                      <g>
                        {[50, 100, 150, 200, 250, 300, 350].map((x, i) => (
                          <circle
                            key={`mr-${i}`}
                            cx={x}
                            cy={[160, 140, 130, 110, 100, 80, 70][i]}
                            r="3"
                            fill="#10b981"
                          />
                        ))}
                      </g>

                      {/* Feedback Line */}
                      <polyline
                        points="50,170 100,160 150,150 200,140 250,130 300,120 350,110"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                      />
                      <g>
                        {[50, 100, 150, 200, 250, 300, 350].map((x, i) => (
                          <circle
                            key={`fb-${i}`}
                            cx={x}
                            cy={[170, 160, 150, 140, 130, 120, 110][i]}
                            r="3"
                            fill="#f59e0b"
                          />
                        ))}
                      </g>
                    </svg>

                    {/* Legend */}
                    <div className="flex justify-center mt-2 space-x-6">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                        <span className="text-xs text-gray-600">Active Patients</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                        <span className="text-xs text-gray-600">Medical Reports</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-amber-500 rounded-full mr-1"></div>
                        <span className="text-xs text-gray-600">Feedback</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pie Chart */}
              {activeChart === "pie" && (
                <div className="mt-6 flex flex-col items-center">
                  <div className="relative w-48 h-48">
                    {/* Pie chart using CSS conic-gradient */}
                    <div
                      className="w-full h-full rounded-full"
                      style={{
                        background: `conic-gradient(
                          #3b82f6 0% ${(activePatients / (activePatients + inactivePatients + totalReports + totalFeedback)) * 100}%, 
                          #6b7280 ${(activePatients / (activePatients + inactivePatients + totalReports + totalFeedback)) * 100}% ${((activePatients + inactivePatients) / (activePatients + inactivePatients + totalReports + totalFeedback)) * 100}%, 
                          #10b981 ${((activePatients + inactivePatients) / (activePatients + inactivePatients + totalReports + totalFeedback)) * 100}% ${((activePatients + inactivePatients + totalReports) / (activePatients + inactivePatients + totalReports + totalFeedback)) * 100}%,
                          #f59e0b ${((activePatients + inactivePatients + totalReports) / (activePatients + inactivePatients + totalReports + totalFeedback)) * 100}% 100%
                        )`,
                      }}
                    ></div>
                    {/* Center circle for donut effect */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-full"></div>
                    {/* Total count in center */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <div className="text-2xl font-bold">
                        {activePatients + inactivePatients + totalReports + totalFeedback}
                      </div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-6">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-sm">Active Patients: {activePatients}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                      <span className="text-sm">Inactive Patients: {inactivePatients}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm">Medical Reports: {totalReports}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                      <span className="text-sm">Feedback: {totalFeedback}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Patients table */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Patients Management</h2>
              <p className="text-sm text-gray-500">View and manage patient accounts</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Reports
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Last Visit
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
                  {patients.map((patient) => (
  <tr key={patient._id}> {/* fixed from patient.id */}
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="font-medium text-gray-900">
        {patient.firstName} {patient.lastName} {/* fixed from patient.name */}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-gray-500">{patient.email}</div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
        patient.status === "active"
          ? "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-800"
      }`}>
        {patient.status}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-gray-500">-</td> {/* Reports column placeholder */}
    <td className="px-6 py-4 whitespace-nowrap text-gray-500">-</td> {/* Last visit placeholder */}
    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
      <div className="flex justify-end gap-2">
        <button
          onClick={() => handleStatusChange(patient._id, "active")}
          disabled={patient.status === "active"}
          className={`px-3 py-1 text-xs rounded-md border ${
            patient.status === "active"
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          Activate
        </button>
        <button
          onClick={() => handleStatusChange(patient._id, "deactivated")}
          disabled={patient.status === "deactivated"}
          className={`px-3 py-1 text-xs rounded-md border ${
            patient.status === "deactivated"
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          Deactivate
        </button>
        <button
          onClick={() => handleDelete(patient._id)}
          className="px-3 py-1 text-xs rounded-md border bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
        >
          Delete
        </button>
      </div>
    </td>
  </tr>
))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowFeedback(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Patient Feedback</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">Review feedback submitted by patients</p>
                    </div>
                    <div className="mt-4 space-y-4 max-h-[60vh] overflow-auto">
                    {feedback.map((item) => (
  <div
    key={item._id}
    className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
    onClick={() => openFeedback(item)}
  >
    <div className="flex justify-between">
   <h4 className="text-base font-medium">
  {item.patientId?.firstName || item.patientId?.lastName
    ? `${item.patientId.firstName || ""} ${item.patientId.lastName || ""}`.trim()
    : "Unknown"}
</h4>


<span className="text-sm text-gray-500">
  {new Date(item.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}
</span>

    </div>
    <p className="text-sm text-gray-700 mt-2 line-clamp-2">{item.feedbackText}</p>
  </div>
))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowFeedback(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Feedback Modal */}
{selectedFeedback && (
  <div className="fixed inset-0 z-20 overflow-y-auto">
    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div className="fixed inset-0 transition-opacity" aria-hidden="true">
        <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setSelectedFeedback(null)}></div>
      </div>
      <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
     <h3 className="text-lg leading-6 font-medium text-gray-900">
  Feedback from{" "}
{selectedFeedback.patientId?.firstName || selectedFeedback.patientId?.lastName
  ? `${selectedFeedback.patientId.firstName || ""} ${selectedFeedback.patientId.lastName || ""}`.trim()
  : "Unknown"}
 
</h3>
              <div className="mt-2">
              <p className="text-sm text-gray-500">
  Submitted on{" "}
  {selectedFeedback.createdAt
    ? new Date(selectedFeedback.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown Date"}
</p>
              </div>
              <div className="mt-4">
              <p className="text-gray-700 mt-4">{selectedFeedback.message}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={() => setSelectedFeedback(null)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  )
}
