import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  getActiveUsersCount,
  getActiveUsersAt,
  buildTrackActive,
  getActiveUsersByCountry,
  getActiveUsersByDevice,
  getActiveUsersByVideo,
} from "./lib/api";
import { DateTimePicker } from "./components/DateTimePicker";

type TimeMode = "moment" | "range";

const COLORS = ["#6bda0a", "#56b008", "#8fe43a", "#a8e54d", "#c4eb7a"];

const PRESETS = [
  { label: "Last 15 min", minutes: 15 },
  { label: "Last 30 min", minutes: 30 },
  { label: "Last 1 hour", minutes: 60 },
  { label: "Last 3 hours", minutes: 180 },
];

function toIsoString(date: string, time: string): string {
  return `${date}T${time}:00`;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function App() {
  const queryClient = useQueryClient();
  const [timeMode, setTimeMode] = useState<TimeMode>("range");

  // Moment mode state - default to June 15 2025
  const [momentDate, setMomentDate] = useState("2025-06-15");
  const [momentTime, setMomentTime] = useState("12:00");

  // Range mode state - default to June 15 2025 (dataset date)
  const [rangeStartDate, setRangeStartDate] = useState("2025-06-15");
  const [rangeStartTime, setRangeStartTime] = useState("00:00");
  const [rangeEndDate, setRangeEndDate] = useState("2025-06-15");
  const [rangeEndTime, setRangeEndTime] = useState("23:59");
  const [timeRangeDisplay, setTimeRangeDisplay] = useState("");
  const [refetchKey, setRefetchKey] = useState(0);

  // Calculate time range display
  useEffect(() => {
    if (rangeStartDate && rangeEndDate) {
      const start = new Date(`${rangeStartDate}T${rangeStartTime}`);
      const end = new Date(`${rangeEndDate}T${rangeEndTime}`);
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.round(diffMs / 60000);
      if (diffMins < 60) setTimeRangeDisplay(`${diffMins} min`);
      else if (diffMins < 1440) setTimeRangeDisplay(`${Math.round(diffMins / 60)} hr`);
      else setTimeRangeDisplay(`${Math.round(diffMins / 1440)} days`);
    }
  }, [rangeStartDate, rangeStartTime, rangeEndDate, rangeEndTime]);

  // Apply preset
  const applyPreset = (minutes: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - minutes * 60000);
    start.setSeconds(0, 0);
    end.setSeconds(0, 0);
    setRangeStartDate(formatDate(start));
    setRangeStartTime(`${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`);
    setRangeEndDate(formatDate(end));
    setRangeEndTime(`${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`);
  };

  // Query for range mode
  const { data: rangeData, isLoading: rangeLoading } = useQuery({
    queryKey: ["activeUsersRange", rangeStartDate, rangeStartTime, rangeEndDate, rangeEndTime, refetchKey],
    queryFn: () => getActiveUsersCount(toIsoString(rangeStartDate, rangeStartTime), toIsoString(rangeEndDate, rangeEndTime)),
    enabled: timeMode === "range" && !!(rangeStartDate && rangeEndDate),
  });

  // Query for moment mode
  const { data: momentData, isLoading: momentLoading } = useQuery({
    queryKey: ["activeUsersAt", momentDate, momentTime, refetchKey],
    queryFn: () => getActiveUsersAt(toIsoString(momentDate, momentTime)),
    enabled: timeMode === "moment" && !!(momentDate && momentTime),
  });

  // Mutation for building track active
  const buildMutation = useMutation({
    mutationFn: (limit: number) => buildTrackActive(limit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeUsers"] });
    },
  });

  const handleRefresh = () => buildMutation.mutate(1000);
  const handleApply = () => {
    setRefetchKey((k) => k + 1);
  };

  const activeCount = timeMode === "range" ? rangeData?.count : momentData?.count;
  const isLoading = timeMode === "range" ? rangeLoading : momentLoading;

  // Breakdown queries with loading
  const { data: countryData, isLoading: countryLoading } = useQuery({
    queryKey: ["activeUsersByCountry", rangeStartDate, rangeStartTime, rangeEndDate, rangeEndTime, refetchKey],
    queryFn: () => getActiveUsersByCountry(toIsoString(rangeStartDate, rangeStartTime), toIsoString(rangeEndDate, rangeEndTime)),
    enabled: timeMode === "range" && !!(rangeStartDate && rangeEndDate),
  });

  const { data: deviceData, isLoading: deviceLoading } = useQuery({
    queryKey: ["activeUsersByDevice", rangeStartDate, rangeStartTime, rangeEndDate, rangeEndTime, refetchKey],
    queryFn: () => getActiveUsersByDevice(toIsoString(rangeStartDate, rangeStartTime), toIsoString(rangeEndDate, rangeEndTime)),
    enabled: timeMode === "range" && !!(rangeStartDate && rangeEndDate),
  });

  const { data: videoData, isLoading: videoLoading } = useQuery({
    queryKey: ["activeUsersByVideo", rangeStartDate, rangeStartTime, rangeEndDate, rangeEndTime, refetchKey],
    queryFn: () => getActiveUsersByVideo(toIsoString(rangeStartDate, rangeStartTime), toIsoString(rangeEndDate, rangeEndTime)),
    enabled: timeMode === "range" && !!(rangeStartDate && rangeEndDate),
  });

  // Overall loading state
  const isAnyLoading = isLoading || countryLoading || deviceLoading || videoLoading;

  // Generate timeline data
  const generateTimelineData = () => {
    if (!rangeStartDate || !rangeEndDate) return [];
    const points = [];
    const startDate = new Date(`${rangeStartDate}T${rangeStartTime}`);
    const endDate = new Date(`${rangeEndDate}T${rangeEndTime}`);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.ceil(diffMs / 60000);
    const interval = Math.max(1, Math.floor(diffMins / 10));
    const count = activeCount || 0;

    for (let i = 0; i <= diffMins; i += interval) {
      const time = new Date(startDate.getTime() + i * 60000);
      const variance = Math.floor(count * 0.3);
      const active = Math.max(0, count + Math.floor(Math.random() * variance * 2 - variance));
      points.push({
        time: time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
        active,
      });
    }
    return points;
  };

  const timelineData = generateTimelineData();

  // Transform API data for charts
  const countryChartData = countryData?.data?.slice(0, 5).map((d) => ({
    name: d.country || "Unknown",
    value: d.count,
  })) ?? [];

  const deviceChartData = deviceData?.data?.slice(0, 3).map((d) => ({
    name: d.device || "Unknown",
    value: d.count,
  })) ?? [];

  const videoChartData = videoData?.data?.slice(0, 5).map((d) => ({
    name: d.title || d.video_id || "Unknown",
    views: d.count,
  })) ?? [];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Sticky Navbar */}
      <nav className="sticky top-4 z-40 mx-4 lg:mx-8 mt-4">
        <div className="navbar-squircle bg-white/90 border border-gray-100 px-10 py-4 shadow-lg max-w-7xl mx-auto">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Logo" className="w-9 h-9" />
              <h1 className="font-heading text-lg md:text-xl font-bold text-black">Stream Analytics</h1>
            </div>
            <button
              onClick={handleRefresh}
              disabled={buildMutation.isPending}
              className="btn-squircle btn bg-[#6bda0a] hover:bg-[#56b008] text-black border-none px-5 py-2.5 font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${buildMutation.isPending ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full p-4 lg:p-8 flex-1">
        {/* Time Selector Card */}
        <div className="card-squircle bg-white p-4 lg:p-6 mb-4">
          {/* Mode Toggle */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setTimeMode("moment")}
              className={`btn-squircle px-5 py-2.5 font-medium text-sm ${
                timeMode === "moment"
                  ? "bg-[#6bda0a] text-black shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              At Moment
            </button>
            <button
              onClick={() => setTimeMode("range")}
              className={`btn-squircle px-5 py-2.5 font-medium text-sm ${
                timeMode === "range"
                  ? "bg-[#6bda0a] text-black shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              In Range
            </button>
          </div>

          {/* Time Inputs - Using Custom DateTime Pickers */}
          <div className="space-y-3">
            {timeMode === "moment" ? (
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-500">Point in Time</label>
                <DateTimePicker
                  value={`${momentDate}T${momentTime}`}
                  onChange={(v) => {
                    const [d, t] = v.split("T");
                    setMomentDate(d);
                    setMomentTime(t?.slice(0, 5) || "00:00");
                  }}
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-500">From</label>
                    <DateTimePicker
                      value={`${rangeStartDate}T${rangeStartTime}`}
                      onChange={(v) => {
                        const [d, t] = v.split("T");
                        setRangeStartDate(d);
                        setRangeStartTime(t?.slice(0, 5) || "00:00");
                      }}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-500">To</label>
                    <DateTimePicker
                      value={`${rangeEndDate}T${rangeEndTime}`}
                      onChange={(v) => {
                        const [d, t] = v.split("T");
                        setRangeEndDate(d);
                        setRangeEndTime(t?.slice(0, 5) || "00:00");
                      }}
                    />
                  </div>
                </div>
                {timeRangeDisplay && (
                  <p className="text-xs text-gray-400 font-medium">Selected range: {timeRangeDisplay}</p>
                )}
              </>
            )}
          </div>

          {/* Apply Button */}
          <div className="mt-6">
            <button
              onClick={handleApply}
              disabled={isAnyLoading}
              className="btn-squircle bg-[#6bda0a] hover:bg-[#56b008] text-black px-8 py-3 font-semibold shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {isAnyLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                "Apply Filter"
              )}
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4">
          <div className="card-squircle bg-white p-5">
            <p className="text-sm font-medium text-gray-500 mb-2">Active Users</p>
            <p className="text-2xl lg:text-3xl font-bold font-heading text-black">
              {isLoading ? "..." : activeCount ?? "--"}
            </p>
          </div>
          <div className="card-squircle bg-white p-5">
            <p className="text-sm font-medium text-gray-500 mb-2">Countries</p>
            <p className="text-2xl lg:text-3xl font-bold font-heading text-black">
              {countryData?.data?.length ?? 0}
            </p>
          </div>
          <div className="card-squircle bg-white p-5">
            <p className="text-sm font-medium text-gray-500 mb-2">Devices</p>
            <p className="text-2xl lg:text-3xl font-bold font-heading text-black">
              {deviceData?.data?.length ?? 0}
            </p>
          </div>
          <div className="card-squircle bg-white p-5">
            <p className="text-sm font-medium text-gray-500 mb-2">Videos</p>
            <p className="text-2xl lg:text-3xl font-bold font-heading text-black">
              {videoData?.data?.length ?? 0}
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* By Country */}
          <div className="card-squircle bg-white p-4 min-h-[280px]">
            <h3 className="font-heading text-lg font-semibold text-black mb-4">By Country</h3>
            {countryLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-3 border-[#6bda0a] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : countryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={countryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fill: "#737373", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#737373", fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px" }} />
                  <Bar dataKey="value" fill="#6bda0a" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No country data for selected range</p>
            )}
          </div>

          {/* By Device */}
          <div className="card-squircle bg-white p-4 min-h-[280px]">
            <h3 className="font-heading text-lg font-semibold text-black mb-4">By Device</h3>
            {deviceLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-3 border-[#6bda0a] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : deviceChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={deviceChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                      {deviceChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {deviceChartData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No device data for selected range</p>
            )}
          </div>

          {/* By Video */}
          <div className="card-squircle bg-white p-4 min-h-[280px]">
            <h3 className="font-heading text-lg font-semibold text-black mb-4">By Video</h3>
            {videoLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-3 border-[#6bda0a] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : videoChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={videoChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fill: "#737373", fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#737373", fontSize: 11 }} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px" }} />
                  <Bar dataKey="views" fill="#6bda0a" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No video data for selected range</p>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="card-squircle bg-white p-4 min-h-[280px]">
            <h3 className="font-heading text-lg font-semibold text-black mb-4">Activity Timeline</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fill: "#737373", fontSize: 12 }} />
                <YAxis tick={{ fill: "#737373", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px" }} />
                <Line type="monotone" dataKey="active" stroke="#6bda0a" strokeWidth={3} dot={{ fill: "#6bda0a", strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: "#56b008" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer footer-center p-6 bg-white text-base-content border-t border-gray-100 mt-auto">
        <div>
          <p className="text-gray-500 font-medium">Stream Analytics Dashboard</p>
        </div>
      </footer>
    </div>
  );
}