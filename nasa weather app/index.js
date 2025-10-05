import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Download, TrendingUp, Droplets, Wind, Thermometer, Cloud, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const WeatherLikelihoodDashboard = () => {
  const [location, setLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: 40.7128, lon: -74.0060 });
  const [activeThresholds, setActiveThresholds] = useState({
    veryHot: true,
    veryCold: true,
    veryWindy: true,
    veryWet: true,
    uncomfortable: true
  });
  
  const [historicalData, setHistoricalData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Simulated historical data generation (in real app, would fetch from NASA APIs)
  const generateHistoricalData = (lat, lon, dayOfYear) => {
    const years = Array.from({ length: 30 }, (_, i) => 2024 - i);
    const monthDay = dayOfYear ? new Date(2024, 0, dayOfYear).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Jun 15';
    
    // Generate realistic seasonal patterns
    const baseTemp = 60 + Math.sin((dayOfYear || 166) / 365 * Math.PI * 2) * 30;
    const basePrecip = 0.5 + Math.cos((dayOfYear || 166) / 365 * Math.PI * 2) * 0.3;
    
    return {
      temperature: years.map(year => ({
        year,
        avgTemp: baseTemp + (Math.random() - 0.5) * 15,
        maxTemp: baseTemp + 10 + (Math.random() - 0.5) * 20,
        minTemp: baseTemp - 10 + (Math.random() - 0.5) * 15
      })),
      precipitation: years.map(year => ({
        year,
        amount: Math.max(0, basePrecip + (Math.random() - 0.5) * 0.8)
      })),
      wind: years.map(year => ({
        year,
        speed: 8 + (Math.random() - 0.5) * 12
      })),
      humidity: years.map(year => ({
        year,
        level: 50 + (Math.random() - 0.5) * 40
      })),
      date: monthDay
    };
  };

  const calculateLikelihoods = (data) => {
    if (!data) return null;

    const hotDays = data.temperature.filter(d => d.maxTemp > 90).length;
    const coldDays = data.temperature.filter(d => d.minTemp < 32).length;
    const windyDays = data.wind.filter(d => d.speed > 20).length;
    const wetDays = data.precipitation.filter(d => d.amount > 0.5).length;
    
    const avgTemp = data.temperature.reduce((sum, d) => sum + d.avgTemp, 0) / data.temperature.length;
    const avgHumidity = data.humidity.reduce((sum, d) => sum + d.level, 0) / data.humidity.length;
    const heatIndex = avgTemp + (avgHumidity / 100) * 15;
    const uncomfortableDays = data.temperature.filter((d, i) => {
      const hi = d.avgTemp + (data.humidity[i].level / 100) * 15;
      return hi > 80 || d.avgTemp < 40;
    }).length;

    const total = data.temperature.length;

    return {
      veryHot: { percent: (hotDays / total * 100).toFixed(1), count: hotDays, total, label: 'Very Hot (>90°F)' },
      veryCold: { percent: (coldDays / total * 100).toFixed(1), count: coldDays, total, label: 'Very Cold (<32°F)' },
      veryWindy: { percent: (windyDays / total * 100).toFixed(1), count: windyDays, total, label: 'Very Windy (>20 mph)' },
      veryWet: { percent: (wetDays / total * 100).toFixed(1), count: wetDays, total, label: 'Heavy Rain (>0.5 in)' },
      uncomfortable: { percent: (uncomfortableDays / total * 100).toFixed(1), count: uncomfortableDays, total, label: 'Uncomfortable' }
    };
  };

  const handleSearch = () => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const dayOfYear = selectedDate ? new Date(selectedDate).getDayOfYear() : 166;
      const data = generateHistoricalData(coordinates.lat, coordinates.lon, dayOfYear);
      setHistoricalData(data);
      setLoading(false);
    }, 1000);
  };

  // Helper to get day of year
  Date.prototype.getDayOfYear = function() {
    const start = new Date(this.getFullYear(), 0, 0);
    const diff = this - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const likelihoods = calculateLikelihoods(historicalData);

  const downloadData = () => {
    if (!historicalData) return;
    
    const csvContent = [
      ['Year', 'Avg Temp (°F)', 'Max Temp (°F)', 'Min Temp (°F)', 'Precipitation (in)', 'Wind Speed (mph)', 'Humidity (%)'],
      ...historicalData.temperature.map((t, i) => [
        t.year,
        t.avgTemp.toFixed(1),
        t.maxTemp.toFixed(1),
        t.minTemp.toFixed(1),
        historicalData.precipitation[i].amount.toFixed(2),
        historicalData.wind[i].speed.toFixed(1),
        historicalData.humidity[i].level.toFixed(1)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather-data-${location || 'location'}-${historicalData.date}.csv`;
    a.click();
  };

  const LikelihoodCard = ({ icon: Icon, label, likelihood, color, active }) => {
    if (!active) return null;
    
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">{label}</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {likelihood.percent}%
            </div>
            <p className="text-sm text-gray-600">
              {likelihood.count} out of {likelihood.total} years
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Weather Likelihood Dashboard
          </h1>
          <p className="text-gray-600">
            Analyze historical weather patterns to understand the probability of specific conditions
          </p>
        </div>

        {/* Search Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location
              </label>
              <input
                type="text"
                placeholder="Enter city or coordinates"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date (Day of Year)
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Analyzing...' : 'Analyze Weather'}
              </button>
            </div>
          </div>

          {/* Threshold Toggles */}
          <div className="border-t pt-4 mt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Select Conditions to Analyze:</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries({
                veryHot: 'Very Hot',
                veryCold: 'Very Cold',
                veryWindy: 'Very Windy',
                veryWet: 'Very Wet',
                uncomfortable: 'Uncomfortable'
              }).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeThresholds[key]}
                    onChange={(e) => setActiveThresholds({...activeThresholds, [key]: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {historicalData && likelihoods && (
          <>
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <strong>Historical Analysis:</strong> Data shown for {historicalData.date} based on 30 years of historical records. 
                These probabilities help you prepare but are not weather forecasts.
              </div>
            </div>

            {/* Likelihood Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <LikelihoodCard 
                icon={Thermometer} 
                label={likelihoods.veryHot.label}
                likelihood={likelihoods.veryHot}
                color="border-red-500"
                active={activeThresholds.veryHot}
              />
              <LikelihoodCard 
                icon={Thermometer} 
                label={likelihoods.veryCold.label}
                likelihood={likelihoods.veryCold}
                color="border-blue-500"
                active={activeThresholds.veryCold}
              />
              <LikelihoodCard 
                icon={Wind} 
                label={likelihoods.veryWindy.label}
                likelihood={likelihoods.veryWindy}
                color="border-green-500"
                active={activeThresholds.veryWindy}
              />
              <LikelihoodCard 
                icon={Droplets} 
                label={likelihoods.veryWet.label}
                likelihood={likelihoods.veryWet}
                color="border-indigo-500"
                active={activeThresholds.veryWet}
              />
              <LikelihoodCard 
                icon={Cloud} 
                label={likelihoods.uncomfortable.label}
                likelihood={likelihoods.uncomfortable}
                color="border-yellow-500"
                active={activeThresholds.uncomfortable}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Temperature Trends */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Temperature Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData.temperature.slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis label={{ value: '°F', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="maxTemp" stroke="#ef4444" name="Max Temp" />
                    <Line type="monotone" dataKey="avgTemp" stroke="#3b82f6" name="Avg Temp" />
                    <Line type="monotone" dataKey="minTemp" stroke="#06b6d4" name="Min Temp" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Precipitation */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Precipitation Patterns</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={historicalData.precipitation.slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis label={{ value: 'inches', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#6366f1" name="Precipitation" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Wind Speed */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Wind Speed History</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={historicalData.wind.slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis label={{ value: 'mph', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="speed" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Wind Speed" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Humidity */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Humidity Levels</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData.humidity.slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="level" stroke="#f59e0b" name="Humidity" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Download Button */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Export Data</h3>
                  <p className="text-sm text-gray-600">Download historical weather data for further analysis</p>
                </div>
                <button
                  onClick={downloadData}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download CSV
                </button>
              </div>
            </div>
          </>
        )}

        {!historicalData && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Ready to Analyze
            </h3>
            <p className="text-gray-600">
              Enter a location and date above to view historical weather likelihood data
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherLikelihoodDashboard;