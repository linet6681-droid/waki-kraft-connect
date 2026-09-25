import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing | Waki Packages" },
      {
        name: "description",
        content:
          "Waki Packages price list: packaging bags from KSh 60 per 50 pieces, book covers, envelopes, cake boxes, popcorn bags, charcoal briquettes and gift bags.",
      },
      { property: "og:title", content: "Pricing | Waki Packages" },
      { property: "og:description", content: "Clear, affordable paper packaging prices." },
    ],
  }),
  component: Pricing,
});

type Row = { a: string; b: string; c?: string };

function PriceTable({
  title,
  note,
  headers,
  rows,
}: {
  title: string;
  note?: string;
  headers: string[];
  rows: Row[];
}) {
  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-display text-xl">{title}</h2>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.a + r.b}>
              <TableCell className="font-medium">{r.a}</TableCell>
              <TableCell>{r.b}</TableCell>
              {r.c !== undefined && <TableCell>{r.c}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

function Pricing() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl">Pricing</h1>
      <p className="mt-2 text-muted-foreground">
        All prices are in Kenya Shillings. Free delivery within Kiria-ini Town.
      </p>

      <div className="mt-8 space-y-6">
        <PriceTable
          title="Packaging Bags"
          note="Prices are per 50 pieces"
          headers={["Size", "Price"]}
          rows={[
            { a: "No. 6", b: "KSh 250" },
            { a: "No. 5", b: "KSh 150" },
            { a: "No. 4", b: "KSh 130" },
            { a: "No. 3", b: "KSh 110" },
            { a: "No. 2", b: "KSh 100" },
            { a: "No. 1", b: "KSh 80" },
            { a: "1/2", b: "KSh 70" },
            { a: "1/4", b: "KSh 60" },
          ]}
        />

        <PriceTable
          title="Book Covers"
          note="Branded or unbranded"
          headers={["Size", "Price"]}
          rows={[
            { a: "A4", b: "KSh 20 each" },
            { a: "A5", b: "KSh 10 each" },
          ]}
        />

        <PriceTable
          title="Envelopes"
          headers={["Size", "Quantity", "Price"]}
          rows={[
            { a: "A4", b: "50 pieces", c: "KSh 70" },
            { a: "A5", b: "50 pieces", c: "KSh 50" },
          ]}
        />

        <PriceTable
          title="Cake Boxes"
          headers={["Item", "Price"]}
          rows={[{ a: "Cake Boxes", b: "KSh 30 each" }]}
        />

        <PriceTable
          title="Popcorn Bags"
          headers={["Size", "Quantity", "Price"]}
          rows={[
            { a: "1 kg", b: "50 pieces", c: "KSh 90" },
            { a: "1/2 kg", b: "50 pieces", c: "KSh 70" },
            { a: "1/4 kg", b: "50 pieces", c: "KSh 60" },
          ]}
        />

        <PriceTable
          title="Charcoal Briquettes"
          headers={["Item", "Price"]}
          rows={[{ a: "Charcoal Briquettes", b: "KSh 150 per kg" }]}
        />

        <PriceTable
          title="Gift Bags"
          headers={["Size", "Price"]}
          rows={[
            { a: "Small", b: "KSh 50 each" },
            { a: "Medium", b: "KSh 100 each" },
            { a: "Large", b: "KSh 150 each" },
          ]}
        />

        <section className="surface-card p-5">
          <h2 className="font-display text-xl">Training Fee</h2>
          <p className="mt-1 text-2xl font-semibold text-primary">KSh 15,000</p>
          <Button asChild className="mt-4 h-11">
            <Link to="/training">Book learning classes</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
