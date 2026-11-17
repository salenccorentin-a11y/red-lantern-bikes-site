import { BikesView, bikesMetadata } from "@/views/BikesView";

export const metadata = bikesMetadata("en");

export default function BikesPage() {
  return <BikesView lang="en" />;
}
