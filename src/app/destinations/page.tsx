import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import DestinationsExplorer from "@/features/destinations/DestinationsExplorer";
import { getPublicDestinations } from "@/server/services/content.service";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Private day tours from Lisbon to Sintra, Arrábida, Óbidos, Évora, Porto and beyond — filter by region and budget.",
};

// Destinations page: interactive map of tours around Portugal
export default async function DestinationsPage() {
  const { tours, defaultId } = await getPublicDestinations();
  return (
    <>
      <Navbar page="destinations" />
      <DestinationsExplorer tours={tours} defaultId={defaultId} />
      <Footer wide />
    </>
  );
}
