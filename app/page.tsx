import { DashboardPreview } from "@/components/home/DashboardPreview";
import { HomeCta } from "@/components/home/HomeCta";
import { HomeHero } from "@/components/home/HomeHero";

export default function HomePage() {
  return (
    <main className="home-page">
      <HomeHero />
      <DashboardPreview />
      <HomeCta />
    </main>
  );
}
