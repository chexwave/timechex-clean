// TimeChex mock data — client-only, no real customer info
// Punch ID format: food+animal+MMDD (e.g. nachoparrot1031)

export const LABOR_RATES = {
  Tech: 125,
  Bench: 100,
  "Sea Trial": 150,
  Travel: 2.5 // per one-way mile
};

export const MOCK_CUSTOMERS = [
  { id: "c1", name: "Rivera", boat: "Scout 185", motor: "Yamaha F115", phone: "410-555-0101" },
  { id: "c2", name: "Hale", boat: "Sea Ray", motor: "Mercruiser 4.3L", phone: "410-555-0102" },
  { id: "c3", name: "Carter", boat: "Pathfinder", motor: "Yamaha 300", phone: "410-555-0103" },
  { id: "c4", name: "Brooks", boat: "Whaler", motor: "Mercury 115", phone: "410-555-0104" }
];

export const MOCK_JOBS = [
  { id: "j1", number: "WO-1001", customerId: "c1", work: "Winterize", status: "Needs Scheduled" },
  { id: "j2", number: "WO-1002", customerId: "c2", work: "Service", status: "Active" },
  { id: "j3", number: "WO-1003", customerId: "c3", work: "Sea Trial", status: "Needs Parts" }
];

export const MOCK_PARTS = [
  { sku: "LOM-20506", brand: "LiquiMoly", name: "Marine 4T 10W-40", size: "1L", price: 13.99 },
  { sku: "YAM-OIL", brand: "Yamaha", name: "Yamaha 10W-40", size: "Quart", price: 14.99 },
  { sku: "FILTER-1", brand: "Generic", name: "Oil Filter", size: "1", price: 12.50 }
];

export const SAMPLE_PUNCHES = [
  {
    id: "nachoparrot1126",
    iso: "2026-11-26",
    time: "09:15",
    type: "Start Job",
    wo: "WO-1001",
    customer: "Rivera",
    attached: true
  },
  {
    id: "tacoDeer1126",
    iso: "2026-11-26",
    time: "12:00",
    type: "Start Break",
    wo: "WO-1001",
    customer: "Rivera",
    attached: true
  }
];

export function generatePunchId(date = new Date()) {
  const foods = ["nacho", "taco", "pizza", "burger", "sushi"];
  const animals = ["parrot", "deer", "otter", "fox", "bear"];
  const food = foods[Math.floor(Math.random() * foods.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return food + animal + mm + dd;
}
