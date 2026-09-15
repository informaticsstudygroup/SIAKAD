import type { Metadata } from "next";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { MaterialTiles } from "@/features/landing/components/MaterialTiles";
import { AboutSection } from "@/features/landing/components/AboutSection";
import { ClassSection } from "@/features/landing/components/ClassSection";
import { JourneySection } from "@/features/landing/components/JourneySection";
import { CtaSection } from "@/features/landing/components/CtaSection";

export const metadata: Metadata = {
  title: "Komunitas Belajar Teknologi Mahasiswa Informatika",
  description:
    "Informatics Study Group (ISG) adalah komunitas belajar teknologi untuk mahasiswa: dasar pemrograman, web development dengan HTML, CSS, JavaScript, React, dan kolaborasi proyek.",
};

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <MaterialTiles />
      <AboutSection />
      <ClassSection />
      <JourneySection />
      <CtaSection />
    </>
  );
}
