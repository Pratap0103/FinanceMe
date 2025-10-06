"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { User, Lock, Eye, EyeOff, Zap } from "lucide-react"

const LoginPage = () => {
  const navigate = useNavigate()
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [masterData, setMasterData] = useState({
    userCredentials: {}, // Object where keys are IDs and values are passwords
    userRoles: {} // Object where keys are IDs and values are usernames
  })
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [toast, setToast] = useState({ show: false, message: "", type: "" })

  // Fetch master data on component mount
  useEffect(() => {
    const fetchMasterData = async () => {
      const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxu2kcsb-hF-1zMiljnjZNcFVH412khCK6-9WhXohkzXCzzApqh4zFPsoubInrSiOuy/exec"

      try {
        setIsDataLoading(true)

        // Fetch data from Login sheet
        const response = await fetch(`${SCRIPT_URL}?sheet=Login&action=fetch`)
        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch login data")
        }

        // Create userCredentials and userRoles objects from the sheet data
        const userCredentials = {}
        const userRoles = {}

        // Process the data rows (skip header row at index 0)
        const data = result.data
        console.log("Raw login sheet data:", data)

        // Start from index 1 to skip header row
        for (let i = 1; i < data.length; i++) {
          const row = data[i]
          
          // Extract data from columns A, B, C (indices 0, 1, 2)
          const userName = row[0] ? String(row[0]).trim() : '';
          const userId = row[1] ? String(row[1]).trim().toLowerCase() : '';
          const password = row[2] ? String(row[2]).trim() : '';

          console.log(`Processing row ${i}: userName=${userName}, userId=${userId}, password=${password}`);

          // Only process if we have all required fields
          if (userName && userId && password && password.trim() !== '') {
            // Store credentials using userId as key
            userCredentials[userId] = password;
            // Store username for display purposes
            userRoles[userId] = userName;

            console.log(`Added credential for ID: ${userId}, User: ${userName}`);
          }
        }

        setMasterData({ userCredentials, userRoles })
        console.log("Loaded credentials from Login sheet:", Object.keys(userCredentials).length)
        console.log("Credentials map:", userCredentials)
        console.log("User names map:", userRoles)

      } catch (error) {
        console.error("Error Fetching Login Data:", error)
        showToast(`Error loading login data: ${error.message}. Please try again later.`, "error")
      } finally {
        setIsDataLoading(false)
      }
    }

    fetchMasterData()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoginLoading(true)

    try {
      const trimmedUsername = formData.username.trim().toLowerCase()
      const trimmedPassword = formData.password.trim()

      console.log("Login Attempt Details:")
      console.log("Entered Username/ID:", trimmedUsername)
      console.log("Entered Password:", trimmedPassword)
      console.log("Available Credentials Count:", Object.keys(masterData.userCredentials).length)
      console.log("Current userCredentials:", masterData.userCredentials)
      console.log("Current userRoles:", masterData.userRoles)

      // Check if the username/ID exists in our credentials map
      if (trimmedUsername in masterData.userCredentials) {
        const correctPassword = masterData.userCredentials[trimmedUsername]
        const userName = masterData.userRoles[trimmedUsername]

        console.log("Found user in credentials map")
        console.log("Expected Password:", correctPassword)
        console.log("Password Match:", correctPassword === trimmedPassword)
        console.log("User Name:", userName)

        // Check if password matches
        if (correctPassword === trimmedPassword) {
          // Store user info in sessionStorage
          sessionStorage.setItem('userId', trimmedUsername) // Store the ID
          sessionStorage.setItem('userName', userName) // Store the actual name
          sessionStorage.setItem('username', userName) // For backward compatibility

          // For now, all users are treated as regular users
          // You can modify this logic based on your requirements
          const isAdmin = userName.toLowerCase().includes('admin') || trimmedUsername.toLowerCase().includes('admin');
          console.log(`User ${userName} (ID: ${trimmedUsername}) is admin: ${isAdmin}`);

          // Set role based on admin check
          sessionStorage.setItem('role', isAdmin ? 'admin' : 'user')

          // Set permissions
          if (isAdmin) {
            sessionStorage.setItem('department', 'all') // Admin sees all departments
            sessionStorage.setItem('isAdmin', 'true')
            console.log("ADMIN LOGIN - Setting full access permissions");
          } else {
            sessionStorage.setItem('department', trimmedUsername) // Use ID as department identifier
            sessionStorage.setItem('isAdmin', 'false')
            console.log("USER LOGIN - Setting restricted access");
          }

          // Navigate to dashboard
          navigate("/dashboard/assign-task")

          showToast(`Login successful. Welcome, ${userName}!`, "success")
          return
        } else {
          showToast("Username/ID or password is incorrect. Please try again.", "error")
        }
      } else {
        showToast("Username/ID or password is incorrect. Please try again.", "error")
      }

      // If we got here, login failed
      console.error("Login Failed", {
        usernameExists: trimmedUsername in masterData.userCredentials,
        passwordMatch: (trimmedUsername in masterData.userCredentials) ?
          "Password did not match" : 'Username/ID not found',
        userName: masterData.userRoles[trimmedUsername] || 'No user found'
      })
    } catch (error) {
      console.error("Login Error:", error)
      showToast(`Login failed: ${error.message}. Please try again.`, "error")
    } finally {
      setIsLoginLoading(false)
    }
  }

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" })
    }, 5000) // Toast duration
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-200 p-1">
        <div className="bg-white rounded-2xl p-6 shadow-inner">
          {/* Header with Icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Finance</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-gray-700 text-sm font-medium">
                User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your user ID"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-gray-700 text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-base font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg mt-6"
              disabled={isLoginLoading || isDataLoading}
            >
              {isLoginLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : isDataLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Loading...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${toast.type === "success"
          ? "bg-green-100 text-green-800 border-l-4 border-green-500"
          : "bg-red-100 text-red-800 border-l-4 border-red-500"
          }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default LoginPage