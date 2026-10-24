"use client";

import React from "react";
import { X, ArrowRight, Camera, CheckCircle2, MessageCircle } from "lucide-react";

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinModal({ isOpen, onClose }: JoinModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#111315] border border-[#303338] p-6 sm:p-8 shadow-2xl text-left">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#17191C] border border-[#303338] flex items-center justify-center text-[#B5B8BC] hover:text-white hover:border-white transition"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] tracking-widest uppercase font-semibold text-[#D5D9DE] block">
              GCU Photography Club
            </span>
            <h3 className="text-xl font-bold text-[#F5F5F3]">Join ShutterScape</h3>
          </div>
        </div>

        <p className="text-[#B5B8BC] text-sm mb-6 leading-relaxed">
          Open to all students of Girijananda Chowdhury University (GCU). Whether you shoot with a DSLR, mirrorless, or smartphone, your story belongs here!
        </p>

        {/* Benefits list */}
        <div className="space-y-2.5 mb-6 text-xs text-[#B5B8BC] bg-[#17191C] p-4 rounded-2xl border border-[#303338]">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span>Participate in exclusive campus photo walks and expeditions</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span>Hands-on workshops with camera gear and editing masterclasses</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span>Showcase your work in the annual World Photography Day Exhibition</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://chat.whatsapp.com/Hs71BicR1Xj3PmOyPJ5wdc?s=sw&p=a&mlu=4&ilr=4"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-[#D5D9DE] text-[#08090A] font-semibold text-sm py-3 px-5 rounded-full shadow-lg shadow-white/5 transition"
          >
            <MessageCircle className="w-4 h-4" />
            Join WhatsApp Group
            <ArrowRight className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-full border border-[#303338] hover:border-white text-[#B5B8BC] hover:text-white text-sm font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
