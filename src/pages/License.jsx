import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Plus, 
  Target, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  PiggyBank, 
  Clock,
  X,
  ArrowLeft,
  CheckCircle2,
  Search,
  Download,
  Filter,
  Menu
} from 'lucide-react'
import AdminLayout from '../components/layout/AdminLayout'

// Configuration
const CONFIG = {
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxu2kcsb-hF-1zMiljnjZNcFVH412khCK6-9WhXohkzXCzzApqh4zFPsoubInrSiOuy/exec',
  DREAMS_SHEET: 'Dreams',
  DREAM_TRACKER_SHEET: 'Dream Tracker',
  PAGE_CONFIG: {
    title: "Dreams Tracker",
  },
}

// Helper functions
const formatDate = (dateInput) => {
  if (!dateInput) return ''
  
  try {
    let date
    if (typeof dateInput === 'string' && dateInput.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateInput
    }
    
    if (typeof dateInput === 'string' && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateInput.split('-')
      return `${day}/${month}/${year}`
    }
    
    date = new Date(dateInput)
    if (isNaN(date.getTime())) {
      return dateInput.toString()
    }
    
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    
    return `${day}/${month}/${year}`
  } catch (error) {
    console.error('Error formatting date:', error)
    return dateInput.toString()
  }
}

const formatTimestamp = (date = new Date()) => {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}

// Custom hooks
function useDreamData() {
  const [dreams, setDreams] = useState([])
  const [dreamTrackers, setDreamTrackers] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchDreams = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?sheet=${CONFIG.DREAMS_SHEET}&action=fetch`)
      const data = await response.json()
      
      if (data.success && data.data) {
        const dreamData = data.data.slice(1).map((row, index) => ({
          id: index + 1,
          timestamp: row[0] || '',
          serialNo: row[1] || '',
          dreamId: row[2] || '',
          dreamName: row[3] || '',
          totalCost: parseFloat(row[4]) || 0,
          startDate: formatDate(row[5]) || '',
          endDate: formatDate(row[6]) || '',
          description: row[7] || ''
        })).filter(d => d.dreamId)
        
        setDreams(dreamData)
      }
    } catch (error) {
      console.error('Error fetching dreams:', error)
      alert('Failed to fetch dreams. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchDreamTrackers = async () => {
    try {
      const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?sheet=${CONFIG.DREAM_TRACKER_SHEET}&action=fetch`)
      const data = await response.json()
      
      if (data.success && data.data) {
        const trackerData = data.data.slice(1).map((row, index) => ({
          id: index + 1,
          timestamp: row[0] || '',
          serialNo: row[1] || '',
          dreamId: row[2] || '',
          dreamName: row[3] || '',
          addAmount: parseFloat(row[4]) || 0,
          remarks: row[5] || ''
        })).filter(t => t.dreamId)
        
        setDreamTrackers(trackerData)
      }
    } catch (error) {
      console.error('Error fetching dream trackers:', error)
    }
  }

  const addDreamToState = (newDream) => {
    setDreams(prev => [newDream, ...prev])
  }

  const addTrackerToState = (newTracker) => {
    setDreamTrackers(prev => [newTracker, ...prev])
  }

  return {
    dreams,
    dreamTrackers,
    loading,
    fetchDreams,
    fetchDreamTrackers,
    addDreamToState,
    addTrackerToState
  }
}

