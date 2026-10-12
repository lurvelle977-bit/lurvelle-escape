// Comfort level card
export type Tier = {
  eyebrow: string;
  name: string;
  tag: string;
  price: string;
  highlighted: boolean;
  features: string[];
};

// Comfort levels
export const tiers: Tier[] = [
  {
    eyebrow: "Essential",
    name: "Budget",
    tag: "Comfort without compromise",
    price: "€40",
    highlighted: false,
    features: ["Private car & driver", "Comfortable vehicle", "Bottled water", "Ideal for short trips"],
  },
  {
    eyebrow: "Signature",
    name: "Premium",
    tag: "Executive comfort & style",
    price: "€70",
    highlighted: true,
    features: ["Executive vehicles", "Professional driver", "Premium amenities", "Extra comfort & space"],
  },
  {
    eyebrow: "Reserve",
    name: "Premium Plus",
    tag: "The ultimate Lisbon experience",
    price: "€120",
    highlighted: false,
    features: ["Luxury vehicles", "Top class experience", "VIP amenities", "Tailor-made service"],
  },
];

// Notes under the pricing cards
export const pricingNotes = ["Fixed Pricing", "No Hidden Fees", "Free Cancellation", "24/7 Support"];
