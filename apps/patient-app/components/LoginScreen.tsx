import React from 'react';
import { SignInButton } from "@clerk/clerk-react";
import logo from '../assets/logo.svg';
import eclipseSticker from '../assets/eclipse-sticker.svg';

export const LoginScreen = () => (
  <div className="min-h-screen bg-[#17151E] flex flex-col items-center justify-center p-6 text-center">
    <div className="w-[340px] max-w-full h-32 mb-8 px-2">
      <img src={logo} alt="Eclipse" className="w-full h-full object-contain" />
    </div>
    <div className="w-20 h-20 mb-6 rounded-2xl overflow-hidden border-2 border-[#F26A2E]/60 shadow-lg shadow-[#F26A2E]/20">
      <img src={eclipseSticker} alt="Eclipse sticker logo" className="w-full h-full object-cover" />
    </div>
    <h1 className="text-3xl font-bold text-white mb-2">Eclipse</h1>
    <p className="text-[#C7B8CF] mb-10 max-w-xs text-sm">Maine Craft Cannabis. Howland • Monticello • Kenduskeag.</p>
    
    <div className="w-full max-w-sm">
      <SignInButton mode="modal">
        <button className="w-full py-4 bg-[#F26A2E] hover:bg-[#E24A2A] text-[#1A1A1A] rounded-xl font-bold shadow-lg shadow-black/30 transition-all active:scale-95 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          Sign In to Continue
        </button>
      </SignInButton>
    </div>
    <p className="mt-6 text-xs text-[#718096]">
      By signing in, you verify you are 21+ or a valid medical patient.
    </p>
  </div>
);