// Add Dream Form Component
function AddDreamForm({ isOpen, setIsOpen, onDreamAdded }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    dreamName: '',
    totalCost: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.dreamName || !formData.totalCost || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      
      const timestamp = formatTimestamp()
      const rowData = [
        timestamp,
        'SN-001', // Will be replaced by server
        'DN-001', // Will be replaced by server
        formData.dreamName,
        parseFloat(formData.totalCost),
        formatDate(formData.startDate),
        formatDate(formData.endDate),
        formData.description
      ]

      const formDataToSend = new FormData()
      formDataToSend.append('sheetName', CONFIG.DREAMS_SHEET)
      formDataToSend.append('action', 'insertDream')
      formDataToSend.append('rowData', JSON.stringify(rowData))

      const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: formDataToSend
      })

      const result = await response.json()
      
      if (result.success) {
        const newDream = {
          id: Date.now(),
          timestamp: timestamp,
          serialNo: result.serialNo || 'SN-001',
          dreamId: result.dreamId || 'DN-001',
          dreamName: formData.dreamName,
          totalCost: parseFloat(formData.totalCost),
          startDate: formatDate(formData.startDate),
          endDate: formatDate(formData.endDate),
          description: formData.description
        }

        onDreamAdded(newDream)
        alert(`Dream added successfully! Dream ID: ${result.dreamId || 'DN-001'}`)
        
        setFormData({
          dreamName: '',
          totalCost: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          description: ''
        })
        setIsOpen(false)
      } else {
        throw new Error(result.error || 'Failed to add dream')
      }
    } catch (error) {
      console.error('Error adding dream:', error)
      alert('Failed to save dream. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-md transform transition-all duration-300 border border-gray-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">Add New Dream</h2>
          <p className="text-gray-500 text-sm">Create your financial goal</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Dream Name *</label>
            <input
              type="text"
              placeholder="Enter your dream"
              value={formData.dreamName}
              onChange={(e) => setFormData(prev => ({ ...prev, dreamName: e.target.value }))}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 text-sm bg-gray-50/30"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Total Cost (₹) *</label>
            <div className="relative">
              <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-semibold">₹</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.totalCost}
                onChange={(e) => setFormData(prev => ({ ...prev, totalCost: e.target.value }))}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 text-sm bg-gray-50/30"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 text-sm bg-gray-50/30"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 text-sm bg-gray-50/30"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              placeholder="Describe your dream..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 text-sm bg-gray-50/30 resize-none"
              rows={3}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full sm:flex-1 px-4 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 font-semibold text-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 px-4 py-2 sm:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Add Amount Form Component
function AddAmountForm({ isOpen, setIsOpen, dreamData, onAmountAdded }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    addAmount: '',
    remarks: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.addAmount || !formData.remarks) {
      alert('Please fill in all fields')
      return
    }

    try {
      setLoading(true)
      
      const timestamp = formatTimestamp()
      // Correct column mapping for Dream Tracker sheet:
      // A: Timestamp, B: Serial No., C: Dream ID, D: Dream Name, E: Add Amount, F: Remarks
      const rowData = [
        timestamp,           // Column A - Timestamp
        'SN-001',           // Column B - Serial No. (will be replaced by server)
        dreamData.dreamId,  // Column C - Dream ID
        dreamData.dreamName, // Column D - Dream Name
        parseFloat(formData.addAmount), // Column E - Add Amount
        formData.remarks    // Column F - Remarks
      ]

      const formDataToSend = new FormData()
      formDataToSend.append('sheetName', CONFIG.DREAM_TRACKER_SHEET)
      formDataToSend.append('action', 'insertTracker')
      formDataToSend.append('rowData', JSON.stringify(rowData))

      const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: formDataToSend
      })

      const result = await response.json()
      
      if (result.success) {
        const newTracker = {
          id: Date.now(),
          timestamp: timestamp,
          serialNo: result.serialNo || 'SN-001',
          dreamId: dreamData.dreamId,
          dreamName: dreamData.dreamName,
          addAmount: parseFloat(formData.addAmount),
          remarks: formData.remarks
        }

        onAmountAdded(newTracker)
        alert('Amount added successfully!')
        
        setFormData({
          addAmount: '',
          remarks: ''
        })
        setIsOpen(false)
      } else {
        throw new Error(result.error || 'Failed to add amount')
      }
    } catch (error) {
      console.error('Error adding amount:', error)
      alert('Failed to add amount. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-md transform transition-all duration-300 border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">Add Amount</h2>
          <p className="text-gray-500 text-sm">Save money towards your dream</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Dream ID</label>
            <input
              type="text"
              value={dreamData?.dreamId || ''}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Dream Name</label>
            <input
              type="text"
              value={dreamData?.dreamName || ''}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Total Cost</label>
            <input
              type="text"
              value={`₹${dreamData?.totalCost?.toLocaleString() || '0'}`}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Add Amount (₹) *</label>
            <div className="relative">
              <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-semibold">₹</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.addAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, addAmount: e.target.value }))}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 text-sm bg-gray-50/30"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks *</label>
            <textarea
              placeholder="Add your remarks..."
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 text-sm bg-gray-50/30 resize-none"
              rows={3}
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full sm:flex-1 px-4 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 font-semibold text-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 px-4 py-2 sm:py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Dream Detail View Component
function DreamDetailView({ dream, dreamTrackers, onBack }) {
  const currentSaved = useMemo(() => {
    return dreamTrackers
      .filter(t => t.dreamId === dream.dreamId)
      .reduce((sum, t) => sum + t.addAmount, 0)
  }, [dreamTrackers, dream.dreamId])

  const remainingAmount = dream.totalCost - currentSaved
  const progressPercentage = (currentSaved / dream.totalCost) * 100

  const dreamTransactions = dreamTrackers.filter(t => t.dreamId === dream.dreamId)

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dreams
      </button>

      {/* Dream Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{dream.dreamName}</h1>
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm">{dream.description || 'No description provided'}</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                {dream.startDate} - {dream.endDate}
              </span>
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium w-fit">
                {dream.dreamId}
              </span>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">₹{dream.totalCost.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-gray-500">Target Amount</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 sm:mt-6">
          <div className="flex justify-between text-xs sm:text-sm font-medium text-gray-700 mb-2">
            <span>Progress</span>
            <span>{Math.min(progressPercentage, 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
            <div
              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 sm:h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-gradient-to-br from-blue-400/20 to-blue-500/30 border border-blue-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-xs sm:text-sm font-medium">Total Amount</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-800">₹{dream.totalCost.toLocaleString()}</p>
            </div>
            <Target className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-400/20 to-green-500/30 border border-green-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-xs sm:text-sm font-medium">Current Saved</p>
              <p className="text-lg sm:text-2xl font-bold text-green-800">₹{currentSaved.toLocaleString()}</p>
            </div>
            <PiggyBank className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-400/20 to-purple-500/30 border border-purple-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-xs sm:text-sm font-medium">Remaining</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-800">₹{Math.max(remainingAmount, 0).toLocaleString()}</p>
            </div>
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Savings History</h2>
          <p className="text-gray-600 text-xs sm:text-sm">Track your progress towards this dream</p>
        </div>

        <div className="overflow-x-auto">
          {/* Desktop Table */}
          <div className="hidden sm:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Serial No.</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Dream ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Dream Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Add Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Remarks</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {dreamTransactions.length > 0 ? (
                  dreamTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.serialNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                          {transaction.dreamId}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {transaction.dreamName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        +₹{transaction.addAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {transaction.remarks}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <PiggyBank className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-semibold">No savings recorded yet</p>
                      <p className="text-sm">Start saving towards your dream!</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3 p-3">
            {dreamTransactions.length > 0 ? (
              dreamTransactions.map((transaction) => (
                <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                      {transaction.dreamId}
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      +₹{transaction.addAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-800">{transaction.dreamName}</p>
                    <p className="text-xs text-gray-600">{transaction.remarks}</p>
                    <div className="text-xs text-gray-500 pt-1 border-t border-gray-100">
                      #{transaction.serialNo}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <PiggyBank className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-500">No savings recorded yet</p>
                <p className="text-xs text-gray-400">Start saving towards your dream!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Dreams Component
function Dreams() {
  const {
    dreams,
    dreamTrackers,
    loading,
    fetchDreams,
    fetchDreamTrackers,
    addDreamToState,
    addTrackerToState
  } = useDreamData()

  const [isAddDreamOpen, setIsAddDreamOpen] = useState(false)
  const [isAddAmountOpen, setIsAddAmountOpen] = useState(false)
  const [selectedDream, setSelectedDream] = useState(null)
  const [detailView, setDetailView] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchDreams()
    fetchDreamTrackers()
  }, [])

  const handleDreamAdded = (newDream) => {
    addDreamToState(newDream)
    setSuccessMessage('Dream added successfully!')
    setTimeout(() => setSuccessMessage(''), 5000)
  }

  const handleAmountAdded = (newTracker) => {
    addTrackerToState(newTracker)
    setSuccessMessage('Amount added successfully!')
    setTimeout(() => setSuccessMessage(''), 5000)
  }

  const handleAddAmount = (dream) => {
    setSelectedDream(dream)
    setIsAddAmountOpen(true)
  }

  const handleDreamClick = (dream) => {
    setDetailView(dream)
  }

  // Filter dreams based on search
  const filteredDreams = useMemo(() => {
    return dreams.filter(dream => 
      dream.dreamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dream.dreamId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dream.description && dream.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [dreams, searchTerm])

  if (detailView) {
    return (
      <AdminLayout>
        <DreamDetailView
          dream={detailView}
          dreamTrackers={dreamTrackers}
          onBack={() => setDetailView(null)}
        />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-4 p-2 sm:p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 sm:items-center">
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-800">
              {CONFIG.PAGE_CONFIG.title}
            </h1>
            <p className="text-gray-600 text-sm mt-1">Track and achieve your financial dreams</p>
          </div>

          {/* Mobile: Add Dream & Menu Button */}
          <div className="flex gap-2 sm:hidden">
            <button
              onClick={() => setIsAddDreamOpen(true)}
              className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm flex items-center justify-center font-medium"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Dream
            </button>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          {/* Desktop: All Controls */}
          <div className="hidden sm:flex flex-wrap gap-2">
            <button
              onClick={() => setIsAddDreamOpen(true)}
              className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg hover:shadow-md text-sm flex items-center font-medium transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add New Dream
            </button>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search dreams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-400 text-sm bg-white/70"
              />
            </div>
          </div>
        </div>

        {/* Mobile Filters Panel */}
        {showMobileFilters && (
          <div className="sm:hidden bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search dreams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-400 text-sm bg-gray-50/30"
              />
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
              <span className="text-sm">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-green-500 hover:text-green-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Dreams Table */}
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200 p-3 sm:p-4">
            <div>
              <h2 className="text-gray-800 font-semibold flex items-center text-sm sm:text-base">
                Your Dreams
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm">
                Manage and track your financial goals
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-gray-600 text-sm">Loading dreams...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Dream ID</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Dream Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Start Date</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">End Date</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredDreams.length > 0 ? (
                      filteredDreams.map((dream) => (
                        <tr 
                          key={dream.id} 
                          className="hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                          onClick={() => handleDreamClick(dream)}
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddAmount(dream)
                              }}
                              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors"
                            >
                              Add
                            </button>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                              {dream.dreamId}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {dream.dreamName}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-purple-600">
                            ₹{dream.totalCost.toLocaleString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {dream.startDate}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {dream.endDate}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                            {dream.description || 'No description'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-gray-500 text-sm">
                          <div className="bg-gray-100 rounded-full p-6 w-fit mx-auto mb-4">
                            <Target className="h-12 w-12 text-gray-400" />
                          </div>
                          <p className="text-gray-500 text-lg font-semibold">
                            {loading ? 'Loading dreams...' : searchTerm ? 'No dreams found matching your search' : 'No dreams found'}
                          </p>
                          {!searchTerm && (
                            <p className="text-gray-400 text-sm">Create your first financial dream to get started</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3 p-3">
                {filteredDreams.length > 0 ? (
                  filteredDreams.map((dream) => (
                    <div
                      key={dream.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleDreamClick(dream)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                              {dream.dreamId}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddAmount(dream)
                              }}
                              className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium"
                            >
                              Add
                            </button>
                          </div>
                          <h3 className="font-semibold text-gray-800 text-sm">{dream.dreamName}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-600">₹{dream.totalCost.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-gray-600">{dream.description || 'No description'}</p>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{dream.startDate}</span>
                          <span>{dream.endDate}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 rounded-full p-6 w-fit mx-auto mb-4">
                      <Target className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-base font-semibold text-gray-500">
                      {searchTerm ? 'No dreams found' : 'No dreams created yet'}
                    </p>
                    {!searchTerm && (
                      <p className="text-sm text-gray-400">Create your first financial dream</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Dream Modal */}
      <AddDreamForm
        isOpen={isAddDreamOpen}
        setIsOpen={setIsAddDreamOpen}
        onDreamAdded={handleDreamAdded}
      />

      {/* Add Amount Modal */}
      <AddAmountForm
        isOpen={isAddAmountOpen}
        setIsOpen={setIsAddAmountOpen}
        dreamData={selectedDream}
        onAmountAdded={handleAmountAdded}
      />
    </AdminLayout>
  )
}

export default Dreams