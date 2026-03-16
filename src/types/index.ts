export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface Restaurant {
  id: string;
  name: string;
  location: string;
  opening: string;
  closing: string;
  menu: MenuItem[];
  categories: MenuCategory[];
}

export interface User {
  email: string;
  password: string;
}
