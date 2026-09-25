import packagingBags from "@/assets/product-packaging-bags.jpg";
import bookCovers from "@/assets/product-book-covers.jpg";
import envelopes from "@/assets/product-envelopes.jpg";
import cakeBoxes from "@/assets/product-cake-boxes.jpg";
import popcornBags from "@/assets/product-popcorn-bags.jpg";
import charcoal from "@/assets/product-charcoal-briquettes.jpg";
import giftBags from "@/assets/product-gift-bags.jpg";

export const BUSINESS = {
  name: "Waki Packages",
  tagline: "Quality paper packaging solutions for businesses and individuals.",
  phone: "072509498",
  whatsapp: "25472509498",
  location: "Murang'a County, Kiria-ini Town, Behind Bingo Hardware",
  days: "Monday – Saturday",
  hours: "8:00 AM – 5:00 PM",
  facebook: "Waki Paper and Production",
  tiktok: "Waki Paper and Production",
  facebookUrl: "https://www.facebook.com/search/top?q=Waki%20Paper%20and%20Production",
  tiktokUrl: "https://www.tiktok.com/search?q=Waki%20Paper%20and%20Production",
  about:
    "We specialize with quality paper packaging products for businesses and individuals. We focus on providing practical, affordable, and reliable packaging solutions.",
  mission:
    "To provide quality and affordable paper packaging products that meet our customers' needs.",
  vision:
    "To become a trusted and leading provider of sustainable paper packaging solutions.",
  trainingFee: 15000,
} as const;

export const whatsappLink = (message = "Hello Waki Packages, I would like to make an order.") =>
  `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(message)}`;

export const CATEGORY_IMAGES: Record<string, string> = {
  "packaging-bags": packagingBags,
  "book-covers": bookCovers,
  envelopes: envelopes,
  "cake-boxes": cakeBoxes,
  "popcorn-bags": popcornBags,
  "charcoal-briquettes": charcoal,
  "gift-bags": giftBags,
};

export const productImage = (imageKey?: string | null) =>
  (imageKey && CATEGORY_IMAGES[imageKey]) || packagingBags;

export const CATEGORIES = [
  "Packaging Bags",
  "Book Covers",
  "Envelopes",
  "Cake Boxes",
  "Popcorn Bags",
  "Charcoal Briquettes",
  "Gift Bags",
] as const;

export const ORDER_STATUSES = [
  "Pending Payment",
  "Payment Verification",
  "Paid",
  "Processing",
  "Ready for Delivery",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
] as const;

export const ksh = (value: number) =>
  `KSh ${Number(value).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
