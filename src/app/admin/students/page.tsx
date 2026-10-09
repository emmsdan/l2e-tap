import { Students } from "@/components/v2/admin-pages";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Students Admin — Learn2Earn",
  description: "Manage students, subscriptions, and facility assignments.",
};

export default function AdminStudentsPage() {
  return <Students />;
}
