export const PRODUCT_NAMES = [
  "AirPods Pro",
  "MacBook Pro 14\"",
  "Kindle Paperwhite",
  "Mechanical Keyboard",
  "4K Monitor",
  "Wireless Mouse",
  "Noise Cancelling Headphones",
  "Portable SSD 1TB",
  "Smart Watch",
  "USB-C Hub",
  "Standing Desk",
  "Ergonomic Chair",
  "Bluetooth Speaker",
  "Webcam 1080p",
  "Graphics Tablet",
  "Espresso Machine",
  "Air Fryer",
  "Robot Vacuum",
  "Electric Kettle",
  "Desk Lamp",
] as const;

export const CATEGORIES = ["Electronics", "Home", "Office", "Audio", "Kitchen"] as const;

export const FIRST_NAMES = [
  "Sarah",
  "Alex",
  "Maria",
  "James",
  "Priya",
  "Noah",
  "Yuki",
  "Omar",
  "Elena",
  "Liam",
  "Fatima",
  "Daniel",
  "Chen",
  "Olivia",
  "Marcus",
  "Ana",
] as const;

export const LAST_NAMES = [
  "Cohen",
  "Johnson",
  "Garcia",
  "Patel",
  "Kim",
  "Novak",
  "Rossi",
  "Müller",
  "Nakamura",
  "Silva",
  "Brown",
  "Ivanov",
  "Adebayo",
  "Dubois",
] as const;

export const ROLES = ["Admin", "Editor", "Viewer", "Owner", "Support"] as const;

export const STATUSES = ["In Stock", "Sold Out", "Low Stock", "Preorder"] as const;

export function emailFor(first: string, last: string): string {
  return `${first.toLowerCase()}.${last.toLowerCase()}@example.com`;
}

export function priceFor(rng: { int: (a: number, b: number) => number }): string {
  const dollars = rng.int(9, 899);
  const cents = rng.int(0, 1) === 0 ? "99" : "00";
  return `$${dollars}.${cents}`;
}
