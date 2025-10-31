import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ApiCall {
  id: string;
  url: string;
  status?: number;
  timestamp: string;
  header?: any;
  response?: any;
  type: 'success' | 'failed';
  userId: string;
}

interface UserAnalytics {
  userId: string;
  successCalls: ApiCall[];
  failedCalls: ApiCall[];
  totalCalls: number;
  successRate: number;
}

type TabType = 'all' | 'success' | 'failed';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<UserAnalytics[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [expandedApi, setExpandedApi] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const userData = localStorage.getItem('user');

    if (!isAuthenticated || !userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchAnalyticsData();
  }, [navigate]);

  const fetchAnalyticsData = async () => {
    try {
      console.log('=== FETCHING API ANALYTICS DATA ===');
      console.log('Database:', db);
      console.log('Project ID:', db.app.options.projectId);

      const apiRef = collection(db, 'Api');
      console.log('Api collection reference:', apiRef);
      console.log('Api collection path:', apiRef.path);

      const apiSnapshot = await getDocs(apiRef);
      console.log('Api snapshot:', apiSnapshot);
      console.log('Api snapshot size:', apiSnapshot.size);
      console.log('Api snapshot empty?:', apiSnapshot.empty);
      console.log('Api snapshot docs:', apiSnapshot.docs);

      console.log(`📊 Found ${apiSnapshot.size} users in Api collection`);

      // If empty, try the known user directly
      if (apiSnapshot.empty || apiSnapshot.size === 0) {
        console.warn('⚠️ Api collection appears empty. Trying direct access to known user...');

        const testUserId = 'rahuldhakate2512@gmail.com';
        console.log(`Attempting to fetch data for: ${testUserId}`);

        const allUserAnalytics: UserAnalytics[] = [];

        try {
          // Fetch failed API calls for known user
          const failedRef = collection(db, 'Api', testUserId, 'failed');
          console.log('Failed ref path:', failedRef.path);
          const failedSnapshot = await getDocs(failedRef);
          console.log('Failed snapshot size:', failedSnapshot.size);

          const failedCalls: ApiCall[] = [];
          failedSnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('Failed doc:', doc.id, data);
            failedCalls.push({
              id: doc.id,
              url: data.url || data.response?.data?.url || 'Unknown',
              status: data.response?.data?.status || data.status,
              timestamp: data.timestamp || data.response?.data?.timestamp,
              header: data.header,
              response: data.response,
              type: 'failed',
              userId: testUserId
            });
          });

          // Fetch success API calls for known user
          const successRef = collection(db, 'Api', testUserId, 'success');
          console.log('Success ref path:', successRef.path);
          const successSnapshot = await getDocs(successRef);
          console.log('Success snapshot size:', successSnapshot.size);

          const successCalls: ApiCall[] = [];
          successSnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('Success doc:', doc.id, data);
            successCalls.push({
              id: doc.id,
              url: data.url || data.response?.data?.url || 'Unknown',
              status: data.response?.data?.status || data.status,
              timestamp: data.timestamp || data.response?.data?.timestamp,
              header: data.header,
              response: data.response,
              type: 'success',
              userId: testUserId
            });
          });

          const totalCalls = failedCalls.length + successCalls.length;
          const successRate = totalCalls > 0 ? (successCalls.length / totalCalls) * 100 : 0;

          if (totalCalls > 0) {
            allUserAnalytics.push({
              userId: testUserId,
              successCalls,
              failedCalls,
              totalCalls,
              successRate
            });
          }

          console.log(`  ✅ Success: ${successCalls.length}, ❌ Failed: ${failedCalls.length}`);
        } catch (directError) {
          console.error('Error with direct access:', directError);
        }

        setAnalyticsData(allUserAnalytics);
        console.log('✅ Analytics data loaded (direct access):', allUserAnalytics);
      } else {
        // Process all users normally
        const allUserAnalytics: UserAnalytics[] = [];

        for (const userDoc of apiSnapshot.docs) {
          const userId = userDoc.id;
          console.log(`👤 Processing user: ${userId}`);

          // Fetch failed API calls
          const failedRef = collection(db, 'Api', userId, 'failed');
          const failedSnapshot = await getDocs(failedRef);
          const failedCalls: ApiCall[] = [];

          console.log(`  Failed calls: ${failedSnapshot.size}`);
          failedSnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('  Failed doc:', doc.id, data);
            failedCalls.push({
              id: doc.id,
              url: data.url || data.response?.data?.url || 'Unknown',
              status: data.response?.data?.status || data.status,
              timestamp: data.timestamp || data.response?.data?.timestamp,
              header: data.header,
              response: data.response,
              type: 'failed',
              userId
            });
          });

          // Fetch success API calls
          const successRef = collection(db, 'Api', userId, 'success');
          const successSnapshot = await getDocs(successRef);
          const successCalls: ApiCall[] = [];

          console.log(`  Success calls: ${successSnapshot.size}`);
          successSnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('  Success doc:', doc.id, data);
            successCalls.push({
              id: doc.id,
              url: data.url || data.response?.data?.url || 'Unknown',
              status: data.response?.data?.status || data.status,
              timestamp: data.timestamp || data.response?.data?.timestamp,
              header: data.header,
              response: data.response,
              type: 'success',
              userId
            });
          });

          const totalCalls = failedCalls.length + successCalls.length;
          const successRate = totalCalls > 0 ? (successCalls.length / totalCalls) * 100 : 0;

          allUserAnalytics.push({
            userId,
            successCalls,
            failedCalls,
            totalCalls,
            successRate
          });

          console.log(`  ✅ Success: ${successCalls.length}, ❌ Failed: ${failedCalls.length}`);
        }

        setAnalyticsData(allUserAnalytics);
        console.log('✅ Analytics data loaded:', allUserAnalytics);
      }
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      console.error('Error details:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalSuccess = analyticsData.reduce((sum, u) => sum + u.successCalls.length, 0);
  const totalFailed = analyticsData.reduce((sum, u) => sum + u.failedCalls.length, 0);
  const totalCalls = totalSuccess + totalFailed;
  const overallSuccessRate = totalCalls > 0 ? (totalSuccess / totalCalls) * 100 : 0;

  // Get all API calls
  const allApiCalls: ApiCall[] = analyticsData.flatMap(u => [...u.successCalls, ...u.failedCalls]);

  // Filter by tab
  let filteredByTab = allApiCalls;
  if (activeTab === 'success') {
    filteredByTab = allApiCalls.filter(call => call.type === 'success');
  } else if (activeTab === 'failed') {
    filteredByTab = allApiCalls.filter(call => call.type === 'failed');
  }

  // Filter by user
  let filteredByUser = filteredByTab;
  if (selectedUserFilter !== 'all') {
    filteredByUser = filteredByTab.filter(call => call.userId === selectedUserFilter);
  }

  // Filter by search
  const filteredApiCalls = filteredByUser
    .filter(call => {
      if (!searchQuery) return true;
      return call.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
             call.userId.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => moment(b.timestamp).valueOf() - moment(a.timestamp).valueOf());

  // Chart data
  const pieData = [
    { name: 'Success', value: totalSuccess, color: '#10b981' },
    { name: 'Failed', value: totalFailed, color: '#ef4444' }
  ];

  const userBarData = analyticsData.map(u => ({
    name: u.userId.split('@')[0],
    success: u.successCalls.length,
    failed: u.failedCalls.length
  }));

  // Get unique users for filter dropdown
  const uniqueUsers = Array.from(new Set(analyticsData.map(u => u.userId)));

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-screen-2xl">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total API Calls</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{totalCalls}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Successful</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{totalSuccess}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Failed</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{totalFailed}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Success Rate</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{overallSuccessRate.toFixed(1)}%</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">API Call Distribution</h3>
            {totalCalls > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">API Calls by User</h3>
            {userBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="success" fill="#10b981" name="Success" />
                  <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Filters and Tabs Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by URL or user email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* User Filter */}
            <div className="lg:w-64">
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="all">All Users</option>
                {uniqueUsers.map(userId => (
                  <option key={userId} value={userId}>{userId}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === 'all'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All ({allApiCalls.length})
              </button>
              <button
                onClick={() => setActiveTab('success')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === 'success'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Success ({totalSuccess})
              </button>
              <button
                onClick={() => setActiveTab('failed')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === 'failed'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Failed ({totalFailed})
              </button>
            </nav>
          </div>
        </div>

        {/* API Calls List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {activeTab === 'all' && 'All API Calls'}
              {activeTab === 'success' && 'Successful API Calls'}
              {activeTab === 'failed' && 'Failed API Calls'}
              {selectedUserFilter !== 'all' && ` - ${selectedUserFilter}`}
            </h3>
            <span className="text-sm text-gray-500">
              Showing {filteredApiCalls.length} {filteredApiCalls.length === 1 ? 'call' : 'calls'}
            </span>
          </div>

          {filteredApiCalls.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium">No API calls found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredApiCalls.map((apiCall) => (
                <div
                  key={`${apiCall.userId}-${apiCall.id}`}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => setExpandedApi(expandedApi === apiCall.id ? null : apiCall.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            apiCall.type === 'success'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {apiCall.type === 'success' ? '✓ Success' : '✗ Failed'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 break-all">{apiCall.url}</p>
                          <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {apiCall.userId}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {moment(apiCall.timestamp).format('MMM DD, YYYY HH:mm:ss')}
                            </span>
                            {apiCall.status && (
                              <>
                                <span>•</span>
                                <span className={`font-semibold ${apiCall.status < 300 ? 'text-green-600' : 'text-red-600'}`}>
                                  Status {apiCall.status}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                          expandedApi === apiCall.id ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {expandedApi === apiCall.id && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <div className="space-y-4">
                        {/* Headers */}
                        {apiCall.header && (
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Request Headers
                            </h4>
                            <pre className="bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                              {JSON.stringify(apiCall.header, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Response */}
                        {apiCall.response && (
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                              </svg>
                              Response Data
                            </h4>
                            <pre className="bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto max-h-96 overflow-y-auto">
                              {JSON.stringify(apiCall.response, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
    </main>
  );
};

export default Dashboard;
