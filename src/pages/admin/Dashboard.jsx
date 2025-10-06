import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Activity,
  Wallet,
  RefreshCw,
  BarChart3,
  Fuel
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import AdminLayout from "../../components/layout/AdminLayout.jsx";

const CONFIG = {
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxu2kcsb-hF-1zMiljnjZNcFVH412khCK6-9WhXohkzXCzzApqh4zFPsoubInrSiOuy/exec'
};

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981'];

export default function FinancialDashboard() {
  const [dashboardData, setDashboardData] = useState({
    finance: { totalIncome: 0, totalExpense: 0, netBalance: 0, transactions: [] },
    fuel: { carPrice: 0, bikePrice: 0, totalLiters: 0, entries: [] },
    dreams: { totalDreams: 0, totalTarget: 0, dreams: [] },
    loading: true,
    error: null
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      
      const [financeRes, fuelRes, dreamsRes] = await Promise.all([
        fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?sheet=Daily&action=fetch`),
        fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?sheet=Fuel Trackers&action=fetch`),
        fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?sheet=Dreams&action=fetch`)
      ]);

      const [financeData, fuelData, dreamsData] = await Promise.all([
        financeRes.json(),
        fuelRes.json(),
        dreamsRes.json()
      ]);

      const financeProcessed = processFinanceData(financeData);
      const fuelProcessed = processFuelData(fuelData);
      const dreamsProcessed = processDreamsData(dreamsData);

      setDashboardData({
        finance: financeProcessed,
        fuel: fuelProcessed,
        dreams: dreamsProcessed,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data. Please refresh.'
      }));
    }
  };

  const processFinanceData = (data) => {
    if (!data.success || !data.data) return { totalIncome: 0, totalExpense: 0, netBalance: 0, transactions: [] };
    
    const transactions = data.data.slice(1).map((row, index) => ({
      id: index + 1,
      type: row[2] || '',
      amount: parseFloat(row[3]) || 0,
      category: row[4] || '',
      date: row[6] || ''
    })).filter(t => t.type);

    const totalIncome = transactions.filter(t => t.type.toLowerCase() === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type.toLowerCase() === 'expense').reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      transactions
    };
  };

  const processFuelData = (data) => {
    if (!data.success || !data.data) return { carPrice: 0, bikePrice: 0, totalLiters: 0, entries: [] };
    
    const entries = data.data.slice(1).map((row, index) => ({
      id: index + 1,
      vehicleType: row[2] || '',
      price: parseFloat(row[3]) || 0,
      liter: parseFloat(row[5]) || 0
    })).filter(e => e.vehicleType);

    const carEntries = entries.filter(e => e.vehicleType.toLowerCase() === 'car');
    const bikeEntries = entries.filter(e => e.vehicleType.toLowerCase() === 'bike');

    return {
      carPrice: carEntries.reduce((sum, e) => sum + e.price, 0),
      bikePrice: bikeEntries.reduce((sum, e) => sum + e.price, 0),
      totalLiters: entries.reduce((sum, e) => sum + e.liter, 0),
      entries
    };
  };

  const processDreamsData = (data) => {
    if (!data.success || !data.data) return { totalDreams: 0, totalTarget: 0, dreams: [] };
    
    const dreams = data.data.slice(1).map((row, index) => ({
      id: index + 1,
      dreamName: row[3] || '',
      totalCost: parseFloat(row[4]) || 0
    })).filter(d => d.dreamName);

    return {
      totalDreams: dreams.length,
      totalTarget: dreams.reduce((sum, d) => sum + d.totalCost, 0),
      dreams
    };
  };

  const expenseCategoryData = useMemo(() => {
    const categories = {};
    dashboardData.finance.transactions
      .filter(t => t.type.toLowerCase() === 'expense')
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });
    
    return Object.entries(categories)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [dashboardData.finance.transactions]);

  const monthlyTrendData = useMemo(() => {
    const monthlyData = {};
    dashboardData.finance.transactions.forEach(t => {
      if (!t.date) return;
      const parts = t.date.split('/');
      if (parts.length !== 3) return;
      const [day, month, year] = parts;
      const monthKey = `${month}/${year}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, income: 0, expense: 0 };
      }
      
      if (t.type.toLowerCase() === 'income') {
        monthlyData[monthKey].income += t.amount;
      } else {
        monthlyData[monthKey].expense += t.amount;
      }
    });
    
    return Object.values(monthlyData).slice(-6);
  }, [dashboardData.finance.transactions]);

  if (dashboardData.loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
              <div
                className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-400 rounded-full animate-spin mx-auto"
                style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
              ></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-purple-700">Loading Financial Dashboard</h3>
              <p className="text-purple-600">Fetching latest data from Google Sheets...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (dashboardData.error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-red-700">Error Loading Data</h3>
              <p className="text-red-600 text-sm">{dashboardData.error}</p>
            </div>
            <button
              onClick={fetchAllData}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Loading
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-purple-700">Financial Dashboard</h1>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-purple-600">Complete overview of your finances</p>
            <button
              onClick={fetchAllData}
              className="inline-flex items-center px-4 py-2 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 font-medium text-purple-700 text-sm shadow-sm transition-colors duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">Total Income</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-green-700">₹{dashboardData.finance.totalIncome.toLocaleString()}</p>
                <p className="text-sm text-green-600">All earnings</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/5"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">Total Expenses</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-red-700">₹{dashboardData.finance.totalExpense.toLocaleString()}</p>
                <p className="text-sm text-red-600">All spending</p>
              </div>
            </div>
          </div>

          <div className={`group relative overflow-hidden rounded-2xl ${dashboardData.finance.netBalance >= 0 ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200' : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'} border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
            <div className={`absolute inset-0 ${dashboardData.finance.netBalance >= 0 ? 'bg-gradient-to-br from-blue-500/5 to-cyan-500/5' : 'bg-gradient-to-br from-orange-500/5 to-amber-500/5'}`}></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${dashboardData.finance.netBalance >= 0 ? 'bg-blue-100' : 'bg-orange-100'} rounded-xl`}>
                  <Wallet className={`h-6 w-6 ${dashboardData.finance.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${dashboardData.finance.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net Balance</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className={`text-3xl font-bold ${dashboardData.finance.netBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>₹{dashboardData.finance.netBalance.toLocaleString()}</p>
                <p className={`text-sm ${dashboardData.finance.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{dashboardData.finance.netBalance >= 0 ? 'Surplus' : 'Deficit'}</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-purple-600">Dreams Target</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-purple-700">₹{dashboardData.dreams.totalTarget.toLocaleString()}</p>
                <p className="text-sm text-purple-600">{dashboardData.dreams.totalDreams} active goals</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fuel Stats */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-blue-200 shadow-lg bg-white overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Fuel Expenses (Car)</p>
                  <p className="text-2xl font-bold text-gray-800">₹{dashboardData.fuel.carPrice.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Total spent on car fuel</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Fuel className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-purple-200 shadow-lg bg-white overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Fuel Expenses (Bike)</p>
                  <p className="text-2xl font-bold text-gray-800">₹{dashboardData.fuel.bikePrice.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Total spent on bike fuel</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Fuel className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4 rounded-2xl border border-purple-200 shadow-lg bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100 p-6">
              <h3 className="text-lg font-semibold text-purple-700 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Income vs Expenses Trend
              </h3>
              <p className="text-purple-600 text-sm mt-1">Monthly financial overview</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" fontSize={12} stroke="#6b7280" />
                  <YAxis fontSize={12} stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="expense" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-3 rounded-2xl border border-purple-200 shadow-lg bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100 p-6">
              <h3 className="text-lg font-semibold text-purple-700 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Top Expense Categories
              </h3>
              <p className="text-purple-600 text-sm mt-1">Where your money goes</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={(entry) => entry.name}
                  >
                    {expenseCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Statistics */}
        <div className="rounded-2xl border border-purple-200 shadow-lg bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100 p-6">
            <h3 className="text-lg font-semibold text-purple-700">Quick Statistics</h3>
            <p className="text-purple-600 text-sm mt-1">Key metrics at a glance</p>
          </div>
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-6 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-3xl font-bold text-purple-700">{dashboardData.finance.transactions.length}</p>
                <p className="text-sm text-purple-600 mt-2">Total Transactions</p>
              </div>
              <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-3xl font-bold text-blue-700">{dashboardData.dreams.totalDreams}</p>
                <p className="text-sm text-blue-600 mt-2">Active Dreams</p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-xl border border-green-100">
                <p className="text-3xl font-bold text-green-700">{dashboardData.fuel.entries.length}</p>
                <p className="text-sm text-green-600 mt-2">Fuel Entries</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}