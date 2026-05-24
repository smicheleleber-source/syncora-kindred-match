import { Star } from "lucide-react";
import type { Provider } from "@/lib/providers";

interface Review {
  author: string;
  role: string;
  rating: number; // 1-5
  date: string;
  body: string;
}

// Deterministic mock reviews seeded by provider id so each profile is stable.
function mockReviewsFor(provider: Provider): Review[] {
  const seeds: Review[][] = [
    [
      {
        author: "Maria L.",
        role: "Client",
        rating: 5,
        date: "2 weeks ago",
        body: "Responsive, transparent on fees, and resolved my matter faster than I expected.",
      },
      {
        author: "James P.",
        role: "Client",
        rating: 4,
        date: "1 month ago",
        body: "Clear communication throughout. Would work with again.",
      },
      {
        author: "Priya R.",
        role: "Referring attorney",
        rating: 5,
        date: "3 months ago",
        body: "Solid subject-matter expertise and easy to coordinate handoffs with.",
      },
    ],
    [
      {
        author: "Daniel K.",
        role: "Client",
        rating: 5,
        date: "5 days ago",
        body: "Took the time to explain options instead of pushing the most expensive route.",
      },
      {
        author: "Sofia M.",
        role: "Client",
        rating: 4,
        date: "6 weeks ago",
        body: "Professional and prepared. One scheduling hiccup, otherwise excellent.",
      },
    ],
    [
      {
        author: "Renee T.",
        role: "Client",
        rating: 5,
        date: "1 week ago",
        body: "Felt heard from the first call. Outcome exceeded what I'd hoped for.",
      },
      {
        author: "Ahmed S.",
        role: "Client",
        rating: 5,
        date: "2 months ago",
        body: "Honest about what was and wasn't worth pursuing. Saved me time and money.",
      },
      {
        author: "Linda O.",
        role: "Client",
        rating: 4,
        date: "4 months ago",
        body: "Knowledgeable and patient with questions.",
      },
    ],
  ];
  const hash = provider.id
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return seeds[hash % seeds.length];
}

export function ProviderReviews({
  provider,
  className = "",
}: {
  provider: Provider;
  className?: string;
}) {
  const reviews = mockReviewsFor(provider);
  const avg =
    reviews.reduce((s, r) => s + r.rating, 0) / Math.max(reviews.length, 1);

  return (
    <section
      className={`rounded-2xl border border-border bg-card p-6 ${className}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Client reviews</h2>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center" aria-hidden>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={
                  "h-4 w-4 " +
                  (n <= Math.round(avg)
                    ? "fill-amber-500 text-amber-500"
                    : "text-muted-foreground/40")
                }
              />
            ))}
          </div>
          <span className="tabular-nums font-medium">{avg.toFixed(1)}</span>
          <span className="text-muted-foreground">
            ({reviews.length} review{reviews.length === 1 ? "" : "s"})
          </span>
        </div>
      </div>

      <ul className="mt-5 space-y-4">
        {reviews.map((r, i) => (
          <li
            key={i}
            className="rounded-xl border border-border bg-background p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{r.author}</div>
                <div className="text-xs text-muted-foreground">{r.role}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center" aria-label={`${r.rating} stars`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={
                        "h-3.5 w-3.5 " +
                        (n <= r.rating
                          ? "fill-amber-500 text-amber-500"
                          : "text-muted-foreground/30")
                      }
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{r.date}</span>
              </div>
            </div>
            <p className="mt-2 text-sm leading-relaxed">{r.body}</p>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-muted-foreground">
        Reviews are collected from verified clients after a matched engagement closes.
      </p>
    </section>
  );
}