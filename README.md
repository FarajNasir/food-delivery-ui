# 🍕 FoodHub - Modern Multi-Location Food Ordering Platform

A comprehensive, modern food ordering platform UI built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, and lucide-react icons. Designed to serve multiple restaurant locations with a unified, professional interface.

## ✨ Features

### 🚀 **Complete Frontend-Only Application**
- No backend or database required
- All data hardcoded in constants for demo purposes
- Fully functional demo with realistic UI/UX
- Multi-location support (Newcastle, London, etc.)

### 📱 **Pages & Features**

1. **🏠 Landing Page** - Hero section with location-based search and call-to-action
2. **🏪 Restaurant Listing** - Browse available restaurants with filtering by location and search by restaurant name
3. **🍽️ Restaurant Menu** - Interactive menu with categorized tabs and advanced search
4. **🔐 Authentication System** - Login/Register with demo credentials and localStorage persistence
5. **👤 Account Dashboard** - User profile management with tabbed interface
6. **📞 Contact Page** - Contact information and form
7. **🎁 Offers Page** - Special deals and promotions
8. **🧭 Navigation** - Global navigation with authentication state

### 🎨 **UI Components & Features**

- **Modern Card Layouts** - Clean, professional restaurant and menu cards
- **Advanced Search** - Real-time search across menu categories and restaurant names
- **Tabbed Menu Categories** - Organized food items (Pizzas, Burgers, Drinks, etc.)
- **Smart Shopping Cart** - Quantity controls with manual input and +/- buttons
- **Responsive Grid System** - Mobile-first design with Tailwind breakpoints
- **Interactive Forms** - Contact forms, authentication, and user profiles
- **Status Notifications** - Success/error messages for user actions
- **Loading States** - Smooth user experience with proper feedback

## 🛠️ Tech Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5.x
- **Runtime**: React 19.2.3
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui + @base-ui/react
- **Icons**: Lucide React (500+ icons)
- **State Management**: React hooks + localStorage
- **Build Tools**: ESLint, PostCSS
- **Deployment**: Vercel-ready

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager

### Installation

```bash
# Clone the repository
cd /Users/mipl/Desktop/ui

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Code Quality

```bash
# Run linting
npm run lint
```

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with navbar and global styles
│   ├── page.tsx                # Landing page with hero section
│   ├── globals.css             # Global Tailwind CSS styles
│   ├── not-found.tsx           # 404 error page
│   ├── favicon.ico             # App favicon
│   │
│   ├── account/
│   │   ├── page.tsx            # User account dashboard with tabs
│   │   ├── login/
│   │   │   └── page.tsx        # Login page with demo credentials
│   │   └── register/
│   │       └── page.tsx        # Registration form
│   │
│   ├── contact/
│   │   └── page.tsx            # Contact information and form
│   │
│   ├── offers/
│   │   └── page.tsx            # Special deals and promotions
│   │
│   ├── restaurants/
│   │   └── page.tsx            # Restaurant listing with location filter
│   │
│   └── restaurant/
│       └── [id]/
│           └── page.tsx        # Individual restaurant with menu categories
│
├── components/
│   ├── Navbar.tsx              # Global navigation with auth state
│   ├── RestaurantsContent.tsx  # Restaurant listing logic
│   └── ui/                     # shadcn/ui component library
│       ├── badge.tsx           # Status badges and labels
│       ├── button.tsx          # Interactive buttons
│       ├── card.tsx            # Content containers
│       ├── checkbox.tsx        # Form checkboxes
│       ├── input.tsx           # Form inputs
│       └── tabs.tsx            # Tabbed navigation
│
├── constants/
│   ├── restaurants.ts          # Restaurant data with categories
│   └── users.ts                # Demo user credentials
│
└── types/
    └── index.ts                # TypeScript interfaces
```

## 🔑 Demo Credentials

The application includes pre-configured demo accounts for testing:

```
Email:           demo@test.com
Password:        123456

Email:           john1@gmail.com
Password:        123456
```

**Note**: Demo credentials are displayed directly on the login page for easy testing.

## 📊 Data Structures

### Restaurant Interface
```typescript
interface Restaurant {
  id: string;
  name: string;
  location: string;
  opening: string;
  closing: string;
  menu: MenuItem[];           // Flat menu array for compatibility
  categories: MenuCategory[]; // Organized menu categories
}
```

### Menu Category Interface
```typescript
interface MenuCategory {
  name: string;        // Category name (e.g., "Pizzas", "Drinks")
  items: MenuItem[];   // Items in this category
}
```

### Menu Item Interface
```typescript
interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;    // Category this item belongs to
}
```

### User Interface
```typescript
interface User {
  email: string;
  password: string;
}
```

## 🎯 Key Features

### 🏠 **Landing Page**
- **Hero Section**: Gradient background with compelling messaging
- **Location Search**: Input field for location-based restaurant filtering
- **Feature Highlights**: Icons showcasing delivery, speed, and quality
- **Call-to-Action**: Prominent "Order Food" button

### 🏪 **Restaurant Listing**
- **Grid Layout**: Responsive cards displaying restaurant information
- **Location Filtering**: Filter restaurants by location (Newcastle, London, etc.)
- **Restaurant Cards**: Show name, location, hours, and menu item count
- **Interactive Navigation**: Click to view detailed restaurant menu

### 🍽️ **Advanced Restaurant Menu**
- **Restaurant Header**: Location, hours, and navigation
- **Tabbed Categories**: Organized menu sections (Pizzas, Burgers, Drinks, etc.)
- **Real-time Search**: Search across all menu categories simultaneously
- **Menu Item Cards**: Name, description, price, and add-to-cart functionality
- **Category Filtering**: Switch between different food categories instantly

