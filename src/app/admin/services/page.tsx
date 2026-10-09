import { Services } from "@/components/v2/admin-pages";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services Admin — Learn2Earn",
  description: "The support menu. Set pricing, availability, and card access.",
};

export default function AdminServicesPage() {
  return <Services />;
}
