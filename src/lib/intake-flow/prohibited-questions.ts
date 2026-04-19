export type ProhibitedQuestion = {
  id: string;
  label: string;
  emoji: string;
  prompt: string;
  blockMessage: string;
  alternatives: string;
};

/** Section 3 — universal prohibited items */
export const PROHIBITED_QUESTIONS: ProhibitedQuestion[] = [
  {
    id: "p1",
    label: "Mattresses & bedding",
    emoji: "🛏️",
    prompt: "Are you bringing any mattresses, box springs, bed rails, air mattresses, mattress toppers, or sleeping pillows?",
    blockMessage: "These cannot be accepted.",
    alternatives: "Mattress Disposal Plus or Mattress Warehouse (fee) for proper disposal.",
  },
  {
    id: "p2",
    label: "Large appliances",
    emoji: "🧺",
    prompt: "Are you bringing any large household appliances? (refrigerator, freezer, stove, oven, washing machine, dryer, dishwasher, hot water heater)",
    blockMessage: "Large appliances cannot be accepted.",
    alternatives: "Check your local government bulk pickup schedule or search for appliance recyclers near you.",
  },
  {
    id: "p3",
    label: "Building materials",
    emoji: "🧱",
    prompt: "Are you bringing any building materials? (lumber, bricks, concrete, windows, doors, sinks, tubs, toilets, plumbing fixtures)",
    blockMessage: "Building materials cannot be accepted.",
    alternatives: "Habitat for Humanity ReStore accepts many building materials.",
  },
  {
    id: "p4",
    label: "Hazardous materials",
    emoji: "☣️",
    prompt: "Are you bringing any hazardous materials? (paint, gasoline, pesticides, cleaning chemicals, propane tanks, motor oil)",
    blockMessage: "Hazardous materials cannot be accepted.",
    alternatives: "Use EPA's recycling locator at epa.gov or attend a local hazardous waste collection day.",
  },
  {
    id: "p5",
    label: "Firearms & fireworks",
    emoji: "🔫",
    prompt: "Are you bringing any firearms, ammunition, or fireworks?",
    blockMessage: "These cannot be donated.",
    alternatives: "Surrender firearms to your local police non-emergency line. Fireworks: local fire department or hazardous waste program.",
  },
  {
    id: "p6",
    label: "Auto parts",
    emoji: "🚗",
    prompt: "Are you bringing any auto parts? (tires, car batteries, motor oil, wiper fluid, car chemicals)",
    blockMessage: "Auto parts cannot be accepted.",
    alternatives: "AutoZone accepts car batteries. Tire retailers accept used tires. Used oil: auto parts stores for recycling.",
  },
  {
    id: "p7",
    label: "Medical equipment",
    emoji: "🩺",
    prompt: "Are you bringing any medical equipment or supplies? (crutches, wheelchairs, hospital beds, medical devices, prescription medications)",
    blockMessage: "Medical equipment cannot be accepted.",
    alternatives: "Medical loan closets, churches, or community health organizations may accept durable medical equipment.",
  },
  {
    id: "p8",
    label: "Food & beverages",
    emoji: "🍱",
    prompt: "Are you bringing any food, beverages, or perishables?",
    blockMessage: "Food and beverages cannot be accepted.",
    alternatives: "Donate unexpired food to your local food bank.",
  },
  {
    id: "p9",
    label: "Cosmetics & personal care",
    emoji: "💄",
    prompt: "Are you bringing any used cosmetics, opened personal care products, or hair care items?",
    blockMessage: "Used cosmetics and opened personal care products cannot be accepted.",
    alternatives: "Dispose of at home.",
  },
  {
    id: "p10",
    label: "Rags & textile scraps",
    emoji: "🧻",
    prompt: "Are you bringing any rags? (textile scraps, cut fabric, torn clothing cut into pieces)",
    blockMessage: "Rags cannot be accepted.",
    alternatives: "Send textile scraps to textile recycling services directly.",
  },
  {
    id: "p11",
    label: "Wet or moldy items",
    emoji: "💧",
    prompt: "Are you bringing any items that are currently wet, damp, mildewed, or moldy?",
    blockMessage: "Wet, mildewed, or moldy items cannot be accepted and are a health hazard for staff.",
    alternatives: "Dispose of at home — do not donate.",
  },
];
