import { TourView, tourMetadata, tourSlugs } from "@/views/ToursView";

// The page reads which tour before rendering; see src/views/ToursView.tsx.
export const instant = false;
export const generateStaticParams = tourSlugs;

export async function generateMetadata(props: PageProps<"/tours/[slug]">) {
  return tourMetadata("en", (await props.params).slug);
}

export default async function TourPage(props: PageProps<"/tours/[slug]">) {
  return <TourView lang="en" slug={(await props.params).slug} />;
}
