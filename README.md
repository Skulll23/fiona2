<div align="center">
  <h1>INKBOUND</h1>
  <p><strong>Minimal luxury bookstore for books, manga, light novels, and graphic novels.</strong></p>
</div>

<br />

# Inkbound — Bookstore

Most online bookstores separate readers into narrow shelves: novels in one place, manga in another, light novels somewhere else, and graphic novels treated like an afterthought. Inkbound solves this by giving every format a single curated storefront with fast search, genre-first browsing, saved carts, order history, and a polished black-and-white luxury interface.

It is a full-stack e-commerce Single Page Application built with vanilla frontend code, an Express/MySQL backend, and a static fallback mode so the storefront still works directly from `frontend/index.html` without running the server.

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript (ES6+)          |
| Backend    | Node.js, Express 4                              |
| Database   | MySQL 8, mysql2                                 |
| Auth       | JWT, bcryptjs, role-based admin access          |
| Styling    | Pure CSS with CSS variables design system       |
| Assets     | 500 local Open Library cover images             |
| Offline    | Static catalog + localStorage API fallback      |

---

## Features

- **Luxury storefront UI** — black-and-white Aurum-inspired theme, smooth light/dark transition, minimal header, responsive book grid, premium modal and cart surfaces
- **500 unique titles** — real catalog entries with local book cover images, author data, category, genre, price, rating, stock, and description
- **Category browsing** — Books, Manga/Manhwa/Manhua, Light Novels, and Graphic Novels, each with genre-specific filters
- **Search and autocomplete** — fast title/author search with live suggestions and one-click selection
- **Sorting** — A-Z, price low-high, price high-low, top rated, and newest
- **Product detail modal** — full cover image, category badge, genre, author, rating, description, similar reads, and review area
- **Cart CRUD** — add titles, update quantities, remove individual items, clear all items, and see live subtotal calculations
- **Checkout confirmation** — custom modal confirmation before placing an order, clearing the cart, deleting reviews, or logging out
- **Accounts** — register, log in, persist sessions, user-specific carts, wishlists, and order history
- **Wishlist** — save titles for later and add them to the cart from a side drawer
- **Orders** — checkout creates saved orders, clears the cart, and shows the user’s order history
- **Admin panel** — admin dashboard with all user carts, all orders from every account, product count, order count, users, and revenue
- **Static fallback** — when opened via `file://`, `api.js` serves products, users, carts, wishlists, orders, reviews, and admin data from localStorage
- **Accessibility** — labelled inputs, ARIA dialog roles, keyboard Escape handling, focusable product covers, and readable light/dark contrast
- **Responsive** — mobile cart drawer, two-column mobile product cards, adaptive hero, and tablet/desktop grid layouts

---

## Folder Structure

