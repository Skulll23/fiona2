# 1. Inkbound — Books & Manga Bookstore

A full-stack single-page e-commerce application for browsing and purchasing books, manga/manhwa/manhua, light novels, and graphic novels.

# 2. Problem This Solves

I often find online book stores sorely missing a variety of different kinds of novels. Western novels, Japanese manga, Korean manhwa, Chinese manhua, light novels, and graphic novels. I created Inkbound to bring everyone into one store with a clean genre-filtering sidebar so users can quickly find exactly what they want.

## 3. Technical Stack

| Layer    | Technology                                                              |
| -------- | ----------------------------------------------------------------------- |
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6+)                                  |
| Styling  | Custom CSS with CSS Variables, Google Fonts (Playfair Display, DM Sans) |
| Backend  | Node.js + Express.js                                                    |
| Database | MySQL 8 + mysql2 driver                                                 |
| Session  | UUID stored in localStorage (guest cart)                                |

## 4. Features

- 4 content categories — Books, Manga/Manhwa/Manhua, Light Novels, Graphic Novels
- Genre filtering sidebar — each category has its own genre list (Fantasy, Romance, Sci-Fi, etc.), collapsible per category
- Active filter pill — shows the current category › genre breadcrumb with a one-click clear
- Browse all 71 products with cover art, title, author, genre, and price
- Product detail modal — click any cover for full description, category badge, and genre tag
- Add to cart (CREATE) — adds to a persistent session cart
- View cart (READ) — live cart panel showing items, quantities, line totals
- Update quantity (UPDATE) — + / − buttons per item
- Remove item (DELETE) — ✕ per item, or Clear all
- Running total that updates after every change
- Accessibility — ARIA labels, keyboard nav, focus management, colour contrast
- Ratings — shows ratings to let consumers know the general sentiment around the novel they are purchasing
- Search Bar — enables users to search for a specific novel
- Description — descriptions are from Goodreads

## Folder Structure

Frontend: - index.html - css/style.css - js/: - api.js - ui.js - app.js
this contains all the client-side code.

Backend: - server.js - package.json - config/db.js (MySQL pool) - models/ (SQL queries) - controllers/ (business logic) - routes/ (Express endpoints)
This holds the node.js/express server.
Express.js is responsible for routing (RESTAPI) and it runs from localhost:3000

Database: - schema.sql
Contains mysql scripts

## 6. Challenges that I overcame

When I was unable to code a certain section I consulted AI to assist me with the process. Due to my extensive library of descriptions and books I intended to add, I asked for AI's help with the grunt work to make my process more seamless. I originally intended for the books to be attached to multiple genres, but due to the limited time I had left to complete the project after implementing my initial design, I settled on my final approach where only one genre is attached to each book. Another challenge was adding a ratings system and since this is an e‑commerce website, ratings are crucial for helping customers make decisions, so I had to implement star ratings from Goodreads and carefully place them on each product card and modal without distracting from the core shopping experience.
