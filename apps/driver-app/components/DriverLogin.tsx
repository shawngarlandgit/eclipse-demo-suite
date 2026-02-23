import React, { useState } from 'react';
import { Truck, Loader2 } from 'lucide-react';
import eclipseLogo from '../assets/logo.svg';

interface DriverLoginProps {
  onLogin: (id: string) => void;
  isLoading?: boolean;
}

export const DriverLogin: React.FC<DriverLoginProps> = ({ onLogin, isLoading }) => {
  const [driverId, setDriverId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (driverId.trim() && !isLoading) {
      setIsSubmitting(true);
      await onLogin(driverId.trim().toUpperCase());
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1C1630] flex flex-col items-center justify-center p-6 text-center text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-60 h-60 bg-[#F26A2E]/12 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-60 h-60 bg-[#2CBFAE]/12 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Brand mark + role marker */}
        <div className="relative w-28 h-28 mx-auto mb-8">
          <div className="absolute inset-0 bg-[#111420] rounded-3xl border border-[#3A3D58] shadow-2xl shadow-black/40 flex items-center justify-center">
            <img src={eclipseLogo} alt="Eclipse Cannabis" className="w-20 h-20 object-contain" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-11 h-11 bg-[#2CBFAE] rounded-xl border-2 border-[#1C1630] flex items-center justify-center shadow-lg shadow-[#2CBFAE]/30">
            <Truck className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-[#D9D5E3] bg-clip-text text-transparent">
          Eclipse
        </h1>
        <h2 className="text-xl text-[#2CBFAE] font-semibold mb-2">Driver Console</h2>
        <p className="text-[#8E8AA0] mb-10 text-sm">
          Enter your Driver ID to start your shift
        </p>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="DRV-001"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value.toUpperCase())}
              disabled={isLoading || isSubmitting}
              className="w-full bg-[#232437] border-2 border-[#3A3D58] rounded-2xl px-5 py-4 text-white text-center text-lg font-mono tracking-wider focus:outline-none focus:border-[#F26A2E] transition-colors placeholder:text-[#595579] disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={!driverId.trim() || isLoading || isSubmitting}
            className="w-full py-4 bg-[#F26A2E] hover:bg-[#E24A2A] disabled:bg-[#3A3D58] disabled:text-[#8E8AA0] text-white rounded-2xl font-bold text-lg shadow-lg shadow-[#F26A2E]/20 transition-all active:scale-[0.98] disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {isLoading || isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              'Start Shift'
            )}
          </button>
        </form>

        {/* Help text */}
        <p className="text-[#8E8AA0] text-xs mt-8">
          Contact your dispatcher if you don't have a Driver ID
        </p>

        {/* Version */}
        <p className="text-[#595579] text-xs mt-4 font-mono">
          v1.0.0 • Eclipse Driver
        </p>
      </div>
    </div>
  );
};
