export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  location: string;
  opening: string;
  closing: string;
  menu: MenuItem[];
}

export interface User {
  email: string;
  password: string;
}
