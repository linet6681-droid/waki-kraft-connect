import { Link } from "@tanstack/react-router";
import { Facebook, Music2, MessageCircle, MapPin, Phone, Clock } from "lucide-react";
import { BUSINESS, whatsappLink } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="font-display text-xl">{BUSINESS.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{BUSINESS.tagline}</p>
          <div className="mt-4 flex gap-3">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
            <a
              href={BUSINESS.facebookUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href={BUSINESS.tiktokUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Music2 className="h-5 w-5" />
            </a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Facebook &amp; TikTok: {BUSINESS.facebook}
          </p>
        </div>

        <div>
          <h4 className="font-display text-base">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/about" className="hover:text-foreground">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/goods" className="hover:text-foreground">
                Goods Offered
              </Link>
            </li>
            <li>
              <Link to="/pricing" className="hover:text-foreground">
                Pricing
              </Link>
            </li>
            <li>
              <Link to="/training" className="hover:text-foreground">
                Training
              </Link>
            </li>
            <li>
              <Link to="/orders" className="hover:text-foreground">
                Orders
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-foreground">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base">Legal</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/terms" className="hover:text-foreground">
                Terms and Conditions
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-foreground">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base">Visit us</h4>
          <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {BUSINESS.location}
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" />
              <a href={`tel:${BUSINESS.phone}`} className="hover:text-foreground">
                {BUSINESS.phone}
              </a>
            </li>
            <li className="flex gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {BUSINESS.days}
                <br />
                {BUSINESS.hours}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © 2026 {BUSINESS.name}. All Rights Reserved.
      </div>
    </footer>
  );
}
