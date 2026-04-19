export type ProhibitedQuestion = {
  id: string;
  prompt: string;
  blockMessage: string;
  alternatives: string;
};

/** Section 3 — universal prohibited items (P1–P11) */
export const PROHIBITED_QUESTIONS: ProhibitedQuestion[] = [
  {
    id: "p1",
    prompt:
      "Are you bringing any mattresses, box springs, bed rails, air mattresses, mattress toppers, or sleeping pillows?",
    blockMessage: "These cannot be accepted.",
    alternatives: "Mattress Disposal Plus or Mattress Warehouse (fee) for proper disposal.",
  },
  {
    id: "p2",
    prompt:
      "Are you bringing any large household appliances? (refrigerator, freezer, stove, oven, washing machine, dryer, dishwasher, hot water heater, trash compactor)",
    blockMessage: "Large appliances cannot be accepted.",
    alternatives: "Check your local government bulk pickup schedule or search for appliance recyclers near you.",
  },
  {
    id: "p3",
    prompt:
      "Are you bringing any building materials? (lumber, bricks, concrete, windows, doors, gutters, sinks, tubs, toilets, plumbing fixtures, window blinds)",
    blockMessage: "Building materials cannot be accepted.",
    alternatives: "Habitat for Humanity ReStore accepts many building materials.",
  },
  {
    id: "p4",
    prompt:
      "Are you bringing any hazardous materials? (paint, gasoline, pesticides, cleaning chemicals, propane tanks, motor oil, antifreeze, solvents)",
    blockMessage: "Hazardous materials cannot be accepted.",
    alternatives: "Use EPA’s recycling locator at epa.gov or attend a local hazardous waste collection day.",
  },
  {
    id: "p5",
    prompt: "Are you bringing any firearms, ammunition, or fireworks?",
    blockMessage: "These cannot be donated.",
    alternatives:
      "Surrender firearms to your local police non-emergency line. Fireworks: local fire department or hazardous waste program.",
  },
  {
    id: "p6",
    prompt: "Are you bringing any auto parts? (tires, car batteries, motor oil, wiper fluid, car chemicals)",
    blockMessage: "Auto parts cannot be accepted.",
    alternatives:
      "AutoZone accepts car batteries (often with gift card). Tire retailers accept used tires. Used oil: auto parts stores for recycling.",
  },
  {
    id: "p7",
    prompt:
      "Are you bringing any medical equipment or supplies? (crutches, wheelchairs, hospital beds, portable toilets, medical devices, prescription medications)",
    blockMessage: "Medical equipment cannot be accepted.",
    alternatives: "Medical loan closets, churches, or community health organizations may accept durable medical equipment.",
  },
  {
    id: "p8",
    prompt: "Are you bringing any food, beverages, or perishables?",
    blockMessage: "Food and beverages cannot be accepted.",
    alternatives: "Donate unexpired food to your local food bank.",
  },
  {
    id: "p9",
    prompt: "Are you bringing any used cosmetics, opened personal care products, or hair care items?",
    blockMessage: "Used cosmetics and opened personal care products cannot be accepted.",
    alternatives: "Dispose of at home.",
  },
  {
    id: "p10",
    prompt: "Are you bringing any rags? (clean or dirty textile scraps, cut fabric, torn clothing cut into pieces)",
    blockMessage: "Rags cannot be accepted.",
    alternatives: "Send textile scraps to textile recycling services directly.",
  },
  {
    id: "p11",
    prompt: "Are you bringing any items that are currently wet, damp, mildewed, or moldy?",
    blockMessage: "Wet, mildewed, or moldy items cannot be accepted and are a health hazard for staff.",
    alternatives: "Dispose of at home — do not donate.",
  },
];
