import { useState } from "react";
import { RefreshCw } from "lucide-react";

type TimeMode = "moment" | "range";

export default function App() {
  const [timeMode, setTimeMode] = useState<TimeMode>("moment");
  const [momentTime, setMomentTime] = useState("2025-06-15T00:01:00Z");
  const [rangeStart, setRangeStart] = useState("2025-06-15T00:00:00Z");
  const [rangeEnd, setRangeEnd] = useState("2025-06-15T00:05:00Z");

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Sticky Navbar - Squircle */}
      <nav className="sticky top-4 z-50 mx-4 lg:mx-8 mt-4">
        <div className="navbar-squircle bg-white/90 border border-gray-100 px-10 py-4 shadow-lg max-w-7xl mx-auto">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Logo" className="w-9 h-9" />
              <h1 className="font-heading text-lg md:text-xl font-bold text-black">
                Stream Analytics
              </h1>
            </div>
            <button className="btn-squircle btn bg-[#6bda0a] hover:bg-[#56b008] text-black border-none px-5 py-2.5 font-medium flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full p-6 lg:p-12 flex-1">
        {/* Time Selector - Squircle Card */}
        <div className="card-squircle bg-white p-6 lg:p-8 mb-8">
          {/* Mode Toggle */}
          <div className="flex gap-3 mb-6">
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

          {/* Time Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {timeMode === "moment" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Select Timestamp</label>
                <input
                  type="datetime-local"
                  value={momentTime.slice(0, 16)}
                  onChange={(e) => setMomentTime(e.target.value + ":00Z")}
                  className="btn-squircle w-full px-4 py-3 bg-gray-50 border border-gray-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#6bda0a] focus:border-transparent transition-all"
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Start Time</label>
                  <input
                    type="datetime-local"
                    value={rangeStart.slice(0, 16)}
                    onChange={(e) => setRangeStart(e.target.value + ":00Z")}
                    className="btn-squircle w-full px-4 py-3 bg-gray-50 border border-gray-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#6bda0a] focus:border-transparent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">End Time</label>
                  <input
                    type="datetime-local"
                    value={rangeEnd.slice(0, 16)}
                    onChange={(e) => setRangeEnd(e.target.value + ":00Z")}
                    className="btn-squircle w-full px-4 py-3 bg-gray-50 border border-gray-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#6bda0a] focus:border-transparent transition-all"
                  />
                </div>
              </>
            )}
          </div>

          {/* Apply Button */}
          <div className="mt-6">
            <button className="btn-squircle bg-[#6bda0a] hover:bg-[#56b008] text-black px-8 py-3 font-semibold shadow-md">
              Apply Filter
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {[
            { label: "Active Users", value: "--" },
            { label: "Peak Concurrency", value: "--" },
            { label: "Total Events", value: "--" },
            { label: "Time Range", value: "--" },
          ].map((card, i) => (
            <div key={i} className="card-squircle bg-white p-5">
              <p className="text-sm font-medium text-gray-500 mb-2">{card.label}</p>
              <p className="text-2xl lg:text-3xl font-bold font-heading text-black">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            { title: "By Country" },
            { title: "By Device" },
            { title: "By Video" },
            { title: "Activity Timeline" },
          ].map((chart, i) => (
            <div key={i} className="card-squircle bg-white p-6 min-h-[280px]">
              <h3 className="font-heading text-lg font-semibold text-black mb-4">{chart.title}</h3>
              <div className="flex items-center justify-center h-44">
                <div className="text-gray-300 text-sm">Chart Placeholder</div>
              </div>
            </div>
          ))}
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