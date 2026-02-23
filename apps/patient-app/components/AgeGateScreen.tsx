import React, { useState, useRef } from 'react';
import logo from '../assets/logo.svg';
import eclipseSticker from '../assets/eclipse-sticker.svg';

export const AgeGateScreen: React.FC<{ onVerify: () => void }> = ({ onVerify }) => {
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');

  const dayRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);
    const yearNum = parseInt(year, 10);

    // Validate inputs
    if (!monthNum || monthNum < 1 || monthNum > 12) {
      setError('Please enter a valid month (1-12).');
      return;
    }
    if (!dayNum || dayNum < 1 || dayNum > 31) {
      setError('Please enter a valid day (1-31).');
      return;
    }
    if (!yearNum || yearNum < 1900 || yearNum > new Date().getFullYear()) {
      setError('Please enter a valid year.');
      return;
    }

    const today = new Date();
    const birth = new Date(yearNum, monthNum - 1, dayNum);

    // Check if date is valid
    if (isNaN(birth.getTime())) {
      setError('Please enter a valid date.');
      return;
    }

    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    if (age >= 21) {
      onVerify();
    } else {
      setError('You must be 21 or older to enter.');
    }
  };

  const handleMonthChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 2);
    setMonth(cleaned);
    setError('');
    if (cleaned.length === 2) {
      dayRef.current?.focus();
    }
  };

  const handleDayChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 2);
    setDay(cleaned);
    setError('');
    if (cleaned.length === 2) {
      yearRef.current?.focus();
    }
  };

  const handleYearChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setYear(cleaned);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#1C1630] flex flex-col items-center justify-center px-6 py-12 text-center text-white safe-area-inset">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        {/* Logo */}
        <div className="w-[340px] max-w-full h-28 mb-8 px-2">
          <img src={logo} alt="Eclipse" className="w-full h-full object-contain" />
        </div>
        <div className="w-16 h-16 mb-6 rounded-xl overflow-hidden border border-[#F26A2E]/50">
          <img src={eclipseSticker} alt="Eclipse sticker logo" className="w-full h-full object-cover" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-2">Age Verification</h1>
        <p className="text-[#A0AEC0] mb-8 text-sm">Please enter your birthdate to continue.</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#718096] uppercase mb-3 text-left tracking-wider">Date of Birth</label>
            <div className="flex gap-3">
              {/* Month */}
              <div className="flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM"
                  maxLength={2}
                  value={month}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="w-full bg-[#232C33] border border-[#2D3748] rounded-xl px-3 py-4 text-white text-lg text-center focus:outline-none focus:ring-2 focus:ring-[#F26A2E] transition-all placeholder:text-[#4A5568]"
                />
                <span className="text-xs text-[#718096] mt-1 block">Month</span>
              </div>

              {/* Day */}
              <div className="flex-1">
                <input
                  ref={dayRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="DD"
                  maxLength={2}
                  value={day}
                  onChange={(e) => handleDayChange(e.target.value)}
                  className="w-full bg-[#232C33] border border-[#2D3748] rounded-xl px-3 py-4 text-white text-lg text-center focus:outline-none focus:ring-2 focus:ring-[#F26A2E] transition-all placeholder:text-[#4A5568]"
                />
                <span className="text-xs text-[#718096] mt-1 block">Day</span>
              </div>

              {/* Year */}
              <div className="flex-[1.5]">
                <input
                  ref={yearRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="YYYY"
                  maxLength={4}
                  value={year}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-full bg-[#232C33] border border-[#2D3748] rounded-xl px-3 py-4 text-white text-lg text-center focus:outline-none focus:ring-2 focus:ring-[#F26A2E] transition-all placeholder:text-[#4A5568]"
                />
                <span className="text-xs text-[#718096] mt-1 block">Year</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-[#F26A2E] hover:bg-[#E24A2A] text-white rounded-xl font-bold text-lg shadow-lg shadow-black/30 transition-all active:scale-[0.98]"
          >
            Enter Store
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-[#718096] px-4">
        By entering, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
};
