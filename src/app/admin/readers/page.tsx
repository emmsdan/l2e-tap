import { Readers } from "@/components/v2/admin-pages";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Card Readers Admin — Learn2Earn",
  description: "Assign NFC readers to facilities and rooms.",
};

export default function AdminReadersPage() {
  return <Readers />;
}
