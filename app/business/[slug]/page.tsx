import { notFound } from "next/navigation";
import { Metadata } from "next";
import { businessPoints } from "@/lib/businessData";
import BusinessDetailClient from "@/components/BusinessDetailClient";

export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
};

const zoneNames: Record<string, string> = {
  george: "George Central",
  wilderness: "Wilderness",
  sedgefield: "Sedgefield",
  knysna: "Knysna",
  plett: "Plettenberg Bay",
  mossel: "Mossel Bay",
  oudtshoorn: "Oudtshoorn",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  
  if (!slug || typeof slug !== "string") {
    return {
      title: "Business Details | Garden Route Defaults",
    };
  }
  
  const parts = slug.split("-");
  if (parts.length < 2) {
    return {
      title: "Business Details | Garden Route Defaults",
    };
  }
  
  const zoneId = parts[0];
  const nameParts = parts.slice(1);
  const businessName = nameParts.join(" ").replace(/-/g, " ");
  
  const businesses = businessPoints[zoneId] || [];
  const business = businesses.find(
    (b) => b.name.toLowerCase() === businessName.toLowerCase()
  );

  if (!business) {
    return {
      title: "Business Details | Garden Route Defaults",
    };
  }

  return {
    title: `${business.name} | ${zoneNames[zoneId] || zoneId} | Garden Route Defaults`,
    description: `Learn more about ${business.name}, a ${business.category} business in ${zoneNames[zoneId] || zoneId}, Garden Route. Contact: ${business.phone}`,
  };
}

export default async function BusinessDetailPage({ params }: Props) {
  const { slug } = params;
  
  if (!slug || typeof slug !== "string") {
    notFound();
  }
  
  // Parse slug to find business
  const parts = slug.split("-");
  if (parts.length < 2) {
    notFound();
  }
  
  const zoneId = parts[0];
  const nameParts = parts.slice(1);
  const businessName = nameParts.join(" ").replace(/-/g, " ");
  
  const businesses = businessPoints[zoneId] || [];
  const business = businesses.find(
    (b) => b.name.toLowerCase() === businessName.toLowerCase()
  );

  if (!business) {
    notFound();
  }

  return <BusinessDetailClient business={business} zoneId={zoneId} />;
}

