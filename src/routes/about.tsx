import { createFileRoute } from "@tanstack/react-router";
import { Target, Eye } from "lucide-react";
import { BUSINESS } from "@/lib/site";
import heroBags from "@/assets/hero-bags.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us | Waki Packages" },
      {
        name: "description",
        content:
          "Waki Packages specializes in quality paper packaging products for businesses and individuals in Murang'a County.",
      },
      { property: "og:title", content: "About Us | Waki Packages" },
      {
        property: "og:description",
        content: "Practical, affordable and reliable paper packaging solutions.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl">About Us</h1>
      <p className="mt-4 max-w-3xl text-lg text-muted-foreground">{BUSINESS.about}</p>

      <div className="mt-8 overflow-hidden rounded-2xl shadow-card">
        <img
          src={heroBags}
          alt="Brown paper packaging bags from Waki Packages"
          loading="lazy"
          width={1600}
          height={1008}
          className="w-full object-cover"
        />
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <div className="surface-card p-6">
          <Target className="h-6 w-6 text-primary" />
          <h2 className="mt-3 text-2xl">Mission</h2>
          <p className="mt-2 text-muted-foreground">{BUSINESS.mission}</p>
        </div>
        <div className="surface-card p-6">
          <Eye className="h-6 w-6 text-primary" />
          <h2 className="mt-3 text-2xl">Vision</h2>
          <p className="mt-2 text-muted-foreground">{BUSINESS.vision}</p>
        </div>
      </div>

      <div className="surface-card mt-8 p-6">
        <h2 className="text-2xl">Find us</h2>
        <p className="mt-2 text-muted-foreground">{BUSINESS.location}</p>
        <p className="mt-1 text-muted-foreground">
          {BUSINESS.days}, {BUSINESS.hours}
        </p>
        <p className="mt-1 text-muted-foreground">Phone: {BUSINESS.phone}</p>
      </div>
    </div>
  );
}
