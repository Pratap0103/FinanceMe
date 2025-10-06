import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Car,
  Bike,
  Fuel,
  TrendingUp,
  Calendar,
  X,
  Search,
  Download,
  Filter,
  Gauge,
  BarChart3
} from "lucide-react";
import AdminLayout from '../../components/layout/AdminLayout';

// Configuration
const CONFIG = {
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxu2kcsb-hF-1zMiljnjZNcFVH412khCK6-9WhXohkzXCzzApqh4zFPsoubInrSiOuy/exec',
  SHEET_NAME: 'Fuel Trackers'
};

// Add Fuel Form Component
function AddFuelForm({ isOpen, setIsOpen, onFuelAdded }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicleType: '',
    price: '',
    meterNo: '',
    liter: ''
  });

  const vehicleTypes = ['Car', 'Bike'];

  // Helper function to format timestamp as DD/MM/YYYY HH:mm:ss
  const formatTimestamp = (date = new Date()) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const addFuelEntry = async (fuelData) => {
    try {
      setLoading(true);
      
      const now = new Date();
      const timestamp = formatTimestamp(now);
      
      // Send fuel data, let Google Apps Script generate the serial number
      const rowData = [
        timestamp,              // Column A - Timestamp
        fuelData.vehicleType,   // Column B - Vehicle Type (will be replaced with serial number by server)
        fuelData.vehicleType,   // Column C - Vehicle Type
        fuelData.price,         // Column D - Price
        fuelData.meterNo,       // Column E - Meter No
        fuelData.liter          // Column F - Liter
      ];

      const formDataToSend = new FormData();
      formDataToSend.append('sheetName', CONFIG.SHEET_NAME);
      formDataToSend.append('action', 'insertFuel');
      formDataToSend.append('vehicleType', fuelData.vehicleType);
      formDataToSend.append('rowData', JSON.stringify(rowData));

      const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: formDataToSend
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          serial: result.serial
        };
      } else {
        throw new Error(result.error || 'Failed to save fuel entry');
      }
    } catch (error) {
      console.error('Error saving fuel entry:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicleType || !formData.price || !formData.meterNo || !formData.liter) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const result = await addFuelEntry({
        vehicleType: formData.vehicleType,
        price: parseFloat(formData.price),
        meterNo: parseFloat(formData.meterNo),
        liter: parseFloat(formData.liter)
      });

      if (result.success) {
        alert(`Fuel entry added successfully! Serial Number: ${result.serial}`);
        
        // Reset form and close modal
        setFormData({
          vehicleType: '',
          price: '',
          meterNo: '',
          liter: ''
        });
        setIsOpen(false);
        
        // Notify parent component to refresh data
        if (onFuelAdded) {
          onFuelAdded();
        }
      }
    } catch (error) {
      alert('Failed to save fuel entry. Please try again.');
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">Add Fuel Detail</h2>
          <p className="text-gray-500 text-sm">Record your vehicle fuel information</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Vehicle Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Type</label>
            <div className="relative">
              <Car className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData(prev => ({ ...prev, vehicleType: e.target.value }))}
                className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 text-sm bg-gray-50/30"
                required
              >
                <option value="">Select Vehicle Type</option>
                {vehicleTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₹)</label>
            <div className="relative">
              <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-semibold">₹</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 text-sm bg-gray-50/30"
                required
              />
            </div>
          </div>

          {/* Meter No */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Meter No</label>
            <div className="relative">
              <Gauge className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <input
                type="number"
                step="0.01"
                placeholder="Enter meter reading"
                value={formData.meterNo}
                onChange={(e) => setFormData(prev => ({ ...prev, meterNo: e.target.value }))}
                className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 text-sm bg-gray-50/30"
                required
              />
            </div>
          </div>

          {/* Liter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Liter</label>
            <div className="relative">
              <Fuel className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <input
                type="number"
                step="0.01"
                placeholder="Enter liters"
                value={formData.liter}
                onChange={(e) => setFormData(prev => ({ ...prev, liter: e.target.value }))}
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

// Custom hook for fuel data
function useFuelData() {
  const [fuelEntries, setFuelEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFuelEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?sheet=${CONFIG.SHEET_NAME}&action=fetch`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Skip header row and map the data according to column structure
        const fuelData = data.data.slice(1).map((row, index) => ({
          id: index + 1,
          timestamp: row[0] || '',          // Column A - Timestamp
          serialNo: row[1] || '',           // Column B - Serial No
          vehicleType: row[2] || '',        // Column C - Vehicle Type
          price: parseFloat(row[3]) || 0,   // Column D - Price
          meterNo: parseFloat(row[4]) || 0, // Column E - Meter No
          liter: parseFloat(row[5]) || 0    // Column F - Liter
        })).filter(entry => entry.serialNo); // Filter out empty rows
        
        setFuelEntries(fuelData);
      }
    } catch (error) {
      console.error('Error fetching fuel entries:', error);
      alert('Failed to fetch fuel entries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { fuelEntries, fetchFuelEntries, loading, setFuelEntries };
}

// Fuel Tracker Content Component
function FuelTrackerContent() {
  const { fuelEntries, fetchFuelEntries, loading } = useFuelData();
  const [isAddFuelOpen, setIsAddFuelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');

  useEffect(() => {
    fetchFuelEntries();
  }, []);

  // Calculate average KM for each entry
  const entriesWithAverage = useMemo(() => {
    return fuelEntries.map((entry, index) => {
      let averageKM = 0;
      
      if (index > 0) {
        // Find the previous entry of the same vehicle type
        const previousEntries = fuelEntries.slice(0, index);
        const previousSameVehicle = previousEntries
          .filter(prevEntry => prevEntry.vehicleType === entry.vehicleType)
          .reverse()[0]; // Get the most recent previous entry of same vehicle type
        
        if (previousSameVehicle) {
          const kmDifference = entry.meterNo - previousSameVehicle.meterNo;
          if (kmDifference > 0 && entry.liter > 0) {
            averageKM = (kmDifference / entry.liter).toFixed(2);
          }
        }
      }
      
      return {
        ...entry,
        averageKM: averageKM
      };
    });
  }, [fuelEntries]);

  // Filter entries based on search and vehicle type
  const filteredEntries = useMemo(() => {
    return entriesWithAverage.filter(entry => {
      const matchesSearch = entry.serialNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.vehicleType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVehicle = vehicleFilter === 'all' || entry.vehicleType.toLowerCase() === vehicleFilter.toLowerCase();
      
      return matchesSearch && matchesVehicle;
    });
  }, [entriesWithAverage, searchTerm, vehicleFilter]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const carEntries = fuelEntries.filter(entry => entry.vehicleType.toLowerCase() === 'car');
    const bikeEntries = fuelEntries.filter(entry => entry.vehicleType.toLowerCase() === 'bike');
    
    return {
      carPrice: carEntries.reduce((sum, entry) => sum + entry.price, 0),
      carTotalLiter: carEntries.reduce((sum, entry) => sum + entry.liter, 0),
      bikePrice: bikeEntries.reduce((sum, entry) => sum + entry.price, 0),
      bikeTotalLiter: bikeEntries.reduce((sum, entry) => sum + entry.liter, 0),
      totalEntries: fuelEntries.length
    };
  }, [fuelEntries]);

  // Download CSV function
  const downloadCSV = useCallback(() => {
    if (filteredEntries.length === 0) {
      alert("No data to download");
      return;
    }

    try {
      const headers = ["Serial No", "Vehicle Type", "Price", "Meter No", "Liter", "Average KM"];
      const csvRows = [
        headers.join(","),
        ...filteredEntries.map(entry => [
          `"${entry.serialNo}"`,
          `"${entry.vehicleType}"`,
          entry.price,
          entry.meterNo,
          entry.liter,
          entry.averageKM || 0
        ].join(","))
      ];
      
      const csvContent = csvRows.join("\n");
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `fuel_tracker_${dateStr}.csv`;
      
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Failed to download data. Please try again.');
    }
  }, [filteredEntries]);

  const handleFuelAdded = () => {
    fetchFuelEntries();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-800">
              Fuel Tracker
            </h1>
            <p className="text-gray-600 text-sm mt-1">Track your vehicle fuel consumption and expenses</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsAddFuelOpen(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg hover:shadow-lg text-sm flex items-center justify-center font-medium transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Fuel Detail
            </button>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-400/20 to-blue-500/30 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 text-xs font-medium">Car Price</p>
                <p className="text-lg font-bold text-blue-800">
                  ₹{summaryStats.carPrice.toLocaleString()}
                </p>
              </div>
              <Car className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-400/20 to-green-500/30 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 text-xs font-medium">Car Total Liter</p>
                <p className="text-lg font-bold text-green-800">
                  {summaryStats.carTotalLiter.toFixed(2)}L
                </p>
              </div>
              <Fuel className="h-6 w-6 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-400/20 to-purple-500/30 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-xs font-medium">Bike Price</p>
                <p className="text-lg font-bold text-purple-800">
                  ₹{summaryStats.bikePrice.toLocaleString()}
                </p>
              </div>
              <Bike className="h-6 w-6 text-purple-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-400/20 to-orange-500/30 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-700 text-xs font-medium">Bike Total Liter</p>
                <p className="text-lg font-bold text-orange-800">
                  {summaryStats.bikeTotalLiter.toFixed(2)}L
                </p>
              </div>
              <Fuel className="h-6 w-6 text-orange-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-400/20 to-gray-500/30 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-xs font-medium">Total Entries</p>
                <p className="text-lg font-bold text-gray-800">
                  {summaryStats.totalEntries}
                </p>
              </div>
              <BarChart3 className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-sm bg-white/70"
            />
          </div>

          {/* Vehicle Filter */}
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-sm bg-white/70"
          >
            <option value="all">All Vehicles</option>
            <option value="car">Car</option>
            <option value="bike">Bike</option>
          </select>

          {/* Download Button */}
          <button
            onClick={downloadCSV}
            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg hover:shadow-md text-sm flex items-center font-medium transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200 p-4">
            <h2 className="text-gray-800 font-semibold flex items-center">
              <Fuel className="h-5 w-5 mr-2" />
              Fuel Entries
            </h2>
            <p className="text-gray-600 text-sm">View all fuel consumption records</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600 text-sm">Loading fuel data...</p>
            </div>
          ) : (
            <div className="overflow-auto" style={{ maxHeight: "60vh" }}>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Serial No</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Vehicle Type</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Meter No</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Liter</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Average KM</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredEntries.length > 0 ? (
                      filteredEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50 transition-all duration-200">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">{entry.serialNo}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {entry.vehicleType.toLowerCase() === 'car' ? 
                                <Car className="h-4 w-4 text-blue-500" /> : 
                                <Bike className="h-4 w-4 text-purple-500" />
                              }
                              <span className={`text-sm font-semibold ${
                                entry.vehicleType.toLowerCase() === 'car' ? 'text-blue-700' : 'text-purple-700'
                              }`}>
                                {entry.vehicleType}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-green-600">₹{entry.price.toLocaleString()}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-800 font-medium">{entry.meterNo}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm text-blue-600 font-medium">{entry.liter}L</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-orange-600">
                              {entry.averageKM ? `${entry.averageKM} km/L` : '-'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">
                          <div className="bg-gray-100 rounded-full p-6 w-fit mx-auto mb-4">
                            <Search className="h-12 w-12 text-gray-400" />
                          </div>
                          <p className="text-gray-500 text-lg font-semibold">
                            {loading ? 'Loading fuel entries...' : 'No fuel entries found matching your criteria'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3 p-3">
                {filteredEntries.length > 0 ? (
                  filteredEntries.map((entry) => (
                    <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {entry.vehicleType.toLowerCase() === 'car' ? 
                            <Car className="h-4 w-4 text-blue-500" /> : 
                            <Bike className="h-4 w-4 text-purple-500" />
                          }
                          <span className={`text-sm font-semibold ${
                            entry.vehicleType.toLowerCase() === 'car' ? 'text-blue-700' : 'text-purple-700'
                          }`}>
                            {entry.vehicleType}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-green-600">₹{entry.price.toLocaleString()}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-gray-500">Serial No</p>
                          <p className="font-semibold text-gray-900">{entry.serialNo}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Meter No</p>
                          <p className="font-semibold text-gray-900">{entry.meterNo}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Liter</p>
                          <p className="font-semibold text-blue-600">{entry.liter}L</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Average KM</p>
                          <p className="font-semibold text-orange-600">
                            {entry.averageKM ? `${entry.averageKM} km/L` : '-'}
                          </p>
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
                      {loading ? 'Loading fuel entries...' : 'No fuel entries found matching your criteria'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Add Fuel Modal */}
        <AddFuelForm
          isOpen={isAddFuelOpen}
          setIsOpen={setIsAddFuelOpen}
          onFuelAdded={handleFuelAdded}
        />
      </div>
    );
}

// Main Fuel Tracker Component with AdminLayout
function FuelTracker({ darkMode, toggleDarkMode }) {
  return (
    <AdminLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
      <FuelTrackerContent />
    </AdminLayout>
  );
}

export default FuelTracker;