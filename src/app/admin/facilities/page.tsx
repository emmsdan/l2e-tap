import { Facilities } from "@/components/v2/admin-pages";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facilities Admin — Learn2Earn",
  description: "Learning spaces, accommodation, shuttle routes, and kitchens.",
};

export default function AdminFacilitiesPage() {
  return <Facilities />;
}
