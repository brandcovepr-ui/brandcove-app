
import Navbar from "../components/ui/website/Navbar";
import Hero from "../components/ui/website/Hero";
import HowItWorks from "../components/ui/website/HowItWorks";
import TalentGrid from "../components/ui/website/TalentGrid";
import CustomersSection from "../components/ui/website/CustomersSection";
import CTABanner from "../components/ui/website/CTABanner";
import Footer from "../components/ui/website/Footer";

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
