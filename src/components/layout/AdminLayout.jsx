"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { 
  CheckSquare, 
  ClipboardList, 
  Home, 
  LogOut, 
  Menu, 
  Database, 
  ChevronDown, 
  ChevronRight,
  FileText,
  Coffee,
  Box,
  Trash2,
  Home as HomeIcon,
  Shirt,
  ShoppingBasket,
  Key,
  SlidersHorizontal,
  Bell,
  Search,
  Settings,
  X
} from 'lucide-react'

export default function AdminLayout({ children, darkMode, toggleDarkMode, hideSidebar = false }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDataSubmenuOpen, setIsDataSubmenuOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [userRole, setUserRole] = useState("")

  // Check authentication on component mount
  useEffect(() => {
    const storedUsername = sessionStorage.getItem('username')
    const storedRole = sessionStorage.getItem('role')
    
    if (!storedUsername) {
      // Redirect to login if not authenticated
      navigate("/login")
      return
    }
  
    setUsername(storedUsername)
    setUserRole(storedRole || "user")
    
    // Redirect to dashboard if user is on base path or login was just completed
    if (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/dashboard") {
      navigate("/dashboard/admin", { replace: true })
    }
  }, [navigate, location.pathname])

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('username')
    sessionStorage.removeItem('role')
    sessionStorage.removeItem('department')
    navigate("/login")
  }

  // Filter dataCategories based on user role
  const dataCategories = [
    { id: "sales", name: "Checklist", link: "/dashboard/data/sales" },
  ]

  // Update the routes array with only existing pages
  const routes = [
    {
      href: "/dashboard/admin",
      label: "Dashboard",
      icon: Database,
      active: location.pathname === "/dashboard/admin",
      showFor: ["admin", "user"]
    },
    {
      href: "/dashboard/Inventory",
      label: "Transactions",
      icon: Box,
      active: location.pathname === "/dashboard/Inventory",
      showFor: ["admin", "user"]
    },
    {
      href: "/dashboard/License",
      label: "Dreams",
      icon: Key,
      active: location.pathname === "/dashboard/License",
      showFor: ["admin", "user"]
    },
    {
      href: "/dashboard/assign-task",
      label: "Fuel",
      icon: FileText,
      active: location.pathname === "/dashboard/assign-task",
      showFor: ["admin", "user"]
    }
  ]

  const getAccessibleDepartments = () => {
    const userRole = sessionStorage.getItem('role') || 'user'
    return dataCategories.filter(cat => 
      !cat.showFor || cat.showFor.includes(userRole)
    )
  }

  // Filter routes based on user role
  const getAccessibleRoutes = () => {
    const userRole = sessionStorage.getItem('role') || 'user'
    return routes.filter(route => 
      route.showFor.includes(userRole)
    )
  }

  // Check if the current path is a data category page
  const isDataPage = location.pathname.includes("/dashboard/data/")
  
  // If it's a data page, expand the submenu by default
  useEffect(() => {
    if (isDataPage && !isDataSubmenuOpen) {
      setIsDataSubmenuOpen(true)
    }
  }, [isDataPage, isDataSubmenuOpen])

  // Get accessible routes and departments
  const accessibleRoutes = getAccessibleRoutes()
  const accessibleDepartments = getAccessibleDepartments()

  // If hideSidebar is true, render without sidebar
  if (hideSidebar) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <main className={`p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar for desktop */}
      <aside className={`hidden w-72 flex-shrink-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r md:flex md:flex-col shadow-xl`}>
        {/* Logo Section */}
        <div className={`flex h-16 items-center px-6 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gradient-to-r from-blue-600 to-purple-600'} border-b`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-blue-500' : 'bg-white/20'} flex items-center justify-center`}>
              <ShoppingBasket className={`h-5 w-5 ${darkMode ? 'text-white' : 'text-white'}`} />
            </div>
            <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-white'}`}>Finance</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {accessibleRoutes.map((route) => (
              <li key={route.label}>
                {route.submenu ? (
                  <div>
                    <button
                      onClick={() => setIsDataSubmenuOpen(!isDataSubmenuOpen)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        route.active
                          ? `${darkMode ? 'bg-blue-600 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'} shadow-lg`
                          : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-blue-50'} hover:scale-105`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <route.icon className={`h-5 w-5 ${route.active ? "text-white" : ""}`} />
                        {route.label}
                      </div>
                      {isDataSubmenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    {isDataSubmenuOpen && (
                      <ul className="mt-2 ml-8 space-y-1">
                        {accessibleDepartments.map((category) => (
                          <li key={category.id}>
                            <Link
                              to={category.link || `/dashboard/data/${category.id}`}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                                location.pathname === (category.link || `/dashboard/data/${category.id}`)
                                  ? `${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'} font-medium`
                                  : `${darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`
                              }`}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <div className={`w-2 h-2 rounded-full ${location.pathname === (category.link || `/dashboard/data/${category.id}`) ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                              {category.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={route.href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      route.active
                        ? `${darkMode ? 'bg-blue-600 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'} shadow-lg`
                        : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-blue-50'} hover:scale-105`
                    }`}
                  >
                    <route.icon className={`h-5 w-5 ${route.active ? "text-white" : ""}`} />
                    {route.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile Section */}
        <div className={`border-t p-4 ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-3 p-3 rounded-xl">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-sm font-bold text-white">{username ? username.charAt(0).toUpperCase() : 'U'}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                {username || "User"} {userRole === "admin" && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-1">Admin</span>}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                Online
              </p>
            </div>
            <div className="flex items-center gap-1">
              {toggleDarkMode && (
                <button 
                  onClick={toggleDarkMode} 
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                >
                  {darkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646A9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
              )}
              <button 
                onClick={handleLogout}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={`md:hidden fixed left-4 top-4 z-50 p-2 rounded-xl shadow-lg transition-colors ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className={`fixed inset-y-0 left-0 w-80 shadow-2xl transform transition-transform duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Mobile Logo */}
            <div className={`flex h-16 items-center px-6 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gradient-to-r from-blue-600 to-purple-600'} border-b`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-blue-500' : 'bg-white/20'} flex items-center justify-center`}>
                  <ShoppingBasket className={`h-5 w-5 ${darkMode ? 'text-white' : 'text-white'}`} />
                </div>
                <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-white'}`}>Grocery IMS</span>
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-2">
                {accessibleRoutes.map((route) => (
                  <li key={route.label}>
                    {route.submenu ? (
                      <div>
                        <button
                          onClick={() => setIsDataSubmenuOpen(!isDataSubmenuOpen)}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                            route.active
                              ? `${darkMode ? 'bg-blue-600 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'} shadow-lg`
                              : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-blue-50'}`
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <route.icon className={`h-5 w-5 ${route.active ? "text-white" : ""}`} />
                            {route.label}
                          </div>
                          {isDataSubmenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        {isDataSubmenuOpen && (
                          <ul className="mt-2 ml-8 space-y-1">
                            {accessibleDepartments.map((category) => (
                              <li key={category.id}>
                                <Link
                                  to={category.link || `/dashboard/data/${category.id}`}
                                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                                    location.pathname === (category.link || `/dashboard/data/${category.id}`)
                                      ? `${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'} font-medium`
                                      : `${darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`
                                  }`}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  <div className={`w-2 h-2 rounded-full ${location.pathname === (category.link || `/dashboard/data/${category.id}`) ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                                  {category.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={route.href}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                          route.active
                            ? `${darkMode ? 'bg-blue-600 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'} shadow-lg`
                            : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-blue-50'}`
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <route.icon className={`h-5 w-5 ${route.active ? "text-white" : ""}`} />
                        {route.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Mobile User Profile */}
            <div className={`border-t p-4 ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-3 p-3 rounded-xl">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{username ? username.charAt(0).toUpperCase() : 'U'}</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                    {username || "User"} {userRole === "admin" && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-1">Admin</span>}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                    Online
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {toggleDarkMode && (
                    <button 
                      onClick={toggleDarkMode} 
                      className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                    >
                      {darkMode ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646A9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                    </button>
                  )}
                  <button 
                    onClick={handleLogout}
                    className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}