'use client'

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import TalentGrid from "@/components/TalentGrid";
import CustomersSection from "@/components/CustomersSection";
import CTABanner from "@/components/CTABanner";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <HowItWorks />
      <TalentGrid />
      <CustomersSection />
      <CTABanner />
      <Footer />
    </main>
  );
}
