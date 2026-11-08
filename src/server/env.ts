// Central, validated access to server-only environment variables.

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export const env = {
  get databaseUrl() {
    const value = read("DATABASE_URL");
    if (!value) throw new Error("DATABASE_URL is not set");
    return value;
  },
  get databaseSsl() {
    return read("DATABASE_SSL") === "true";
  },
  get sessionSecret() {
    const value = read("SESSION_SECRET");
    if (!value || value.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters");
    return value;
  },
  // Max booking submissions per IP per 10 minutes
  get bookingRateLimit() {
    return Number(read("BOOKING_RATE_LIMIT")) || 10;
  },
  get siteUrl() {
    return (read("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(/\/$/, "");
  },
  email: {
    get apiKey() {
      return read("RESEND_API_KEY");
    },
    get from() {
      return read("EMAIL_FROM");
    },
    get adminRecipients() {
      return (read("ADMIN_NOTIFY_EMAIL") ?? "").split(",").map((entry) => entry.trim()).filter(Boolean);
    },
  },
  whatsapp: {
    get token() {
      return read("WHATSAPP_TOKEN");
    },
    get phoneNumberId() {
      return read("WHATSAPP_PHONE_NUMBER_ID");
    },
    get adminNumber() {
      return read("WHATSAPP_ADMIN_NUMBER");
    },
    get language() {
      return read("WHATSAPP_TEMPLATE_LANG") ?? "en";
    },
    template(key: "NEW_BOOKING" | "QUOTATION" | "PAYMENT" | "CONFIRMED") {
      return read(`WHATSAPP_TEMPLATE_${key}`);
    },
  },
};
