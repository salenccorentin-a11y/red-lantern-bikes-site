import { FaqView, faqMetadata } from "@/views/FaqContactViews";

export const metadata = faqMetadata("en");

export default function FaqPage() {
  return <FaqView lang="en" />;
}
