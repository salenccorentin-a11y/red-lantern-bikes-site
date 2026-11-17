import { BikeView, bikeMetadata, bikeSlugs } from "@/views/BikeView";

// The page reads which bike before rendering; see src/views/BikeView.tsx.
export const instant = false;
export const generateStaticParams = bikeSlugs;

export async function generateMetadata(props: PageProps<"/bikes/[slug]">) {
  return bikeMetadata("en", (await props.params).slug);
}

export default async function BikePage(props: PageProps<"/bikes/[slug]">) {
  return <BikeView lang="en" slug={(await props.params).slug} />;
}
