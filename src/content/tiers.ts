// Comfort level card (the tiers themselves live in PostgreSQL, see src/server/services/content.service.ts)
export type Tier = {
  eyebrow: string;
  name: string;
  tag: string;
  price: string;
  highlighted: boolean;
  features: string[];
};

// Notes under the pricing cards
export const pricingNotes = ["Fixed Pricing", "No Hidden Fees", "Free Cancellation", "24/7 Support"];
