import { createFileRoute } from "@tanstack/react-router";
import { BUSINESS } from "@/lib/site";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions | Waki Packages" },
      {
        name: "description",
        content:
          "Terms and conditions for shopping, payment verification, delivery, training bookings and refunds at Waki Packages.",
      },
      { property: "og:title", content: "Terms and Conditions | Waki Packages" },
      { property: "og:description", content: "The rules for orders, payment and delivery." },
    ],
  }),
  component: Terms,
});

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Customer accounts",
    body: [
      "You need an account to place orders, book training and track deliveries.",
      "Give correct details, keep your password private, and tell us if someone else uses your account.",
      "You are responsible for everything done through your account.",
    ],
  },
  {
    title: "2. Product orders",
    body: [
      "An order is created once you complete checkout. We will confirm the items and the amount before delivery.",
      "If an item is out of stock we will contact you to change the order or arrange a refund.",
    ],
  },
  {
    title: "3. Product pricing",
    body: [
      "All prices are in Kenya Shillings and include the sizes and quantities shown on the Pricing page.",
      "Prices may change. The price shown when you place your order is the price that applies to that order.",
    ],
  },
  {
    title: "4. Payment verification",
    body: [
      "Payment is made through M-Pesa. After paying, enter your M-Pesa transaction code on your order.",
      "Your order is marked Paid only after we confirm the code against the payment we received.",
      "If a code cannot be confirmed, we will contact you and the order stays unpaid.",
    ],
  },
  {
    title: "5. M-Pesa transaction codes",
    body: [
      "Enter the code exactly as it appears in your M-Pesa message.",
      "Sharing a false or already used code may lead to your order being cancelled and your account suspended.",
    ],
  },
  {
    title: "6. Delivery",
    body: [
      "Delivery within Kiria-ini Town is FREE.",
      "Outside Kiria-ini Town, a delivery fee applies depending on your location. The fee is shown before you pay.",
      "Give a clear delivery location and a phone number that can be reached.",
    ],
  },
  {
    title: "7. Order cancellation",
    body: [
      "You may cancel an order before payment is verified.",
      "After an order is being processed or is out for delivery, cancellation is only possible by agreement with us.",
    ],
  },
  {
    title: "8. Returns and refunds",
    body: [
      "If goods are damaged or wrong, tell us within 24 hours of delivery and we will replace them or refund you.",
      "Refunds are sent to the M-Pesa number used for payment.",
    ],
  },
  {
    title: "9. Training bookings",
    body: [
      "The training fee is KSh 15,000.",
      "A booking is confirmed after we contact you and agree on the date.",
      "Dates can be moved by agreement. Please tell us early if you cannot attend.",
    ],
  },
  {
    title: "10. Customer responsibilities",
    body: [
      "Give correct order, payment and delivery information.",
      "Be available to receive your goods at the agreed time and place.",
      "Use this website lawfully and do not try to access other customers' information.",
    ],
  },
  {
    title: "11. Business responsibilities",
    body: [
      "We will supply the goods you ordered in good condition.",
      "We will keep your personal details safe and use them only for your orders, deliveries and training.",
      "We will communicate clearly about payment, delivery and any delays.",
    ],
  },
  {
    title: "12. Changes to these terms",
    body: [
      "We may update these terms from time to time. The updated terms apply to orders placed after the change.",
    ],
  },
];

function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl">Terms and Conditions</h1>
      <p className="mt-2 text-muted-foreground">
        These terms explain how buying from {BUSINESS.name} works.
      </p>

      <div className="mt-8 space-y-7">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-xl">{section.title}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              {section.body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}

        <section>
          <h2 className="font-display text-xl">13. Copyright</h2>
          <p className="mt-2 text-muted-foreground">
            All website content, business information, product descriptions, images created for{" "}
            {BUSINESS.name}, branding and website design are the property of {BUSINESS.name} unless
            otherwise stated. © 2026 {BUSINESS.name}. All Rights Reserved.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">14. Contact</h2>
          <p className="mt-2 text-muted-foreground">
            {BUSINESS.location} · {BUSINESS.phone} · {BUSINESS.days}, {BUSINESS.hours}
          </p>
        </section>
      </div>
    </div>
  );
}
