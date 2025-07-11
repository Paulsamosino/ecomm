# C&P E-Commerce Platform

A full-featured e-commerce platform specializing in chicken and poultry products, with integrated delivery services.

## Core Features

- User Authentication & Authorization
- Product Management
- Order Processing
- Inventory Management
- Real-time Chat
- Seller Dashboard
- Buyer Dashboard
- Lalamove Delivery Integration
- Payment Processing
- Real-time Notifications

## Delivery Integration (Lalamove)

The platform integrates with Lalamove's delivery API to provide real-time delivery services:

### Features

- Real-time delivery quotations
- Automated delivery order creation
- Live delivery tracking
- Driver information and status updates
- Delivery cancellation support
- Rate limit handling (50 QPM)

### Setup

1. Sign up for a Lalamove Business Account
2. Obtain your API credentials:
   - API Key
   - API Secret
   - API User
3. Configure environment variables:
   ```env
   LALAMOVE_API_KEY=your_api_key
   LALAMOVE_API_SECRET=your_api_secret
   LALAMOVE_API_USER=your_api_user
   LALAMOVE_SANDBOX_URL=https://rest.sandbox.lalamove.com
   ```

### Usage

#### For Sellers

1. After receiving an order, go to the order details
2. Click on "Get Delivery Quote" to get a delivery price estimate
3. Review the quote and click "Create Delivery" to initiate delivery
4. Track delivery status and driver information in real-time
5. Option to cancel delivery if needed (before driver pickup)

#### For Buyers

1. View delivery status in order details
2. Track driver location and estimated arrival time
3. Access driver contact information when assigned
4. Receive real-time notifications on delivery updates

## Installation

### Prerequisites

- Node.js 18+
- MongoDB 4.4+
- npm or yarn

### Setup Steps

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ecomm-main.git
cd ecomm-main
```

2. Install dependencies:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd client
npm install
```

3. Environment Configuration:
   - Copy `.env.example` to `.env` in both client and server directories
   - Fill in your configuration values

### Development

Start the development server:

```bash
# Start the server (from server directory)
npm run dev

# Start the client (from client directory)
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Tech Stack

### Frontend

- React 18
- Tailwind CSS
- Shadcn/ui
- Socket.io-client
- Axios

### Backend

- Node.js
- Express
- MongoDB
- Socket.io
- JWT Authentication
- Nodemailer

## API Documentation

### Main Endpoints

#### Auth

- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- GET /api/auth/me - Get current user

#### Products

- GET /api/products - List products
- POST /api/products - Create product
- GET /api/products/:id - Get product details
- PUT /api/products/:id - Update product
- DELETE /api/products/:id - Delete product

#### Orders

- POST /api/orders - Create order
- GET /api/orders/my - Get user orders
- GET /api/orders/:id - Get order details
- PUT /api/orders/:id/status - Update order status

#### Delivery (Lalamove)

- POST /api/delivery/quote - Get delivery quote
- POST /api/delivery/create - Create delivery order
- GET /api/delivery/:orderId/status - Get delivery status
- GET /api/delivery/:orderId/driver - Get driver information
- DELETE /api/delivery/:orderId - Cancel delivery

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
