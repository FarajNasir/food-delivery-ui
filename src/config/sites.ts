export type SiteKey = "downpatrickeats" | "newcastleeats" | "kilkeeleats";

export interface ContactInfo {
  managerPhone: string;
  email: string;
  facebook: { label: string; handle: string };
  instagram: { label: string; handle: string };
  notice: string;
}

export interface SiteConfig {
  key: SiteKey;
  name: string;
  tagline: string;
  description: string;
  location: string;
  hero: {
    headline: string;
    subheadline: string;
  };
  theme: {
    gradientFrom: string;
    gradientVia: string;
    gradientTo: string;
    primary: string;
    accent: string;
    badge: string;
  };
  stats: {
    restaurants: string;
    deliveries: string;
    rating: string;
    minutes: string;
  };
  contact: ContactInfo;
  coordinates?: { lat: number; lng: number };
  serviceCharge?: number;
  deliveryPricing?: {
    type: "fixed_areas" | "distance_slabs" | "standard";
    rules: any;
    mobileChefRules?: any;
  };
}

export const SITES: Record<SiteKey, SiteConfig> = {
  newcastleeats: {
    key: "newcastleeats",
    name: "Newcastle Eats",
    tagline: "Food Delivery Service",
    description:
      "Your favourite restaurants in Newcastle delivered fast to your door.",
    location: "Newcastle",
    hero: {
      headline: "Hungry? We've Got Newcastle Covered.",
      subheadline:
        "Order from the best local restaurants and get hot food delivered straight to your door in minutes.",
    },
    theme: {
      gradientFrom: "#1B4332",
      gradientVia: "#2D6A4F",
      gradientTo: "#52B788",
      primary: "#2D6A4F",
      accent: "#52B788",
      badge: "bg-green-700",
    },
    stats: {
      restaurants: "35+",
      deliveries: "6K+",
      rating: "4.7",
      minutes: "28",
    },
    contact: {
      managerPhone: "",
      email: "hello@yourlocaleats.app",
      facebook: { label: "Newcastle Eats Delivery", handle: "Newcastle Eats" },
      instagram: { label: "newcastleeats__", handle: "newcastleeats__" },
      notice:
        "If you have any problems with your order, please contact the food outlet you ordered from and they will arrange for a driver to re-deliver any missing items. Alternatively, if you can't get through, please message our Facebook page 'Newcastle Eats' for assistance. Our support team is available via Messenger.",
    },
    coordinates: { lat: 54.2104, lng: -5.8916 },
    serviceCharge: 0.99,
    deliveryPricing: {
      type: "fixed_areas",
      rules: [
        { name: "Newcastle", fee: 5.0 },
        { name: "Bryansford / Maghera", fee: 6.0 },
        { name: "Dundrum / Castlewellan", fee: 8.0 },
        { name: "Annsborough", fee: 9.0 },
        { name: "Clough / Seaforde", fee: 10.0 },
        { name: "Annalong / Kilcoo / Leitrim", fee: 10.0 },
        { name: "Ballykilner", fee: 11.0 },
      ],
    },
  },
  kilkeeleats: {
    key: "kilkeeleats",
    name: "Kilkeel Eats",
    tagline: "Food Delivery Service",
    description:
      "Your favourite restaurants in Kilkeel delivered fast to your door.",
    location: "Kilkeel",
    hero: {
      headline: "Hungry? We've Got Kilkeel Covered.",
      subheadline:
        "Order from the best local restaurants and get hot food delivered straight to your door in minutes.",
    },
    theme: {
      gradientFrom: "#C0392B",
      gradientVia: "#E74C3C",
      gradientTo: "#F39C12",
      primary: "#E74C3C",
      accent: "#F39C12",
      badge: "bg-red-600",
    },
    stats: {
      restaurants: "30+",
      deliveries: "5K+",
      rating: "4.8",
      minutes: "30",
    },
    contact: {
      managerPhone: "",
      email: "hello@yourlocaleats.app",
      facebook: { label: "Kilkeel Eats Delivery", handle: "Kilkeel Eats Delivery" },
      instagram: { label: "kilkeel_eats", handle: "kilkeel_eats" },
      notice:
        "If you have any problems with your order, please contact the food outlet you ordered from and they will arrange for a driver to re-deliver any missing items. Alternatively, if you can't get through, please message our Facebook page 'Kilkeel Eats' for assistance. Our support team is available via Messenger.",
    },
    serviceCharge: 1.99,
    coordinates: { lat: 54.0628, lng: -5.9986 },
    deliveryPricing: {
      type: "distance_slabs",
      rules: [
        { maxMiles: 2, fee: 3.75 },
        { maxMiles: 4, fee: 4.25 },
        { maxMiles: 5, fee: 5.25 },
        { maxMiles: 6, fee: 6.25 },
        { maxMiles: 7, fee: 7.50 },
        { maxMiles: 999, fee: 8.50 },
      ],
      mobileChefRules: [
        { maxMiles: 3, fee: 6.25 },
        { maxMiles: 4, fee: 6.75 },
        { maxMiles: 5, fee: 7.00 },
        { maxMiles: 6, fee: 7.25 },
        { maxMiles: 6.5, fee: 8.00 },
        { maxMiles: 7, fee: 8.50 },
        { maxMiles: 999, fee: 9.50 },
      ],
    },
  },
  downpatrickeats: {
    key: "downpatrickeats",
    name: "Downpatrick Eats",
    tagline: "Food Delivery Service",
    description:
      "Your favourite restaurants in Downpatrick delivered fast to your door.",
    location: "Downpatrick",
    hero: {
      headline: "Hungry? We've Got Downpatrick Covered.",
      subheadline:
        "Order from the best local restaurants and get hot food delivered straight to your door in minutes.",
    },
    theme: {
      gradientFrom: "#1A3A5C",
      gradientVia: "#2980B9",
      gradientTo: "#1ABC9C",
      primary: "#2980B9",
      accent: "#1ABC9C",
      badge: "bg-blue-700",
    },
    stats: {
      restaurants: "45+",
      deliveries: "8K+",
      rating: "4.9",
      minutes: "25",
    },
    contact: {
      managerPhone: "",
      email: "hello@yourlocaleats.app",
      facebook: { label: "Downpatrick Eats Delivery", handle: "Downpatrick Eats Delivery" },
      instagram: { label: "downpatrickeats", handle: "downpatrickeats" },
      notice:
        "If you have any problems with your order, please contact the food outlet you ordered from and they will arrange for a driver to re-deliver any missing items. Alternatively, if you can't get through, please message our Facebook page 'Downpatrick Eats' for assistance. Our support team is available via Messenger.",
    },
    serviceCharge: 1.99,
    coordinates: { lat: 54.3235, lng: -5.7107 },
    deliveryPricing: {
      type: "distance_slabs",
      rules: [
        { maxMiles: 2, fee: 4.0 },
        { maxMiles: 3, fee: 4.5 },
        { maxMiles: 5, fee: 5.0 },
        { maxMiles: 6, fee: 7.0 },
        { maxMiles: 7, fee: 7.5 },
        { maxMiles: 8, fee: 8.0 },
        { maxMiles: 999, fee: 9.0 },
      ],
    },
  },
};


export const DEFAULT_SITE: SiteKey = "kilkeeleats";

export const ALL_SITES = Object.values(SITES);
