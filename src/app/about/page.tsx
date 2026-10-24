"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JoinModal from "@/components/JoinModal";
import SearchModal from "@/components/SearchModal";
import AboutHero from "@/components/about/AboutHero";
import ClubStats from "@/components/about/ClubStats";
import WhoWeAre from "@/components/about/WhoWeAre";
import MissionVisionValues from "@/components/about/MissionVisionValues";
import WhereItAllStarts from "@/components/about/WhereItAllStarts";
import StudentsCarryItForward from "@/components/about/StudentsCarryItForward";
import TeamSection from "@/components/about/TeamSection";
import AboutCTA from "@/components/about/AboutCTA";

export default function AboutPage() {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F5F5F3] flex flex-col font-sans selection:bg-white selection:text-[#08090A] overflow-x-hidden">
      {/* Shared Navigation Header */}
      <Header
        activePage="about"
        onOpenJoin={() => setIsJoinModalOpen(true)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
      />

      {/* Main Content Sections with Balanced Editorial Hierarchy */}
      <main className="flex-1 w-full pb-10 sm:pb-16 space-y-2 sm:space-y-4">
        {/* A. Cinematic Photography Hero */}
        <AboutHero />

        {/* B. Club Statistics Row (4 Cards) */}
        <ClubStats />

        {/* C. Who We Are (Core Club Introduction) */}
        <WhoWeAre />

        {/* D. Mission, Vision and Values (3 Cards) */}
        <MissionVisionValues />

        {/* E. Where It All Starts (Founding Story & 2023 Alumni Pioneers) */}
        <WhereItAllStarts />

        {/* F. Students Carry It Forward (Student Legacy & Continuity) */}
        <StudentsCarryItForward />

        {/* G. The People Behind ShutterScape (Horizontal Leadership Section) */}
        <TeamSection />

        {/* H. Join ShutterScape Call To Action Banner */}
        <AboutCTA onOpenJoin={() => setIsJoinModalOpen(true)} />
      </main>

      {/* Shared Official Footer */}
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
