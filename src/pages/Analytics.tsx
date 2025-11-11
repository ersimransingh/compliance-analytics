import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import axios from 'axios';

interface ScreenLog {
  id: string;
  name: string;
  screenName: string;
  screenType: string;
  timestamp: string;
  userId: string;
  pagePath: string;
  params?: any;
}

interface PageStats {
  pagePath: string;
  views: number;
  uniqueUsers: number;
  lastViewed: string;
}

interface UserStats {
  userId: string;
  totalViews: number;
  uniquePages: number;
  lastActive: string;
}

type DateRangeType = 'week' | 'month' | 'all';

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [allLogs, setAllLogs] = useState<ScreenLog[]>([]);
  const [pageStats, setPageStats] = useState<PageStats[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [expandedLog,setExpandedLog] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRangeType>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState<moment.Moment>(moment().startOf('week'));
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchAnalyticsData();
  }, [navigate, dateRange, currentWeekStart]);

  
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      console.log("Fetching analytics data for range:", dateRange);

      // Calculate date range for API request
      let fromDate = "";
      let toDate = "";

      if (dateRange === 'week') {
        fromDate = currentWeekStart.format('YYYY-MM-DD');
        toDate = currentWeekStart.clone().endOf('week').format('YYYY-MM-DD');
      } else if (dateRange === 'month') {
        fromDate = moment().startOf('month').format('YYYY-MM-DD');
        toDate = moment().endOf('month').format('YYYY-MM-DD');
      }

      console.log(`Fetching data from ${fromDate} to ${toDate}`);

      const requestBody = {
        api: {
          ProjectName: "ANALYTICS",
          ModuleName: "GET_ANALYTICS",
          FunctionName: "GetAllAnalytics",
        },
        data: {
          filter: {
            From_Date: fromDate,
            To_Date: toDate,
          },
        },
      };


      const response = await axios.post(
        "https://analyticsback.compliancesutra.com/api/execute",
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJhaHVsZGhha2F0ZTI1MTJAZ21haWwuY29tIiwicHJvamVjdCI6IkNvbXBsaWFuY2UiLCJtb2R1bGUiOiJSZXBvcnRzIiwiaWF0IjoxNzYyODQwMzkzLCJleHAiOjE3NjI5MjY3OTMsImlzcyI6ImNvbXBsaWFuY2UtYW5hbHl0aWNzLWJhY2tlbmQifQ.ro1CgeHxbb4eMnFGwe8EKJusmdDhmVhCCKE8KAZkVqc`
          },
        }
      );

      console.log("API Response:", response.data);
      const resultData = response.data?.data || [];

      const logs: ScreenLog[] = resultData.map((item: any) => ({
        id: item.ID?.toString() || Math.random().toString(),
        name: item.name || "",
        screenName: item.Screen_Name || "Unknown Screen",
        screenType: item.name || "Unknown Type",
        timestamp: item.Timestamp || item.Created_At || moment().toISOString(),
        userId: item.Email_ID || "",
        pagePath: item.Screen_Path ,
        params: item.Request_Body ? 
          (typeof item.Request_Body === 'string' ? 
            JSON.parse(item.Request_Body) : 
            item.Request_Body) 
          : {},
      }));

      setAllLogs(logs);
      calculateStats(logs);
      console.log(`Loaded ${logs.length} logs`);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Add better error handling
      if (axios.isAxiosError(error)) {
        console.error('API Error:', error.response?.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (logs: ScreenLog[]) => {
    // Calculate page stats
    const pageMap = new Map<string, { views: number; users: Set<string>; lastViewed: string }>();

    logs.forEach(log => {
      const existing = pageMap.get(log.pagePath) || { views: 0, users: new Set(), lastViewed: log.timestamp };

      existing.views++;
      existing.users.add(log.userId);
      if (moment(log.timestamp).isAfter(moment(existing.lastViewed))) {
        existing.lastViewed = log.timestamp;
      }

      pageMap.set(log.pagePath, existing);
    });

    const pageStatsArray: PageStats[] = Array.from(pageMap.entries()).map(([pagePath, stats]) => ({
      pagePath,
      views: stats.views,
      uniqueUsers: stats.users.size,
      lastViewed: stats.lastViewed
    })).sort((a, b) => b.views - a.views);

    setPageStats(pageStatsArray);

    // Calculate user stats
    const userMap = new Map<string, { views: number; pages: Set<string>; lastActive: string }>();

    logs.forEach(log => {
      const existing = userMap.get(log.userId) || { views: 0, pages: new Set(), lastActive: log.timestamp };

      existing.views++;
      existing.pages.add(log.pagePath);
      if (moment(log.timestamp).isAfter(moment(existing.lastActive))) {
        existing.lastActive = log.timestamp;
      }

      userMap.set(log.userId, existing);
    });

    const userStatsArray: UserStats[] = Array.from(userMap.entries()).map(([userId, stats]) => ({
      userId,
      totalViews: stats.views,
      uniquePages: stats.pages.size,
      lastActive: stats.lastActive
    })).sort((a, b) => b.totalViews - a.totalViews);

    setUserStats(userStatsArray);
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

  // Calculate date range
  let startDate: moment.Moment | null = null;
  let endDate: moment.Moment | null = null;

  if (dateRange === 'week') {
    startDate = currentWeekStart.clone();
    endDate = currentWeekStart.clone().endOf('week');
  } else if (dateRange === 'month') {
    startDate = currentWeekStart.clone().startOf('month');
    endDate = currentWeekStart.clone().endOf('month');
  }

  // Filter logs by date range
  let filteredByDate = allLogs;
  if (startDate && endDate) {
    filteredByDate = allLogs.filter(log => {
      const logDate = moment(log.timestamp);
      return logDate.isBetween(startDate, endDate, 'day', '[]');
    });
  }

  // Recalculate stats for filtered date range
  const dateFilteredPageStats = calculatePageStatsFromLogs(filteredByDate);
  const dateFilteredUserStats = calculateUserStatsFromLogs(filteredByDate);

  // Filter logs by user and page
  let filteredLogs = filteredByDate;
  if (selectedUser !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.userId === selectedUser);
  }
  if (selectedPage !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.pagePath === selectedPage);
  }
  filteredLogs = filteredLogs.sort((a, b) => moment(b.timestamp).valueOf() - moment(a.timestamp).valueOf());

  // Helper functions for calculating stats
  function calculatePageStatsFromLogs(logs: ScreenLog[]): PageStats[] {
    const pageMap = new Map<string, { views: number; users: Set<string>; lastViewed: string }>();
    logs.forEach(log => {
      const existing = pageMap.get(log.pagePath) || { views: 0, users: new Set(), lastViewed: log.timestamp };
      existing.views++;
      existing.users.add(log.userId);
      if (moment(log.timestamp).isAfter(moment(existing.lastViewed))) {
        existing.lastViewed = log.timestamp;
      }
      pageMap.set(log.pagePath, existing);
    });

    return Array.from(pageMap.entries()).map(([pagePath, stats]) => ({
      pagePath,
      views: stats.views,
      uniqueUsers: stats.users.size,
      lastViewed: stats.lastViewed
    })).sort((a, b) => b.views - a.views);
  }

  function calculateUserStatsFromLogs(logs: ScreenLog[]): UserStats[] {
    const userMap = new Map<string, { views: number; pages: Set<string>; lastActive: string }>();
    logs.forEach(log => {
      const existing = userMap.get(log.userId) || { views: 0, pages: new Set(), lastActive: log.timestamp };
      existing.views++;
      existing.pages.add(log.pagePath);
      if (moment(log.timestamp).isAfter(moment(existing.lastActive))) {
        existing.lastActive = log.timestamp;
      }
      userMap.set(log.userId, existing);
    });

    return Array.from(userMap.entries()).map(([userId, stats]) => ({
      userId,
      totalViews: stats.views,
      uniquePages: stats.pages.size,
      lastActive: stats.lastActive
    })).sort((a, b) => b.totalViews - a.totalViews);
  }

  const handlePreviousWeek = () => {
    setCurrentWeekStart(currentWeekStart.clone().subtract(1, 'week'));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(currentWeekStart.clone().add(1, 'week'));
  };

  const handleToday = () => {
    setCurrentWeekStart(moment().startOf('week'));
  };

    const handlePreviousMonth = () => {
    setCurrentWeekStart(currentWeekStart.clone().subtract(1,'month'));
    }
  
    const handleNextMonth = () => {
    setCurrentWeekStart(currentWeekStart.clone().add(1,'month'));
    }
    
    const handleTodayMonth = () => {
      setCurrentWeekStart(moment().startOf('month'))
    }

  const handleDateRangeChange = (range: DateRangeType) => {
    setDateRange(range);
    if (range === 'week') {
      setCurrentWeekStart(moment().startOf('week'));
    }
  };

  // Chart data - use filtered stats
  const topPagesData = dateFilteredPageStats.slice(0, 5).map(page => ({
    name: page.pagePath.length > 10
    ? ((page.pagePath.split("_").pop()) ?? page.pagePath) 
    : page.pagePath,
    views: page.views,
    users: page.uniqueUsers
  }));

  const userActivityData = dateFilteredUserStats.slice(0, 10).map(user => ({
    name: user.userId.split('@')[0],
    views: user.totalViews,
    pages: user.uniquePages
  }));

  const totalUsers = dateFilteredUserStats.length;
  const totalPages = dateFilteredPageStats.length;
  const totalViews = filteredByDate.length;
  const avgViewsPerUser = totalUsers > 0 ? (totalViews / totalUsers).toFixed(1) : 0;

  // Date range display
  const dateRangeDisplay = dateRange === 'week'
    ? `${startDate?.format('MMM DD')} - ${endDate?.format('MMM DD, YYYY')}`
    : dateRange === 'month'
    ? currentWeekStart.format('MMMM YYYY')
    : 'All Time';

  // Debug information
  console.log('Debug Info:', {
    totalLogs: allLogs.length,
    dateRange,
    currentWeekStart: currentWeekStart.format('YYYY-MM-DD'),
    filteredLogsCount: filteredLogs?.length,
    topPagesDataCount: topPagesData?.length,
    userActivityDataCount: userActivityData?.length
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-screen-2xl">
        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Time Period</h2>
              <p className="text-sm text-gray-600 mt-1">{dateRangeDisplay}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Date Range Buttons */}
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleDateRangeChange('week')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    dateRange === 'week'
                      ? 'bg-white text-indigo-600 shadow'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => handleDateRangeChange('month')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    dateRange === 'month'
                      ? 'bg-white text-indigo-600 shadow'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => handleDateRangeChange('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    dateRange === 'all'
                      ? 'bg-white text-indigo-600 shadow'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  All Time
                </button>
              </div>

              {/* Week Navigation (only show when week is selected) */}
              {dateRange === 'week' && (
                <div className="flex items-center gap-2 border-l pl-3">
                  <button
                    onClick={handlePreviousWeek}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                    title="Previous Week"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleToday}
                    className="px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                  >
                    {dateRangeDisplay}
                  </button>
                  <button
                    onClick={handleNextWeek}
                    disabled={currentWeekStart.isSameOrAfter(moment().startOf('week'))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next Week"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
              {/* Month Navigation */}
              {dateRange === 'month' && (
                <div className="flex items-center gap-2 border-l pl-3">
                  <button
                      onClick={handlePreviousMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Previous Week"
                  >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  </button>
                  <button
                    onClick={handleTodayMonth}
                      className="px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                        {dateRangeDisplay}
                    </button>
                    <button
                      onClick={handleNextMonth}
                      disabled={currentWeekStart.isSameOrAfter(moment().startOf('week'))}
                      className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Next Week"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                    </button>
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Page Views</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{totalViews}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active Users</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{totalUsers}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Unique Pages</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{totalPages}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Avg Views/User</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{avgViewsPerUser}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Pages Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Viewed Pages</h3>
            {topPagesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topPagesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width="auto" fontSize={14} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#8b5cf6" name="Views" />
                  <Bar dataKey="users" fill="#10b981" name="Users" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </div>

          {/* User Activity Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Active Users</h3>
            {userActivityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#3b82f6" name="Total Views" />
                  <Bar dataKey="pages" fill="#f59e0b" name="Unique Pages" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Page Stats Table */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Page Statistics</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page Path</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Users</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Viewed</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dateFilteredPageStats.map((page, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{page.pagePath}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{page.views}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">{page.uniqueUsers}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {moment(page.lastViewed).format('MMM DD, YYYY HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Activity Logs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by User</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="all">All Users</option>
                {dateFilteredUserStats.map(user => (
                  <option key={user.userId} value={user.userId}>{user.userId}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Page</label>
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="all">All Pages</option>
                {dateFilteredPageStats.map(page => (
                  <option key={page.pagePath} value={page.pagePath}>{page.pagePath}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Activity Logs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Activity Logs</h3>
            <span className="text-sm text-gray-500">Showing {filteredLogs.length} events</span>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-lg font-medium">No activity logs found</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredLogs.map((log) => (
                <div
                  key={`${log.userId}-${log.id}`}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-purple-100 text-purple-700">
                          {log.screenType}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 break-all">{log.screenName}</p>
                          <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {log.userId}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {moment(log.timestamp).format('MMM DD, YYYY HH:mm:ss')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                          expandedLog === log.id ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Analytics;
