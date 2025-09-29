"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CheckCircle2,
  X,
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  Download,
  Filter,
  Package,
  Plus,
  Calendar,
  Tag,
  Menu
} from "lucide-react";
import AdminLayout from "../components/layout/AdminLayout";

// Configuration object
const CONFIG = {
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzZOuu2S5TheMw4wmPPD4atlFXkbCjkm-trXDLA1KjJ5NCfcfOsks8Z9rkEH8dtFsKmQQ/exec',
  SHEET_NAME: 'Daily',
  PAGE_CONFIG: {
    title: "Finance Transactions",
  },
};

// Column configuration for visibility filter (removed timestamp)
const COLUMN_CONFIG = [
  { key: 'serialNo', label: 'Serial No', pendingOnly: false },
  { key: 'type', label: 'Transaction Type', pendingOnly: false },
  { key: 'amount', label: 'Amount', pendingOnly: false },
  { key: 'category', label: 'Category', pendingOnly: false },
  { key: 'description', label: 'Description', pendingOnly: false },
  { key: 'date', label: 'Date of Transaction', pendingOnly: false },
];

// Debounce hook for search optimization
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Helper function to format date as DD/MM/YYYY
const formatDateToDDMMYYYY = (dateInput) => {
  if (!dateInput) return '';
  
  try {
    let date;
    
    // If it's already in DD/MM/YYYY format, return as is
    if (typeof dateInput === 'string' && dateInput.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateInput;
    }
    
    // If it's in YYYY-MM-DD format (from date input), convert it
    if (typeof dateInput === 'string' && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateInput.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // If it's a Date object or other format, parse and format
    date = new Date(dateInput);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateInput.toString();
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateInput.toString();
  }
};

// Custom hook for finance data
function useFinanceData() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?sheet=${CONFIG.SHEET_NAME}&action=fetch`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Skip header row and map the data according to column structure
        const transactionData = data.data.slice(1).map((row, index) => ({
          id: index + 1,
          serialNo: row[1] || '',         // Column B - Serial No
          type: row[2] || '',             // Column C - Transaction Type
          amount: parseFloat(row[3]) || 0, // Column D - Amount
          category: row[4] || '',         // Column E - Category
          description: row[5] || '',      // Column F - Description
          date: formatDateToDDMMYYYY(row[6]) || '' // Column G - Date of Transaction (format to DD/MM/YYYY)
        })).filter(t => t.serialNo); // Filter out empty rows
        
        setTransactions(transactionData);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      alert('Failed to fetch transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to add transaction to local state immediately
  const addTransactionToState = (newTransaction) => {
    setTransactions(prevTransactions => [newTransaction, ...prevTransactions]);
  };

  // Function to update transaction in state after server response
  const updateTransactionInState = (tempId, updatedTransaction) => {
    setTransactions(prevTransactions => 
      prevTransactions.map(t => 
        t.id === tempId ? { ...updatedTransaction, id: updatedTransaction.id } : t
      )
    );
  };

  // Function to remove transaction from state (for error handling)
  const removeTransactionFromState = (transactionId) => {
    setTransactions(prevTransactions => 
      prevTransactions.filter(t => t.id !== transactionId)
    );
  };

  return { 
    transactions, 
    fetchTransactions, 
    loading, 
    addTransactionToState, 
    updateTransactionInState,
    removeTransactionFromState,
    setTransactions 
  };
}

// Add Transaction Form Component
function AddTransactionForm({ isOpen, setIsOpen, transactionHandlers }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Bonus', 'Other Income'];
  const expenseCategories = ['Rent', 'Groceries', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Other'];

  // Helper function to format timestamp as DD/MM/YYYY HH:mm:ss (for backend only)
  const formatTimestamp = (date = new Date()) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const addTransaction = async (transactionData) => {
    try {
      setLoading(true);
      
      const now = new Date();
      const timestamp = formatTimestamp(now);
      
      // Format date as DD/MM/YYYY
      const formattedDate = formatDateToDDMMYYYY(transactionData.date);
      
      // Send transaction data with type, let Google Apps Script generate the serial number
      const rowData = [
        timestamp,           // Column A - Timestamp
        transactionData.type, // Column B - Transaction Type (will be replaced with serial number by server)
        transactionData.type, // Column C - Transaction Type
        transactionData.amount, // Column D - Amount
        transactionData.category, // Column E - Category
        transactionData.description, // Column F - Description
        formattedDate       // Column G - Date of Transaction
      ];

      const formDataToSend = new FormData();
      formDataToSend.append('sheetName', CONFIG.SHEET_NAME);
      formDataToSend.append('action', 'insert');
      formDataToSend.append('transactionType', transactionData.type); // Send transaction type separately
      formDataToSend.append('rowData', JSON.stringify(rowData));

      const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: formDataToSend
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          serial: result.serial,
          formattedDate: formattedDate
        };
      } else {
        throw new Error(result.error || 'Failed to save transaction');
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.type || !formData.amount || !formData.category || !formData.description) {
      alert('Please fill in all fields');
      return;
    }

    // Create temporary ID for immediate display
    const tempId = `TEMP-${Date.now()}`;
    const tempSerialNo = `TEMP-${Math.random().toString(36).substr(2, 9)}`;
    
    // Format date for display
    const displayDate = formatDateToDDMMYYYY(formData.date);
    
    // Create temporary transaction object for immediate UI update
    const tempTransaction = {
      id: tempId,
      serialNo: tempSerialNo,
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      date: displayDate
    };

    // Add to UI immediately
    if (transactionHandlers && transactionHandlers.addTransactionToState) {
      transactionHandlers.addTransactionToState(tempTransaction);
    }

    try {
      // Submit to server
      const result = await addTransaction({
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        date: formData.date
      });

      if (result.success) {
        // Update the temporary transaction with real data from server
        const updatedTransaction = {
          ...tempTransaction,
          id: Date.now(), // New ID for the real transaction
          serialNo: result.serial,
          date: result.formattedDate
        };

        // Update the transaction in state with real server data
        if (transactionHandlers && transactionHandlers.updateTransactionInState) {
          transactionHandlers.updateTransactionInState(tempId, updatedTransaction);
        }

        // Show success message
        alert(`Transaction added successfully! Serial Number: ${result.serial}`);
        
        // Reset form and close modal
        setFormData({
          type: '',
          amount: '',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
        setIsOpen(false);
      }
    } catch (error) {
      // Remove the temporary transaction on error
      if (transactionHandlers && transactionHandlers.removeTransactionFromState) {
        transactionHandlers.removeTransactionFromState(tempId);
      }
      alert('Failed to save transaction. Please try again.');
    }
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

  if (!isOpen) return null;

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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">New Transaction</h2>
          <p className="text-gray-500 text-sm">Add a new income or expense</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Type of Transaction */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type of Transaction</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value, category: '' }))}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 text-sm bg-gray-50/30"
              required
            >
              <option value="">Select</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-semibold">₹</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 text-sm bg-gray-50/30"
                required
              />
            </div>
          </div>

          {/* Select Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Category</label>
            <div className="relative">
              <Tag className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 appearance-none text-sm bg-gray-50/30"
                required
                disabled={!formData.type}
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <input
              type="text"
              placeholder="Enter description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 text-sm bg-gray-50/30"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 text-sm bg-gray-50/30"
                required
              />
            </div>
          </div>

          {/* Buttons */}
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
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FinanceTransactions({ refreshTrigger, onTransactionAdded }) {
  const { 
    transactions, 
    fetchTransactions, 
    loading, 
    addTransactionToState, 
    updateTransactionInState,
    removeTransactionFromState
  } = useFinanceData();

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Column visibility states
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    // Initialize with all columns visible
    const initialState = {};
    COLUMN_CONFIG.forEach(col => {
      initialState[col.key] = true;
    });
    return initialState;
  });

  // Debounced search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    fetchTransactions();
  }, [refreshTrigger]);

  // Pass the functions to parent component through callback
  useEffect(() => {
    if (onTransactionAdded) {
      onTransactionAdded({ 
        addTransactionToState, 
        updateTransactionInState, 
        removeTransactionFromState 
      });
    }
  }, [onTransactionAdded, addTransactionToState, updateTransactionInState, removeTransactionFromState]);

  // Close column filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColumnFilter && !event.target.closest('.column-filter-container')) {
        setShowColumnFilter(false);
      }
      if (showMobileFilters && !event.target.closest('.mobile-filters-container')) {
        setShowMobileFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnFilter, showMobileFilters]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Ensure we have valid data before filtering
      if (!transaction || typeof transaction !== 'object') return false;
      
      const type = String(transaction.type || '').toLowerCase();
      const description = String(transaction.description || '');
      const category = String(transaction.category || '');
      const date = String(transaction.date || '');
      
      const matchesType = filter === 'all' || type === filter;
      const matchesSearch = description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           category.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      // For date filtering, convert DD/MM/YYYY to YYYY-MM format for comparison
      let matchesDate = true;
      if (dateFilter) {
        const [day, month, year] = date.split('/');
        if (year && month && day) {
          const transactionYearMonth = `${year}-${month.padStart(2, '0')}`;
          matchesDate = transactionYearMonth === dateFilter;
        }
      }
      
      return matchesType && matchesSearch && matchesDate;
    });
  }, [transactions, filter, debouncedSearchTerm, dateFilter]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => String(t.type || '').toLowerCase() === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => String(t.type || '').toLowerCase() === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      netBalance,
      totalTransactions: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // Function to download data as Excel
 // Function to download data as CSV
const downloadExcel = useCallback(() => {
  if (filteredTransactions.length === 0) {
    alert("No data to download");
    return;
  }

  try {
    // Create CSV content with proper escaping
    const headers = ["Serial No", "Transaction Type", "Amount", "Category", "Description", "Date"];
    const csvRows = [
      headers.join(","),
      ...filteredTransactions.map(item => [
        `"${String(item.serialNo || '').replace(/"/g, '""')}"`,
        `"${String(item.type || '').replace(/"/g, '""')}"`,
        item.amount || 0,
        `"${String(item.category || '').replace(/"/g, '""')}"`,
        `"${String(item.description || '').replace(/"/g, '""')}"`,
        `"${String(item.date || '').replace(/"/g, '""')}"`
      ].join(","))
    ];
    
    const csvContent = csvRows.join("\n");
    
    // Add BOM for proper Excel UTF-8 support
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    // Create and download file
    const blob = new Blob([csvWithBOM], { 
      type: "text/csv;charset=utf-8;" 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    // Generate filename with current date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const filename = `finance_transactions_${dateStr}.csv`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error downloading CSV:', error);
    alert('Failed to download data. Please try again.');
  }
}, [filteredTransactions]);

  // Column visibility handlers
  const handleColumnToggle = useCallback((columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  }, []);

  const handleSelectAllColumns = useCallback((e) => {
    e.stopPropagation();
    const newState = {};
    COLUMN_CONFIG.forEach(col => {
      newState[col.key] = true;
    });
    setVisibleColumns(newState);
  }, []);

  // Get visible columns for current section
  const getVisibleColumnsForCurrentSection = useCallback(() => {
    return COLUMN_CONFIG.filter(col => visibleColumns[col.key]);
  }, [visibleColumns]);

  return (
    <AdminLayout>
      <div className="space-y-4 p-2 sm:p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 sm:items-center">
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-800">
              {CONFIG.PAGE_CONFIG.title}
            </h1>
            <p className="text-gray-600 text-sm mt-1">Manage your financial records</p>
          </div>

          {/* Mobile: Add Transaction & Menu Button */}
          <div className="flex gap-2 sm:hidden">
            <button
              onClick={() => setIsAddTransactionOpen(true)}
              className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm flex items-center justify-center font-medium"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Transaction
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
            {/* Add Transaction Button */}
            <button
              onClick={() => setIsAddTransactionOpen(true)}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg hover:shadow-md text-sm flex items-center font-medium transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Transaction
            </button>

            {/* Search Input */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-sm bg-white/70"
              />
            </div>

            {/* Transaction Type Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-sm bg-white/70"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            {/* Date Filter */}
            <input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-sm bg-white/70"
              placeholder="Filter by month"
            />

            <button
              onClick={downloadExcel}
              className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg hover:shadow-md text-sm flex items-center font-medium transition-all duration-200"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </button>
          </div>
        </div>

        {/* Mobile Filters Panel */}
        {showMobileFilters && (
          <div className="sm:hidden mobile-filters-container bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-lg">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-sm bg-gray-50/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Transaction Type Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-sm bg-gray-50/30"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              {/* Date Filter */}
              <input
                type="month"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-sm bg-gray-50/30"
              />
            </div>

            <button
              onClick={downloadExcel}
              className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm flex items-center justify-center font-medium"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </button>
          </div>
        )}

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-green-400/20 to-green-500/30 border border-green-200 rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 text-xs sm:text-sm font-medium">Total Income</p>
                <p className="text-lg sm:text-2xl font-bold text-green-800">
                  +₹{summaryStats.totalIncome.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-400/20 to-red-500/30 border border-red-200 rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-700 text-xs sm:text-sm font-medium">Total Expenses</p>
                <p className="text-lg sm:text-2xl font-bold text-red-800">
                  -₹{summaryStats.totalExpenses.toLocaleString()}
                </p>
              </div>
              <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
          </div>
          <div className={`bg-gradient-to-br ${summaryStats.netBalance >= 0 ? 'from-blue-400/20 to-blue-500/30 border-blue-200' : 'from-red-400/20 to-red-500/30 border-red-200'} border rounded-xl p-3 sm:p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${summaryStats.netBalance >= 0 ? 'text-blue-700' : 'text-red-700'} text-xs sm:text-sm font-medium`}>Net Balance</p>
                <p className={`text-lg sm:text-2xl font-bold ${summaryStats.netBalance >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                  ₹{summaryStats.netBalance.toLocaleString()}
                </p>
              </div>
              <Calculator className={`h-6 w-6 sm:h-8 sm:w-8 ${summaryStats.netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-400/20 to-purple-500/30 border border-purple-200 rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-xs sm:text-sm font-medium">Total Transactions</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-800">{summaryStats.totalTransactions}</p>
              </div>
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
              <span className="text-sm">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-green-500 hover:text-green-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center">
              <X className="h-5 w-5 mr-2 text-red-500" />
              <span className="text-sm">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Table Container with Fixed Height */}
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200 p-3 sm:p-4 flex items-center justify-between">
            <div>
              <h2 className="text-gray-800 font-semibold flex items-center text-sm sm:text-base">
                Current Transactions
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm">
                View all financial transactions
              </p>
            </div>

            {/* Column Filter Button - Desktop */}
            <div className="relative column-filter-container hidden sm:block">
              <button
                onClick={() => setShowColumnFilter(!showColumnFilter)}
                className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Filter className="h-4 w-4 mr-2" />
                Columns
              </button>

              {/* Column Filter Popup */}
              {showColumnFilter && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-64 max-h-80 overflow-y-auto">
                  <div className="p-3 border-b border-gray-100">
                    <h3 className="font-medium text-gray-900 text-sm mb-2">
                      Show/Hide Columns
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSelectAllColumns}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Select All
                      </button>
                    </div>
                  </div>
                  <div className="p-2 max-h-60 overflow-y-auto">
                    {COLUMN_CONFIG.map((column) => (
                      <label
                        key={column.key}
                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[column.key] || false}
                          onChange={() => handleColumnToggle(column.key)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                        />
                        <span className="text-sm text-gray-700">
                          {column.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Column Filter */}
            <div className="relative column-filter-container sm:hidden">
              <button
                onClick={() => setShowColumnFilter(!showColumnFilter)}
                className="flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
              >
                <Filter className="h-3 w-3 mr-1" />
                Cols
              </button>

              {/* Mobile Column Filter Popup */}
              {showColumnFilter && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-56 max-h-64 overflow-y-auto">
                  <div className="p-2 border-b border-gray-100">
                    <h3 className="font-medium text-gray-900 text-xs mb-2">
                      Show/Hide Columns
                    </h3>
                    <button
                      onClick={handleSelectAllColumns}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Select All
                    </button>
                  </div>
                  <div className="p-1 max-h-48 overflow-y-auto">
                    {COLUMN_CONFIG.map((column) => (
                      <label
                        key={column.key}
                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[column.key] || false}
                          onChange={() => handleColumnToggle(column.key)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2 h-3 w-3"
                        />
                        <span className="text-xs text-gray-700">
                          {column.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600 text-sm">Loading transaction data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-6 rounded-md text-red-800 text-center text-sm">
              {error}{" "}
              <button className="underline ml-2 font-medium" onClick={fetchTransactions}>
                Try again
              </button>
            </div>
          ) : (
            /* Table with Fixed Height and Scrolling */
            <div className="overflow-auto" style={{ maxHeight: "60vh" }}>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50 sticky top-0 z-10">
                    <tr>
                      {visibleColumns.serialNo && (
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Serial No
                        </th>
                      )}
                      {visibleColumns.type && (
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Type
                        </th>
                      )}
                      {visibleColumns.amount && (
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Amount
                        </th>
                      )}
                      {visibleColumns.category && (
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Category
                        </th>
                      )}
                      {visibleColumns.description && (
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Description
                        </th>
                      )}
                      {visibleColumns.date && (
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Date
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((transaction) => (
                        <tr 
                          key={transaction.id} 
                          className={`hover:bg-gray-50 transition-all duration-200 ${
                            String(transaction.serialNo).startsWith('TEMP-') ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                          }`}
                        >
                          {visibleColumns.serialNo && (
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">
                                {String(transaction.serialNo).startsWith('TEMP-') ? (
                                  <span className="text-yellow-600 font-bold">Syncing...</span>
                                ) : (
                                  transaction.serialNo
                                )}
                              </span>
                            </td>
                          )}
                          {visibleColumns.type && (
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  String(transaction.type || '').toLowerCase() === 'income' ? 'bg-green-400' : 'bg-red-400'
                                }`} />
                                <span className={`text-sm font-semibold capitalize ${
                                  String(transaction.type || '').toLowerCase() === 'income' ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  {transaction.type}
                                </span>
                              </div>
                            </td>
                          )}
                          {visibleColumns.amount && (
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`text-lg font-bold ${
                                String(transaction.type || '').toLowerCase() === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {String(transaction.type || '').toLowerCase() === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                              </span>
                            </td>
                          )}
                          {visibleColumns.category && (
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full font-medium text-xs ${
                                String(transaction.type || '').toLowerCase() === 'income' 
                                  ? 'bg-green-100 text-green-700 border border-green-200' 
                                  : 'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                {transaction.category}
                              </span>
                            </td>
                          )}
                          {visibleColumns.description && (
                            <td className="px-4 py-4">
                              <span className="text-sm text-gray-800 font-medium">{transaction.description}</span>
                            </td>
                          )}
                          {visibleColumns.date && (
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600 font-medium">
                                {transaction.date}
                              </span>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={getVisibleColumnsForCurrentSection().length}
                          className="px-4 py-12 text-center text-gray-500 text-sm"
                        >
                          <div className="bg-gray-100 rounded-full p-6 w-fit mx-auto mb-4">
                            <Search className="h-12 w-12 text-gray-400" />
                          </div>
                          <p className="text-gray-500 text-lg font-semibold">
                            {loading ? 'Loading transactions...' : 'No transactions found matching your criteria'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3 p-3">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${
                        String(transaction.serialNo).startsWith('TEMP-') ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            String(transaction.type || '').toLowerCase() === 'income' ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                          <span className={`text-sm font-semibold capitalize ${
                            String(transaction.type || '').toLowerCase() === 'income' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {transaction.type}
                          </span>
                        </div>
                        <span className={`text-lg font-bold ${
                          String(transaction.type || '').toLowerCase() === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {String(transaction.type || '').toLowerCase() === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{transaction.description}</p>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className={`px-2 py-1 rounded-full font-medium ${
                            String(transaction.type || '').toLowerCase() === 'income' 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {transaction.category}
                          </span>
                          <span className="text-gray-500">{transaction.date}</span>
                        </div>

                        <div className="flex items-center justify-center text-xs text-gray-500 pt-2 border-t border-gray-100">
                          <span>
                            {String(transaction.serialNo).startsWith('TEMP-') ? (
                              <span className="text-yellow-600 font-bold">Syncing...</span>
                            ) : (
                              `#${transaction.serialNo}`
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 rounded-full p-6 w-fit mx-auto mb-4">
                      <Search className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-base font-semibold">
                      {loading ? 'Loading transactions...' : 'No transactions found matching your criteria'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionForm
        isOpen={isAddTransactionOpen}
        setIsOpen={setIsAddTransactionOpen}
        transactionHandlers={{
          addTransactionToState,
          updateTransactionInState,
          removeTransactionFromState
        }}
      />
    </AdminLayout>
  );
}

export default FinanceTransactions;