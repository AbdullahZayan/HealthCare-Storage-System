import { useState } from "react"
import { Heart, Mail, Lock } from "lucide-react"
import { useNavigate } from "react-router-dom"

const AdminLoginPage = ({ api }) => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = `${api}/api/admin/login`
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const raw = await response.text()
      let data

      try {
        data = JSON.parse(raw)
      } catch {
        throw new Error("Invalid response from server. This might be HTML.")
      }

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      localStorage.setItem("token", data.token)
      navigate("/admin")

    } catch (err) {
      console.error("Login failed:", err.message)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 z-0">
        <img
          src="https://placehold.co/1920x1080/EEF6FF/FFFFFF?text=Admin+Login+Background"
          alt="Admin background"
          className="w-full h-full object-cover opacity-20"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-blue-100/80 to-white/90 z-0" />
      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-800">HealthCare Storage</span>
          </div>
        </div>

        <div className="bg-white border border-blue-100 rounded-lg shadow-lg">
          <div className="p-6 space-y-1 border-b">
            <h2 className="text-2xl font-semibold text-center">Admin Login</h2>
            <p className="text-gray-500 text-center">Enter your admin credentials to access the dashboard</p>
          </div>
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Only authorized admin accounts are allowed to sign in here.
        </p>
      </div>
    </div>
  )
}

export default AdminLoginPage
