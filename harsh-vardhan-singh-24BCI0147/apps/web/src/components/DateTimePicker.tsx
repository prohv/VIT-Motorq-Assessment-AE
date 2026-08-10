import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
}

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(value || new Date());
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
  const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month);

  const prevMonth = () => {
    setViewDate((v) => ({ year: v.month === 0 ? v.year - 1 : v.year, month: v.month === 0 ? 11 : v.month - 1 }));
  };

  const nextMonth = () => {
    setViewDate((v) => ({ year: v.month === 11 ? v.year + 1 : v.year, month: v.month === 11 ? 0 : v.month + 1 }));
  };

  const selectDate = (day: number) => {
    const date = new Date(viewDate.year, viewDate.month, day);
    onChange(date.toISOString().split("T")[0]);
    setIsOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="btn-squircle w-full px-4 py-3 bg-gray-50 border border-gray-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#6bda0a] transition-all text-left flex items-center justify-between">
        <span>{value || "Select date"}</span>
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-[300px]">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <span className="font-semibold text-black">{MONTHS[viewDate.month]} {viewDate.year}</span>
            <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-5 h-5" /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelected = value === dateStr;
              const isToday = new Date().toISOString().split("T")[0] === dateStr;
              return (
                <button key={day} onClick={() => selectDate(day)} className={`aspect-square rounded-lg text-sm font-medium transition-all ${isSelected ? "bg-[#6bda0a] text-black" : isToday ? "bg-gray-100 text-black hover:bg-gray-200" : "hover:bg-gray-50 text-gray-700"}`}>
                  {day}
                </button>
              );
            })}
          </div>

          <button onClick={() => { onChange(new Date().toISOString().split("T")[0]); setIsOpen(false); }} className="mt-4 w-full py-2 text-sm font-medium text-[#6bda0a] hover:bg-[#6bda0a]/10 rounded-lg transition-colors">Today</button>
        </div>
      )}
    </div>
  );
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(() => parseInt((value || "00:00").split(":")[0]));
  const [minutes, setMinutes] = useState(() => parseInt((value || "00:00").split(":")[1]));
  const [hourText, setHourText] = useState(String(hours).padStart(2, "0"));
  const [minText, setMinText] = useState(String(minutes).padStart(2, "0"));
  const hourRef = useRef<HTMLInputElement>(null);
  const minRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHourText(String(hours).padStart(2, "0"));
    setMinText(String(minutes).padStart(2, "0"));
  }, [hours, minutes]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
    setHourText(v);
    const h = parseInt(v);
    if (!isNaN(h) && h <= 23) setHours(h);
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
    setMinText(v);
    const m = parseInt(v);
    if (!isNaN(m) && m <= 59) setMinutes(m);
  };

  const confirmTime = () => {
    onChange(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`);
    setIsOpen(false);
  };

  const displayValue = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="btn-squircle w-full px-4 py-3 bg-gray-50 border border-gray-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#6bda0a] transition-all text-left flex items-center justify-between">
        <span>{displayValue}</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-[220px]">
          <div className="flex items-center justify-center gap-3">
            {/* Hours */}
            <div className="flex flex-col items-center">
              <button onClick={() => setHours((h) => (h + 1) % 24)} className="p-1 hover:bg-gray-100 rounded transition-colors"><ChevronUp className="w-5 h-5" /></button>
              <input
                ref={hourRef}
                type="text"
                value={hourText}
                onChange={handleHourChange}
                className="w-14 text-center text-2xl font-bold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:border-[#6bda0a] focus:outline-none"
                maxLength={2}
              />
              <button onClick={() => setHours((h) => (h - 1 + 24) % 24)} className="p-1 hover:bg-gray-100 rounded transition-colors"><ChevronDown className="w-5 h-5" /></button>
            </div>
            <span className="text-2xl font-bold text-black -mt-6">:</span>
            {/* Minutes */}
            <div className="flex flex-col items-center">
              <button onClick={() => setMinutes((m) => (m + 1) % 60)} className="p-1 hover:bg-gray-100 rounded transition-colors"><ChevronUp className="w-5 h-5" /></button>
              <input
                ref={minRef}
                type="text"
                value={minText}
                onChange={handleMinChange}
                className="w-14 text-center text-2xl font-bold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:border-[#6bda0a] focus:outline-none"
                maxLength={2}
              />
              <button onClick={() => setMinutes((m) => (m - 1 + 60) % 60)} className="p-1 hover:bg-gray-100 rounded transition-colors"><ChevronDown className="w-5 h-5" /></button>
            </div>
          </div>
          <button onClick={confirmTime} className="mt-4 w-full py-2 bg-[#6bda0a] text-black font-semibold rounded-lg hover:bg-[#56b008] transition-colors">
            Set {displayValue}
          </button>
        </div>
      )}
    </div>
  );
}

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [date, time] = (value || "").split("T");
  const dateValue = date || "";
  const timeValue = time?.slice(0, 5) || "00:00";

  const handleDateChange = (d: string) => {
    onChange(`${d}T${timeValue}`);
  };

  const handleTimeChange = (t: string) => {
    onChange(`${dateValue}T${t}`);
  };

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <DatePicker value={dateValue} onChange={handleDateChange} />
      </div>
      <div className="w-32">
        <TimePicker value={timeValue} onChange={handleTimeChange} />
      </div>
    </div>
  );
}