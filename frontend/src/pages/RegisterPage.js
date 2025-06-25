// src/pages/RegisterPage.js
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Heart, Lock, Mail, User, Eye, EyeOff } from "lucide-react"

const RegisterPage = ({ api }) => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    if (errors[name]) {
      setErrors({ ...errors, [name]: null })
    }

    if (name === "password" || name === "confirmPassword") {
      if (formData.password && formData.confirmPassword) {
        if (name === "password" && value !== formData.confirmPassword) {
          setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }))
        } else if (name === "confirmPassword" && value !== formData.password) {
          setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }))
        } else {
          setErrors((prev) => ({ ...prev, confirmPassword: null }))
        }
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const response = await fetch(`${api}/api/patients/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Registration failed. Please try again.")
      }

      localStorage.setItem("token", result.token)
      alert("Registration successful! You can now login.")
      navigate("/login") // 🔁 Redirect after success

    } catch (error) {
      console.error("Registration failed:", error.message)
      setErrors({ ...errors, form: error.message || "Something went wrong, please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 z-0">
        <img
          src="https://placehold.co/1920x1080/EEF6FF/FFFFFF?text=Healthcare+Background"
          alt="Healthcare background"
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
            <h2 className="text-2xl font-semibold text-center">Create an account</h2>
            <p className="text-gray-500 text-center">Enter your information to register</p>
          </div>
          <div className="p-6">
            {errors.form && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">{errors.form}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {["firstName", "lastName"].map((field) => (
                  <div key={field} className="space-y-2">
                    <label htmlFor={field} className="block text-sm font-medium">
                      {field === "firstName" ? "First Name" : "Last Name"}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        id={field}
                        name={field}
                        type="text"
                        placeholder={field === "firstName" ? "John" : "Doe"}
                        className={`w-full pl-10 pr-3 py-2 border ${
                          errors[field] ? "border-red-500" : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        value={formData[field]}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
                  </div>
                ))}
              </div>

              {[{ name: "email", icon: Mail, type: "email", placeholder: "doctor@healthcare.com" },
                { name: "password", icon: Lock, type: showPassword ? "text" : "password" },
                { name: "confirmPassword", icon: Lock, type: showConfirmPassword ? "text" : "password" }].map(({ name, icon: Icon, type, placeholder }) => (
                <div key={name} className="space-y-2">
                  <label htmlFor={name} className="block text-sm font-medium">
                    {name === "confirmPassword" ? "Confirm Password" : name.charAt(0).toUpperCase() + name.slice(1)}
                  </label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id={name}
                      name={name}
                      type={type}
                      placeholder={placeholder || ""}
                      className={`w-full pl-10 pr-10 py-2 border ${
                        errors[name] ? "border-red-500" : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      value={formData[name]}
                      onChange={handleChange}
                      required
                    />
                    {name.includes("password") && (
                      <button
                        type="button"
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        onClick={
                          name === "password"
                            ? () => setShowPassword(!showPassword)
                            : () => setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {name === "password"
                          ? showPassword ? <EyeOff /> : <Eye />
                          : showConfirmPassword ? <EyeOff /> : <Eye />}
                      </button>
                    )}
                  </div>
                  {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
                </div>
              ))}

              <button
                type="submit"
                className={`w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
