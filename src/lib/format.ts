// সব তারিখ আন্তর্জাতিক ধরনে দেখানো হয়: "20 Nov 2026"
// Backend-এর তারিখ-filter যে timezone-এ চলে (Asia/Dhaka), এখানেও সেটাই, যাতে দুটো মিলে যায়
const DISPLAY_TIMEZONE = "Asia/Dhaka";

// সময়সহ তারিখ (যেমন createdAt) থেকে শুধু দিন
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: DISPLAY_TIMEZONE,
  });
}

// শুধু দিন হিসেবে রাখা তারিখ (যেমন visitDate, UTC মধ্যরাতে রাখা) - timezone বদলালে যেন দিন সরে না যায়
export function formatDateOnly(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
