export type SapphireCut = "Oval" | "Cushion" | "Round" | "Emerald" | "Pear" | "Marquise" | "Heart"

export type SapphireColor =
  | "Cornflower Blue"
  | "Royal Blue"
  | "Deep Indigo"
  | "Padparadscha"
  | "Canary Yellow"
  | "Vivid Pink"
  | "Peacock Teal"
  | "Star Sapphire"

export type SapphireClarity = "IF" | "VVS1" | "VVS2" | "VS1" | "VS2" | "SI1"

export type SapphireOrigin = "Kashmir" | "Ceylon (Sri Lanka)" | "Burma (Myanmar)" | "Madagascar" | "Montana (USA)"

export interface GemLabConfig {
  cut: SapphireCut
  color: SapphireColor
  clarity: SapphireClarity
  carat: number
  origin: SapphireOrigin
  treated: boolean
  angle: number
  refraction: number
}

export interface ChatMessage {
  role: "user" | "model"
  text: string
  timestamp: string
}

export interface FamousSapphire {
  id: string
  name: string
  weight: string
  origin: string
  cut: string
  color: string
  story: string
  yearFound: string
  location: string
  imageAlt: string
}
