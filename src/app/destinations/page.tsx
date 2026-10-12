import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import DestinationsExplorer from "@/features/destinations/DestinationsExplorer";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Private day tours from Lisbon to Sintra, Arrábida, Óbidos, Évora, Porto and beyond — filter by region and budget.",
};

// Destinations page: interactive map of tours around Portugal
export default function DestinationsPage() {
  return (
    <>
      <Navbar page="destinations" />
      <DestinationsExplorer />
      <Footer wide />
    </>
  );
}
