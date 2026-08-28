import type { DisasterEvent } from "../types/disaster";

export const demoDisasters: DisasterEvent[] = [
  {
    id: "DIS-0001",
    name: "Typhoon Ineng",
    eventType: "typhoon",
    startDate: "2026-08-20",
    endDate: "2026-08-26",
    affectedProvinces: ["Cagayan", "Isabela", "Ilocos Norte"],
    description:
      "Strong typhoon that crossed Northern Luzon, bringing heavy rainfall and sustained winds across Cagayan Valley and the Ilocos Region.",
  },
  {
    id: "DIS-0002",
    name: "Southwest Monsoon Flooding",
    eventType: "flood",
    startDate: "2026-08-22",
    endDate: "2026-08-25",
    affectedProvinces: ["Pampanga", "Bulacan", "Nueva Ecija"],
    description:
      "Enhanced southwest monsoon rains caused river overflow and prolonged flooding across low lying farmland in Central Luzon.",
  },
  {
    id: "DIS-0003",
    name: "Isabela Dry Spell",
    eventType: "drought",
    startDate: "2026-07-15",
    endDate: "2026-08-20",
    affectedProvinces: ["Isabela", "Nueva Ecija"],
    description:
      "Extended period of below average rainfall leading to persistent vegetation stress in corn and rice producing areas.",
  },
];
