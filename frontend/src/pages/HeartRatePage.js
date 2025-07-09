import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function HeartRateDashboard({api}) {
  const [heartRateData, setHeartRateData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    heartRate: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().split(" ")[0].substring(0, 5),
  });
  const [isAddingData, setIsAddingData] = useState(false);
  const [activeTab, setActiveTab] = useState("weekly");
  const [profile, setProfile] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ average: 0, min: 0, max: 0, latest: 0 });

  const profileMenuRef = useRef(null);
  const chartCanvasRef = useRef(null);
  const navigate = useNavigate();


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    setLoading(true);
     fetch(`${api}/api/patients/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setProfile)
      .catch(console.error);

    fetch(`${api}/api/heartrate`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const formatted = data.map(item => ({
          ...item,
          heartRate: item.value,
          timestamp: item.date,
        })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setHeartRateData(formatted);
        calculateStats(formatted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const calculateStats = (data) => {
    if (!data.length) return setStats({ average: 0, min: 0, max: 0, latest: 0 });
    const heartRates = data.map(item => item.heartRate);
    setStats({
      average: Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length),
      min: Math.min(...heartRates),
      max: Math.max(...heartRates),
      latest: heartRates.at(-1),
    });
  };

  useEffect(() => {
    const handler = e => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (chartCanvasRef.current && heartRateData.length > 0) drawChart();
  }, [heartRateData, activeTab]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async e => {
    e.preventDefault();
    const heartRate = parseInt(formData.heartRate);
    if (isNaN(heartRate) || heartRate < 30 || heartRate > 220) {
      return alert("Please enter a valid heart rate between 30 and 220 BPM");
    }
    const timestamp = `${formData.date}T${formData.time}:00`;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${api}/api/heartrate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: heartRate, date: timestamp }),
      });
      const data = await res.json();
      if (res.ok) {
        const newRecord = { ...data.record, heartRate: data.record.value, timestamp: data.record.date };
        const updated = [...heartRateData, newRecord].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setHeartRateData(updated);
        calculateStats(updated);
        setIsAddingData(false);
        setFormData({
          heartRate: "",
          date: new Date().toISOString().split("T")[0],
          time: new Date().toTimeString().split(" ")[0].substring(0, 5),
        });
      } else {
        alert(data.message || "Failed to add heart rate data");
      }
    } catch (err) {
      console.error("Add HR error:", err);
      alert("Failed to add heart rate data. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getFilteredData = () => {
    const now = new Date();
    let startDate = new Date(now);
    if (activeTab === "weekly") startDate.setDate(now.getDate() - 7);
    else if (activeTab === "monthly") startDate.setMonth(now.getMonth() - 1);
    else if (activeTab === "yearly") startDate.setFullYear(now.getFullYear() - 1);
    return heartRateData.filter(item => new Date(item.timestamp) >= startDate);
  };

  // Draw chart on canvas
  const drawChart = () => {
    const canvas = chartCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const filteredData = getFilteredData();

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (filteredData.length === 0) {
      ctx.font = "16px Arial";
      ctx.fillStyle = "#666";
      ctx.textAlign = "center";
      ctx.fillText(
        "No data available for the selected period",
        canvas.width / 2,
        canvas.height / 2
      );
      return;
    }

    // Set canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const padding = 40;
    const chartWidth = canvasWidth - padding * 2;
    const chartHeight = canvasHeight - padding * 2;

    // Get min and max values for scaling
    const heartRates = filteredData.map((item) => item.heartRate);
    const minRate = Math.min(...heartRates) - 10;
    const maxRate = Math.max(...heartRates) + 10;

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;

    // Y-axis
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvasHeight - padding);

    // X-axis
    ctx.moveTo(padding, canvasHeight - padding);
    ctx.lineTo(canvasWidth - padding, canvasHeight - padding);
    ctx.stroke();

    // Draw grid lines and labels for Y-axis
    const yStep = Math.ceil((maxRate - minRate) / 5);
    ctx.font = "12px Arial";
    ctx.fillStyle = "#666";
    ctx.textAlign = "right";

    for (let i = 0; i <= 5; i++) {
      const value = minRate + i * yStep;
      const y =
        canvasHeight -
        padding -
        ((value - minRate) / (maxRate - minRate)) * chartHeight;

      // Grid line
      ctx.beginPath();
      ctx.strokeStyle = "#eee";
      ctx.moveTo(padding, y);
      ctx.lineTo(canvasWidth - padding, y);
      ctx.stroke();

      // Label
      ctx.fillText(value.toFixed(0), padding - 5, y + 4);
    }

    // Draw X-axis labels
    const xStep = Math.max(1, Math.floor(filteredData.length / 7));
    ctx.textAlign = "center";

    for (let i = 0; i < filteredData.length; i += xStep) {
      const x = padding + (i / (filteredData.length - 1)) * chartWidth;
      const date = new Date(filteredData[i].timestamp);
      const label = `${date.getDate()}/${date.getMonth() + 1}`;

      // Label
      ctx.fillText(label, x, canvasHeight - padding + 15);
    }

    // Draw line chart
    ctx.beginPath();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;

    for (let i = 0; i < filteredData.length; i++) {
      const x = padding + (i / (filteredData.length - 1)) * chartWidth;
      const y =
        canvasHeight -
        padding -
        ((filteredData[i].heartRate - minRate) / (maxRate - minRate)) *
          chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw points
    for (let i = 0; i < filteredData.length; i++) {
      const x = padding + (i / (filteredData.length - 1)) * chartWidth;
      const y =
        canvasHeight -
        padding -
        ((filteredData[i].heartRate - minRate) / (maxRate - minRate)) *
          chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = "#3b82f6";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw chart title
    ctx.font = "16px Arial";
    ctx.fillStyle = "#333";
    ctx.textAlign = "center";
    ctx.fillText("Heart Rate Over Time (BPM)", canvasWidth / 2, padding - 15);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
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
              className="font-medium text-blue-600 flex items-center gap-1"
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
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-800">
              Heart Rate Dashboard
            </h1>
            <p className="text-blue-600">
              Monitor and track your heart rate over time
            </p>
          </div>
          <button
            onClick={() => setIsAddingData(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Heart Rate Data
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md border border-blue-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">
                Latest Heart Rate
              </h3>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-500"
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
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {stats.latest} BPM
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border border-blue-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">
                Average Heart Rate
              </h3>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {stats.average} BPM
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border border-blue-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">
                Minimum Heart Rate
              </h3>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {stats.min} BPM
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border border-blue-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">
                Maximum Heart Rate
              </h3>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {stats.max} BPM
            </p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-lg border border-blue-200 shadow-md overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-blue-800">
                Heart Rate Trends
              </h2>
              <p className="text-sm text-gray-500">
                Visualize your heart rate patterns over time
              </p>
            </div>
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setActiveTab("weekly")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "weekly"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } border border-blue-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
              >
                Weekly
              </button>
              <button
                onClick={() => setActiveTab("monthly")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "monthly"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } border-t border-b border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              >
                Monthly
              </button>
              <button
                onClick={() => setActiveTab("yearly")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "yearly"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } border border-blue-300 rounded-r-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
              >
                Yearly
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="w-full h-96 bg-white">
              <canvas
                ref={chartCanvasRef}
                width="800"
                height="400"
                className="w-full h-full"
              ></canvas>
            </div>
          </div>
        </div>

        {/* Recent Readings Table */}
        <div className="bg-white rounded-lg border border-blue-200 shadow-md overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
            <h2 className="text-xl font-bold text-blue-800">Recent Readings</h2>
            <p className="text-sm text-gray-500">
              Your most recent heart rate measurements
            </p>
          </div>
          <div className="p-6">
            <div className="rounded-md border overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date & Time
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Heart Rate (BPM)
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {heartRateData.length > 0 ? (
                    [...heartRateData]
                      .sort(
                        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
                      )
                      .slice(0, 10)
                      .map((reading) => (
                        <tr key={reading._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(reading.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {reading.heartRate} BPM
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {reading.heartRate < 60 ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Low
                              </span>
                            ) : reading.heartRate > 100 ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                High
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Normal
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No heart rate data available. Add your first reading!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add Heart Rate Data Modal */}
      {isAddingData && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setIsAddingData(false)}
              ></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Add Heart Rate Reading
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Enter your heart rate measurement and the date/time it
                        was taken.
                      </p>
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-2">
                          <label
                            htmlFor="heartRate"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Heart Rate (BPM)
                          </label>
                          <input
                            id="heartRate"
                            name="heartRate"
                            type="number"
                            min="30"
                            max="220"
                            placeholder="e.g., 72"
                            required
                            value={formData.heartRate}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label
                            htmlFor="date"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Date
                          </label>
                          <input
                            id="date"
                            name="date"
                            type="date"
                            required
                            value={formData.date}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label
                            htmlFor="time"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Time
                          </label>
                          <input
                            id="time"
                            name="time"
                            type="time"
                            required
                            value={formData.time}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                          />
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
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <p>
                              Normal resting heart rate for adults ranges from
                              60 to 100 beats per minute. Athletes may have
                              lower heart rates.
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
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Save Reading
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingData(false)}
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
    </div>
  );
}
