# FoodHub - Modern Food Ordering UI

A clean, modern food ordering platform UI built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, and lucide-react icons.

## Features

✨ **Complete Frontend-Only Application**
- No backend or database
- All data hardcoded in constants
- Fully functional demo with realistic UI

### Pages & Features

1. **Landing Page** - Hero section with call-to-action
2. **Restaurant Listing** - Browse available restaurants
3. **Restaurant Menu** - View menu items with search functionality
4. **Login & Register System** - Dummy authentication using hardcoded credentials
5. **Account Dashboard** - User account management (UI only)
6. **Navigation Bar** - Global navigation with auth state

### UI Components

- Modern card layouts
- Search functionality
- Shopping cart interface
- Responsive grid system
- Tab-based account sections
- Error/success notifications

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Icons**: lucide-react
- **State Management**: React hooks + localStorage

## Getting Started

### Installation

```bash
cd /Users/mipl/Desktop/ui
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with navbar
│   ├── page.tsx                # Landing page
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── account/
│   │   └── page.tsx            # Account dashboard
│   ├── restaurants/
│   │   └── page.tsx            # Restaurant listing
│   ├── restaurant/
│   │   └── [id]/
│   │       └── page.tsx        # Individual restaurant menu
│   ├── not-found.tsx           # 404 page
│   └── globals.css             # Global styles
├── components/
│   ├── Navbar.tsx              # Navigation component
│   └── ui/                     # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── badge.tsx
│       └── tabs.tsx
├── constants/
│   ├── restaurants.ts          # Restaurant & menu data
│   └── users.ts                # Demo user credentials
└── types/
    └── index.ts                # TypeScript types
```

## Demo Credentials

```
Email:    demo@test.com
Password: 123456
```

## Data Structures

### Restaurant
```typescript
interface Restaurant {
  id: string;
  name: string;
  location: string;
  opening: string;
  closing: string;
  menu: MenuItem[];
}
```

### Menu Item
```typescript
interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
}
```

## Key Features

### 🏠 Landing Page
- Hero section with gradient background
- Feature highlights with icons
- CTA button to order food

### 🏪 Restaurant Listing
- Grid layout of restaurant cards
- Display location and opening hours
- Menu item count badge
- Click to view full menu

### 🍕 Restaurant Menu
- Restaurant details header
- Search menu items in real-time
- Item cards with description and price
- Add to cart functionality
- Cart summary sidebar
- Change restaurant button

### 🔐 Authentication
- Simple login form
- Local storage persistence
- Demo credentials for testing
- Logout functionality in navbar

### 👤 Account Dashboard
- Tabbed interface
- My Orders section
- Account details form
- Password change section
- User profile display

## Features (UI Only)

The following features are implemented as UI demonstrations:
- Add to cart (displays items in order sidebar)
- Checkout button
- Save changes for account details
- Update password
- Restaurant search

These are non-functional in this demo as it's frontend-only.

## Responsive Design

- Mobile-first approach
- Tailwind breakpoints:
  - `sm:` 640px
  - `md:` 768px
  - `lg:` 1024px
  - `xl:` 1280px

## Colors & Styling

- **Primary Color**: Orange (#f97316)
- **Secondary**: Gray tones
- **Backgrounds**: Subtle gradients
- **Borders**: Subtle gray lines
- **Text**: Semantic color contrast

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ JavaScript support required

## Performance

- Server-side rendering with Next.js
- Static generation where possible
- Optimized bundle size with tree-shaking
- Image optimization ready

## Future Enhancements

To convert this to a full-stack application:

1. Connect to backend API
2. Add database (PostgreSQL, MongoDB, etc.)
3. Implement real authentication
4. Add payment processing
5. Enable order tracking
6. Add user reviews and ratings
7. Implement push notifications

## License

MIT

---

Built with ❤️ for a modern food ordering experience.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
