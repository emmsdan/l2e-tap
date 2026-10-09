import { Overview } from "@/components/v2/admin-pages";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Overview — Learn2Earn",
  description: "Student support programme statistics and overview.",
};

export default function AdminPage() {
  return <Overview />;
}