```
fiona2/
├── backend/
│   ├── config/
│   │   └── db.js                  # MySQL connection pool
│   ├── controllers/
│   │   ├── adminController.js     # Admin user-cart visibility
│   │   ├── authController.js      # Register, login, JWT issue
│   │   ├── cartController.js      # Cart CRUD
│   │   └── productController.js   # Product listing, filters, search
│   ├── middleware/
│   │   └── auth.js                # verifyToken + admin guard
│   ├── models/
│   │   ├── cartModel.js           # Cart SQL helpers
│   │   ├── productModel.js        # Product SQL helpers
│   │   └── userModel.js           # User SQL helpers
│   ├── routes/
│   │   ├── adminRoutes.js         # Analytics, all orders, all carts
│   │   ├── authRoutes.js          # /auth/register, /auth/login, /auth/me
│   │   ├── cartRoutes.js          # /cart CRUD endpoints
│   │   ├── orderRoutes.js         # Checkout + user order history
│   │   ├── productRoutes.js       # Catalog, categories, autocomplete, similar
│   │   ├── reviewRoutes.js        # Product reviews
│   │   └── wishlistRoutes.js      # Wishlist endpoints
│   ├── scripts/
│   │   ├── fetchCovers.js         # Cover download helper
│   │   ├── migrate.js             # Database migration runner
│   │   └── seedBooks*.js          # Seed scripts
│   ├── server.js                  # Express app entry
│   └── package.json
├── database/
│   ├── schema.sql                 # MySQL schema and seed data
│   └── migrate_add_auth.sql       # Auth/order-related migration
├── frontend/
│   ├── css/
│   │   └── style.css              # Complete responsive luxury UI system
│   ├── images/
│   │   ├── openlibrary-covers/    # 500 local book cover images
│   │   └── placeholder.svg        # Fallback cover
│   ├── js/
│   │   ├── api.js                 # Backend API client + static fallback API
│   │   ├── app.js                 # App state, event handlers, checkout flow
│   │   ├── catalog.js             # Static 500-title catalog
│   │   └── ui.js                  # DOM rendering, modals, admin, confirmations
│   └── index.html                 # Single-page storefront
├── graphify-out/                  # Local code graph output
├── .gitignore
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MySQL 8+

### 1. Install backend dependencies
```bash
cd fiona2/backend
npm install
```

### 2. Configure environment
Create `backend/.env`:
```bash
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=inkbound
JWT_SECRET=replace_with_a_long_secret
```

### 3. Create and seed the database
```bash
mysql -u root -p < ../database/schema.sql
```

If you already have the database and only need the auth/order migration:
```bash
mysql -u root -p inkbound < ../database/migrate_add_auth.sql
```

### 4. Start the backend server
```bash
cd fiona2/backend
npm run dev       # development with nodemon
# or
npm start         # production
```

Server will be available at `http://localhost:3000`.

### 5. Open the frontend
Open this file in a browser:
```bash
fiona2/frontend/index.html
```

The frontend calls `/api` when the backend is available. If opened directly as a local file and the backend cannot be reached, it uses the static fallback catalog and localStorage so the demo remains usable.

---

## Demo Accounts

Static fallback mode includes an admin account:

```text
Email:    admin@inkbound.com
Password: admin123
```

Normal users can be created from the Login / Register modal. Their carts, wishlists, and orders are saved in localStorage when using static mode.

---

## Challenges Overcome

**Static API Fallback** — The project originally depended on a running Express/MySQL server, which caused `Failed to fetch` errors when opening `frontend/index.html` directly. I solved this by building a static API layer inside `api.js` that mirrors the backend endpoints for products, auth, carts, wishlists, orders, reviews, and admin data using `localStorage`.

**500 Unique Books with Real Covers** — The first large catalog pass accidentally repeated variants of the same books. The catalog was rebuilt around 500 unique titles and paired with local Open Library cover images so cards display actual book covers instead of random placeholders.

**User-Specific Cart Persistence** — Guest carts and logged-in user carts were initially easy to mix up on the same browser. The session logic now uses deterministic user-specific cart keys once a user is logged in, while guests still get isolated UUID-based sessions.

**Order History and Admin Visibility** — Checkout previously returned success without persisting orders in static mode. Orders are now written to localStorage, user order history reads them back, and the admin panel can view orders across every account.

**Theme Transition Polish** — Light/dark mode originally changed component colors at different times, making the UI feel jarring. The theme toggle now uses the View Transitions API when available, with a CSS fallback that transitions the page as a coherent surface.

**Minimal Luxury UI Pass** — The interface went through several stacked CSS iterations. The final pass added a consistent token system, restrained surfaces, book-focused product cards, custom confirmation dialogs, improved responsive behavior, and an Aurum-inspired black-and-white visual direction.

---

## Database Export

To export the MySQL database for submission or backup:
```bash
mysqldump -u root -p inkbound > inkbound.sql
```

To restore it later:
```bash
mysql -u root -p inkbound < inkbound.sql
```
