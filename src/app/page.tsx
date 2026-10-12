import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import ContactSection from "@/features/contact/ContactSection";
import About from "@/sections/home/About";
import ComfortTiers from "@/sections/home/ComfortTiers";
import Experiences from "@/sections/home/Experiences";
import Fleet from "@/sections/home/Fleet";
import Hero from "@/sections/home/Hero";
import TrustBar from "@/sections/home/TrustBar";

// Home page: sections in the order of the design
export default function HomePage() {
  return (
    <>
      <Navbar page="home" />
      <main className="overflow-x-hidden">
        <Hero />
        <TrustBar />
        <Experiences />
        <ComfortTiers />
        <Fleet />
        <About />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
