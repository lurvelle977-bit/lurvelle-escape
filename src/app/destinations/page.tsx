import type { Metadata } from "next";
import DestinationsExplorer from "@/components/destinations/DestinationsExplorer";
import Footer from "@/components/footer/Footer";
import Navbar from "@/components/navbar/Navbar";

export const metadata: Metadata = {
  title: "Destinations — Lurvelle Escapes",
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
