export const siteConfig = {
  name: "NexBand",
  tagline: "AI-powered exam prep for students going abroad",
  description:
    "Practice IELTS speaking, writing, reading, and listening with instant AI feedback and band scores. Built for international students.",
  url: "https://nexband.app",
  links: {
    signIn: "/auth/signin",
    dashboard: "/dashboard",
    getStarted: "/auth/signin",
  },
  nav: [
    { label: "Features", href: "#features" },
    { label: "Exams", href: "#exams" },
    { label: "How it works", href: "#how-it-works" },
  ],
  exams: [
    {
      id: "ielts",
      name: "IELTS",
      status: "available" as const,
      description: "Speaking, Writing, Reading & Listening",
    },
    {
      id: "toefl",
      name: "TOEFL",
      status: "coming_soon" as const,
      description: "Coming soon",
    },
    {
      id: "gre",
      name: "GRE",
      status: "coming_soon" as const,
      description: "Coming soon",
    },
    {
      id: "german",
      name: "German",
      status: "coming_soon" as const,
      description: "Coming soon",
    },
    {
      id: "french",
      name: "French",
      status: "coming_soon" as const,
      description: "Coming soon",
    },
  ],
};
