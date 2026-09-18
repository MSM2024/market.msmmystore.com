import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        msm: {
          ink: "#14171A",
          midnight: "#07111E",
          navy: "#0C3F6A",
          blue: "#197BD2",
          electric: "#35A8FF",
          ice: "#EAF6FF",
          gray: "#657786",
          cloud: "#F7F9FB",
          line: "#E6E7E8",
          silver: "#D7E5F2"
        }
      },
      boxShadow: {
        soft: "0 18px 50px rgba(12, 63, 106, 0.08)",
        glow: "0 22px 70px rgba(25, 123, 210, 0.28)",
        lift: "0 20px 40px rgba(7, 17, 30, 0.12)"
      }
    }
  },
  plugins: []
} satisfies Config;
