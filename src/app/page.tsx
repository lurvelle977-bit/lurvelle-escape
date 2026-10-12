import About from "@/components/about/About";
import ComfortTiers from "@/components/comfort/ComfortTiers";
import Contact from "@/components/contact/Contact";
import Experiences from "@/components/experiences/Experiences";
import Fleet from "@/components/fleet/Fleet";
import Footer from "@/components/footer/Footer";
import Hero from "@/components/hero/Hero";
import Navbar from "@/components/navbar/Navbar";
import TrustBar from "@/components/trust-bar/TrustBar";

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
        <Contact />
      </main>
      <Footer />
    </>
  );
}
