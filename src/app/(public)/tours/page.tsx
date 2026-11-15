import { ToursView, toursMetadata } from "@/views/ToursView";

export const metadata = toursMetadata("en");

export default function ToursPage() {
  return <ToursView lang="en" />;
}
