import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  username: z.string().trim().min(1).max(39).regex(/^[a-z\d-]+$/i),
  headline: z.string().trim().min(1).max(120),
  bio: z.string().trim().max(500).default(""),
  location: z.string().trim().max(100).default(""),
  email: z.string().trim().max(120).default(""),
  website: z.string().trim().max(200).default(""),
  company: z.string().trim().max(120).default(""),
  linkedin: z.string().trim().max(200).default(""),
  instagram: z.string().trim().max(200).default(""),
  twitter: z.string().trim().max(200).default(""),
  github: z.string().trim().max(200).default(""),
  skills: z.array(z.string().trim().min(1).max(32)).max(16),
  projects: z.array(z.object({
    name: z.string().trim().min(1).max(80),
    description: z.string().trim().max(240),
    stack: z.string().trim().max(120),
    url: z.string().trim().max(200),
    demo: z.string().trim().max(200).default(""),
    stars: z.number().int().nonnegative().default(0),
  })).max(6),
  githubStats: z.object({
    followers: z.number().int().nonnegative().default(0),
    following: z.number().int().nonnegative().default(0),
    publicRepos: z.number().int().nonnegative().default(0),
    stars: z.number().int().nonnegative().default(0),
    forks: z.number().int().nonnegative().default(0),
    contributions: z.number().int().nonnegative().nullable().default(null),
    contributionYear: z.number().int().default(new Date().getFullYear()),
    contributionWeeks: z.array(z.array(z.number().int().nonnegative()).max(7)).max(53).default([]),
    languages: z.array(z.string().trim().min(1).max(32)).max(16).default([]),
  }).default({}),
  style: z.enum(["dark", "cyberpunk", "futuristic", "luxury", "anime", "gaming", "minimal"]),
  persona: z.enum(["female", "male", "neutral"]),
  mood: z.enum(["aurora", "rose", "electric", "gold", "mono"]),
  animation: z.enum(["subtle", "medium", "bold"]),
  aesthetic: z.enum(["developer", "creative"]),
  repository: z.string().trim().min(1).max(100).regex(/^[a-z\d._-]+$/i),
  photo: z.string().max(5_500_000).default(""),
  originalReadme: z.string().max(12_000).default(""),
});

export type Profile = z.infer<typeof profileSchema>;

export const palettes: Record<Profile["persona"], Record<Profile["mood"], { accent: string; second: string; glow: string }>> = {
  female: {
    aurora: { accent: "#f48cbe", second: "#8de5dc", glow: "#ec76b5" },
    rose: { accent: "#ff8fbc", second: "#bd9cff", glow: "#f05d9f" },
    electric: { accent: "#7de5ff", second: "#da8dff", glow: "#9c83ff" },
    gold: { accent: "#f1d18b", second: "#f49eae", glow: "#d8a84e" },
    mono: { accent: "#dce3ec", second: "#9eaabd", glow: "#8794aa" },
  },
  male: {
    aurora: { accent: "#64d8e8", second: "#8b9cff", glow: "#4cb4e5" },
    rose: { accent: "#7de2e8", second: "#85a7ff", glow: "#4d9cce" },
    electric: { accent: "#68e0ff", second: "#9389ff", glow: "#367dff" },
    gold: { accent: "#e6c875", second: "#84c6d8", glow: "#bc8f45" },
    mono: { accent: "#dce3ec", second: "#9eaabd", glow: "#8794aa" },
  },
  neutral: {
    aurora: { accent: "#75d8d1", second: "#a5a0ff", glow: "#66b6d8" },
    rose: { accent: "#e99ccc", second: "#84d9dd", glow: "#ad7bd8" },
    electric: { accent: "#70dcf1", second: "#bb8eff", glow: "#718bff" },
    gold: { accent: "#eacb86", second: "#a6d5c3", glow: "#bd9950" },
    mono: { accent: "#dce3ec", second: "#9eaabd", glow: "#8794aa" },
  },
};

export function themeColors(profile: Pick<Profile, "persona" | "mood" | "style">) {
  const colors = palettes[profile.persona][profile.mood];
  const styleColors: Partial<Record<Profile["style"], [string, string, string]>> = {
    cyberpunk: ["#6be3ee", "#ea78bf", "#59b5d8"],
    futuristic: ["#80cfe2", "#9d9cf1", "#5a9fc5"],
    luxury: ["#e4c987", "#dca9b9", "#bd9956"],
    anime: ["#ed91bd", "#a79aff", "#d56cb4"],
    gaming: ["#7edcae", "#82b2f5", "#4cb995"],
    minimal: ["#d5e0e3", "#a2d0c8", "#899fa2"],
  };
  const [accent, second, glow] = styleColors[profile.style] ?? [colors.accent, colors.second, colors.glow];
  if (profile.style === "dark") return colors;
  if (profile.persona === "female") return { accent: profile.style === "luxury" ? accent : colors.accent, second, glow };
  if (profile.persona === "male") return { accent, second: profile.style === "gaming" ? second : colors.second, glow };
  return { accent, second, glow };
}

export function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}

export function safeUrl(value: string) {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

export function markdownUrl(value: string) {
  return safeUrl(value).replace(/[()\\]/g, (character) => encodeURIComponent(character));
}

export function markdownText(value: string) {
  return value.replace(/[\\`*_{}\[\]()#+.!|>]/g, "\\$&").replace(/\r?\n/g, " ");
}

export function photoDataUri(value: string) {
  return /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) ? value : "";
}