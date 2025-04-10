# PoultryMart Frontend

This is the frontend application for PoultryMart, a modern poultry marketplace built with React, Vite, and DaisyUI.

## Features

- 🎨 Modern UI with DaisyUI components
- 🌙 Light/Dark mode support
- 📱 Fully responsive design
- 🚀 Fast development with Vite
- 🛣️ Client-side routing with React Router
- 🔒 User authentication with JWT and toast notifications
- 🎯 Role-based access control (Admin, Seller, Buyer)
- 🚀 Dynamic navigation bar with user context
- 🛡️ Protected routes with loading states
- 🔔 Toast notifications for user feedback
- 💬 Chat functionality
- 📊 Seller, Buyer, and Admin dashboards
- 🛍️ Product marketplace
- 🐔 Breeding management tools
- 📱 Responsive design with modern UI/UX

## Quick Start

1. **Clone the repository** and navigate to the client directory:

   ```bash
   git clone <repository-url>
   cd client
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:

   ```bash
   npm run dev
   ```

4. **Open your browser** and visit: `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
client/
├── public/
│ └── chicken.svg
├── src/
│ ├── components/
│ │ ├── common/
│ │ │ └── BouncingChicken.jsx
│ │ ├── layout/
│ │ │ ├── Footer.jsx
│ │ │ └── Navbar.jsx
│ │ └── routes/
│ │     └── ProtectedRoute.jsx
│ ├── pages/
│ │ ├── AdminDashboard/
│ │ │   ├── AdminManageUsers.jsx
│ │ │   └── AdminManageListings.jsx
│ │ ├── BuyerDashboard/
│ │ │   ├── BuyerMyPurchase.jsx
│ │ │   └── BuyerManageProfile.jsx
│ │ ├── SellerDashboard/
│ │ │   ├── SellerProfile.jsx
│ │ │   ├── SellerPostProduct.jsx
│ │ │   ├── SellerOrders.jsx
│ │ │   └── SellerAnalytics.jsx
│ │ ├── AdminDashboardPage.jsx
│ │ ├── BuyerDashboardPage.jsx
│ │ ├── ChatPage.jsx
│ │ ├── HomePage.jsx
│ │ ├── LoginPage.jsx
│ │ ├── ProductListPage.jsx
│ │ ├── RegisterPage.jsx
│ │ └── SellerDashboardPage.jsx
│ ├── App.jsx
│ ├── index.css
│ └── main.jsx
│
├── index.html
├── package.json
├── postcss.config.cjs
├── tailwind.config.cjs
└── vite.config.js
```

## Pages

### Core Pages

- `HomePage` - Landing page with featured products and marketplace overview
- `ProductListPage` - Grid layout of available poultry products
- `LoginPage` - Two-panel login page with animation
- `RegisterPage` - Two-panel registration page with animation
- `ChatPage` - Messaging interface for buyer-seller communication

### Dashboard Pages

- `SellerDashboardPage` - Main dashboard for sellers with nested routes:
  - Profile Management
  - Product Posting
  - Order Management
  - Analytics
- `BuyerDashboardPage` - Main dashboard for buyers with nested routes:
  - Purchase History
  - Profile Management
- `AdminDashboardPage` - Main dashboard for administrators with nested routes:
  - User Management
  - Listing Management

### Additional Pages

- `BreedingManagementPage` - Tools for managing poultry breeding
- `HelpCenterPage` - Support resources and documentation
- `ContactUsPage` - Contact information and support form

## Components

### Layout Components

- `Navbar` - Main navigation bar with links to all major sections
- `Footer` - Site footer with copyright information

### Common Components

- `BouncingChicken` - Animated chicken logo component

## Tech Stack

- **React** - A JavaScript library for building user interfaces
- **Vite** - A fast build tool and development server
- **React Router** - For client-side routing with nested routes
- **Tailwind CSS** - A utility-first CSS framework for styling
- **DaisyUI** - A component library for Tailwind CSS
- **React Hot Toast** - Toast notifications for user feedback
- **PostCSS** - A tool for transforming CSS with JavaScript plugins
- **ESLint** - A tool for identifying and fixing problems in JavaScript code

## DaisyUI Theme Configuration

The project uses a custom DaisyUI theme defined in `tailwind.config.cjs`. The theme includes:

- Primary color: Orange (#ffb761)
- Secondary color: Brown (#8B4513)
- Accent color: Purple (#a78bfa)
- Success, error, warning, and info states
- Light and dark theme support

To switch themes, modify the `data-theme` attribute in `index.html` or implement a theme switcher using DaisyUI's theme utilities.

## Contributing

If you'd like to contribute to the project, please fork the repository and submit a pull request. Ensure that your code adheres to the project's coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
