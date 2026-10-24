"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeatureCards from "@/components/FeatureCards";
import LatestActivities from "@/components/LatestActivities";
import TeamPreview from "@/components/TeamPreview";
import Footer from "@/components/Footer";
import JoinModal from "@/components/JoinModal";
import SearchModal from "@/components/SearchModal";

export default function Home() {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F5F5F3] flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Top Floating Navigation Header */}
      <Header
        onOpenJoin={() => setIsJoinModalOpen(true)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <HeroSection onOpenJoin={() => setIsJoinModalOpen(true)} />

        {/* Feature Cards Row (Featured Photo & Upcoming Event) */}
        <FeatureCards onOpenJoin={() => setIsJoinModalOpen(true)} />

        {/* Bottom Adjacent Panels: Latest Activities & The People Behind ShutterScape */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 mb-12 sm:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
            {/* Latest Activities Panel (7 cols on lg) */}
            <div className="lg:col-span-7 flex flex-col">
              <LatestActivities />
            </div>

            {/* The People Behind ShutterScape Panel (5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col">
              <TeamPreview />
            </div>
          </div>
        </section>
      </main>

      {/* Compact Official Footer */}
      <Footer />

      {/* Interactive Modals */}
      <JoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </div>
  );
}
