import { createFileRoute } from "@tanstack/react-router";
import { BUSINESS } from "@/lib/site";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Waki Packages" },
      {
        name: "description",
        content:
          "How Waki Packages collects, uses and protects customer information such as names, phone numbers, delivery locations and payment records.",
      },
      { property: "og:title", content: "Privacy Policy | Waki Packages" },
      { property: "og:description", content: "How we handle your personal information." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl">Privacy Policy</h1>
      <div className="mt-8 space-y-7 text-muted-foreground">
        <section>
          <h2 className="font-display text-xl text-foreground">Information we collect</h2>
          <p className="mt-2">
            Your name, phone number, email address, delivery location, profile picture, order
            details and M-Pesa transaction codes you submit.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-foreground">How we use it</h2>
          <p className="mt-2">
            To create your account, process and deliver your orders, verify payments, manage
            training bookings and reply to your messages.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-foreground">Keeping your data safe</h2>
          <p className="mt-2">
            Your account is protected by a password. Only you and authorised {BUSINESS.name} staff
            can see your orders. Customers cannot see or change another customer's information.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-foreground">Sharing</h2>
          <p className="mt-2">
            We do not sell your information. We only share what is needed to deliver your order.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-foreground">Your choices</h2>
          <p className="mt-2">
            You can update your profile at any time, or contact us on {BUSINESS.phone} to ask for
            your account to be removed.
          </p>
        </section>
      </div>
    </div>
  );
}