### 🛒 **Smart Shopping Cart**
- **Quantity Management**: Manual input field with +/- buttons
- **Unique Items**: No duplicate entries - quantities tracked separately
- **Price Calculation**: Automatic total calculation with quantities
- **Visual Controls**: Professional orange-themed quantity selectors
- **Cart Summary**: Real-time total in sidebar with itemized breakdown

### 🔐 **Authentication System**
- **Login Page**: Clean form with demo credentials prominently displayed
- **Registration**: Full signup form with validation
- **Session Management**: localStorage persistence across browser sessions
- **Protected Routes**: Account dashboard requires authentication
- **Logout Functionality**: Available in navigation bar

### 👤 **Account Dashboard**
- **Tabbed Interface**: Organized sections for different account features
- **Profile Management**: View and edit personal information
- **Order History**: UI for past orders (demo data)
- **Preferences**: Communication and notification settings
- **Password Management**: Change password form

### 📞 **Contact Page**
- **Contact Information**: Phone, email, address, and hours
- **Contact Form**: Functional form with validation and success states
- **Business Details**: Complete contact information display
- **Responsive Layout**: Optimized for all screen sizes

### 🎁 **Offers Page**
- **Promotional Cards**: Special deals and discount offers
- **Discount Codes**: Promotional codes for different offers
- **Restaurant-Specific**: Offers tied to specific restaurants or all locations
- **Visual Appeal**: Attractive cards with offer details

### 🧭 **Navigation & UX**
- **Global Navbar**: Consistent navigation across all pages
- **Authentication State**: Dynamic navbar based on login status
- **Mobile Responsive**: Optimized for mobile, tablet, and desktop
- **Loading States**: Smooth transitions and user feedback
- **Error Handling**: Graceful error states and messaging

## 📱 Responsive Design

Built with a mobile-first approach using Tailwind CSS breakpoints:

- **Mobile**: `< 640px` - Single column layouts, stacked navigation
- **Tablet**: `640px - 768px` - Two-column grids, compact navigation
- **Desktop**: `768px+` - Multi-column layouts, full navigation
- **Large Desktop**: `1024px+` - Expanded layouts, enhanced spacing

### Key Responsive Features:
- **Adaptive Grids**: Restaurant and menu grids adjust to screen size
- **Flexible Navigation**: Navbar transforms for mobile devices
- **Touch-Friendly**: Large touch targets for mobile interactions
- **Optimized Typography**: Readable text at all screen sizes

## 🎨 Colors & Styling

### Design System:
- **Primary Color**: Orange (`#f97316`) - Used for CTAs, buttons, and accents
- **Secondary Colors**: Gray palette (`#6b7280`, `#9ca3af`, etc.)
- **Backgrounds**: Subtle gradients and neutral grays
- **Text Colors**: Semantic contrast ratios for accessibility
- **Borders**: Soft gray borders (`#e5e7eb`) for definition

### Component Styling:
- **Cards**: White backgrounds with subtle shadows
- **Buttons**: Orange primary, gray secondary variants
- **Forms**: Clean inputs with focus states
- **Navigation**: Consistent orange accents throughout
- **Interactive Elements**: Hover states and smooth transitions

## 🔧 Advanced Features

### Cart Management:
- **Quantity Input**: Manual entry with validation (1-99 range)
- **Increment/Decrement**: + and - buttons for easy quantity changes
- **Auto-Removal**: Items removed when quantity reaches 0
- **Price Calculation**: Real-time total updates with quantities

### Menu Organization:
- **Category Tabs**: Switch between food categories instantly
- **Cross-Category Search**: Search works across all menu sections
- **Item Filtering**: Real-time filtering as you type
- **Category Counts**: Visual feedback on search results

### Form Validation:
- **Real-time Validation**: Instant feedback on form inputs
- **Error States**: Clear error messages for invalid inputs
- **Success States**: Confirmation messages for successful actions
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ JavaScript support required

## Performance

- Server-side rendering with Next.js
- Static generation where possible
- Optimized bundle size with tree-shaking
- Image optimization ready

## 🚀 Future Enhancements

### Backend Integration:
1. **API Development**: RESTful API with authentication
2. **Database**: PostgreSQL/MongoDB for data persistence
3. **Real Authentication**: JWT tokens, OAuth integration
4. **Payment Processing**: Stripe/PayPal integration
5. **Order Management**: Real-time order tracking and status updates

### Advanced Features:
1. **User Reviews**: Rating system for restaurants and menu items
2. **Push Notifications**: Order status and promotional alerts
3. **Loyalty Program**: Points system and rewards
4. **Delivery Tracking**: Real-time GPS tracking
5. **Multi-language**: Internationalization support
6. **Dark Mode**: Theme switching capability

### Performance & Scalability:
1. **Image Optimization**: Cloudinary/AWS S3 for image hosting
2. **Caching**: Redis for session and data caching
3. **CDN**: Global content delivery network
4. **Monitoring**: Application performance monitoring
5. **Load Balancing**: Horizontal scaling support

### Mobile App:
1. **React Native**: Cross-platform mobile application
2. **Native Features**: Camera for receipts, GPS for delivery
3. **Push Notifications**: Firebase Cloud Messaging
4. **Offline Mode**: Limited functionality without internet

## 📈 Project Metrics

- **9 Restaurant Locations** with diverse cuisines
- **50+ Menu Items** across multiple categories
- **6 Main Pages** with full functionality
- **100% Responsive** design across all devices
- **TypeScript Coverage** for type safety
- **Modern UI/UX** with professional design system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** - The React framework for production
- **shadcn/ui** - Beautiful UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Vercel** - Deployment platform

---

**Built with ❤️ for a modern food ordering experience.**

## 🌐 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
