// Plain-language status text shown to customers (internal statuses are never shown as raw codes)
export const customerStatus: Record<string, { label: string; message: string }> = {
  PENDING: { label: "Awaiting review", message: "We have your request and will review it shortly." },
  UNDER_REVIEW: { label: "Under review", message: "Our team is checking availability for your trip." },
  ALTERNATIVE_PROPOSED: { label: "Alternative suggested", message: "We have suggested an alternative — please check your email or WhatsApp." },
  QUOTED: { label: "Quotation ready", message: "Your quotation is ready. Please review it below." },
  QUOTE_ACCEPTED: { label: "Quotation accepted", message: "Thank you. We will send you the payment instructions shortly." },
  QUOTE_REJECTED: { label: "Quotation declined", message: "The quotation was declined." },
  PAYMENT_PENDING: { label: "Payment pending", message: "Please complete your payment using the instructions below." },
  PAYMENT_RECEIVED: { label: "Payment received", message: "We received your payment and are finalising your booking." },
  CONFIRMED: { label: "Confirmed", message: "Your booking is confirmed." },
  SCHEDULED: { label: "Confirmed and scheduled", message: "Your trip is confirmed and scheduled." },
  CANCELLED: { label: "Cancelled", message: "This request was cancelled." },
  COMPLETED: { label: "Completed", message: "This trip is complete. Thank you for travelling with us." },
};
