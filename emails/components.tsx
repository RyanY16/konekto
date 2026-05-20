// Shared design tokens and layout components for Konekto emails

export const colors = {
  purple: "#7C3AED",
  purpleLight: "#9F67F5",
  blue: "#3B82F6",
  blueLight: "#60A5FA",
  bg: "#F3F4F8",
  card: "#FFFFFF",
  text: "#1A1A2E",
  muted: "#6B7280",
  border: "#E5E7EB",
  success: "#10B981",
};

// Gradient as a table-based header (email-safe)
export const gradientBg = "linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #3B82F6 100%)";

export const fonts = {
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, Oxygen, Ubuntu, sans-serif",
};

export function chip(text: string, color = colors.purple) {
  return `<span style="display:inline-block;background:${color}18;color:${color};font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;letter-spacing:0.02em;">${text}</span>`;
}
