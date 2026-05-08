# Graph Report - /Users/arpitgoyal/Desktop/fiona2  (2026-05-08)

## Corpus Check
- 27 files · ~1,676,858 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 167 nodes · 316 edges · 31 communities detected
- Extraction: 74% EXTRACTED · 26% INFERRED · 0% AMBIGUOUS · INFERRED: 82 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 28 edges
2. `staticApiFetch()` - 17 edges
3. `loadProducts()` - 13 edges
4. `showToast()` - 12 edges
5. `handleLogin()` - 12 edges
6. `handleRegister()` - 9 edges
7. `renderCart()` - 8 edges
8. `handleLogout()` - 8 edges
9. `renderSkeletons()` - 7 edges
10. `openModal()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `showToast()` --calls--> `handleAddToCart()`  [INFERRED]
  /Users/arpitgoyal/Desktop/fiona2/frontend/js/ui.js → /Users/arpitgoyal/Desktop/fiona2/frontend/js/app.js
- `showToast()` --calls--> `handleWishlistToggle()`  [INFERRED]
  /Users/arpitgoyal/Desktop/fiona2/frontend/js/ui.js → /Users/arpitgoyal/Desktop/fiona2/frontend/js/app.js
- `showToast()` --calls--> `handleSubmitReview()`  [INFERRED]
  /Users/arpitgoyal/Desktop/fiona2/frontend/js/ui.js → /Users/arpitgoyal/Desktop/fiona2/frontend/js/app.js
- `showToast()` --calls--> `handleDeleteReview()`  [INFERRED]
  /Users/arpitgoyal/Desktop/fiona2/frontend/js/ui.js → /Users/arpitgoyal/Desktop/fiona2/frontend/js/app.js
- `showToast()` --calls--> `handleRegister()`  [INFERRED]
  /Users/arpitgoyal/Desktop/fiona2/frontend/js/ui.js → /Users/arpitgoyal/Desktop/fiona2/frontend/js/app.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.16
Nodes (27): buildStaticCart(), currentStaticUserFromToken(), defaultStaticUsers(), generateUUID(), getSessionId(), getStoredUser(), getToken(), hasStaticCatalog() (+19 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (17): fetchCategories(), fetchProducts(), clearSearch(), closeAutocomplete(), handleCategoryClick(), handleClearFilter(), handleGenreClick(), handleLoadMore() (+9 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (20): deleteReview(), fetchOrders(), fetchReviews(), fetchSimilar(), submitReview(), handleDeleteReview(), handleSubmitReview(), openAuthModal() (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (14): addToWishlist(), apiFetch(), apiGetAllOrders(), apiGetAllUserCarts(), apiGetAnalytics(), apiGetMe(), apiLogin(), fetchAutocomplete() (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.24
Nodes (13): clearCart(), removeCartItem(), removeStoredUser(), removeToken(), handleCheckout(), handleClearCart(), handleLogout(), handleRemoveItem() (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.25
Nodes (11): apiRegister(), fetchCart(), fetchWishlistIds(), setStoredUser(), setToken(), closeAuthModal(), handleLogin(), handleRegister() (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (6): addToCart(), fetchWishlist(), cartProductIds(), handleAddToCart(), openWishlist(), renderWishlist()

### Community 7 - "Community 7"
Cohesion: 0.7
Nodes (4): fetchCoverUrl(), httpsGet(), main(), sleep()

### Community 8 - "Community 8"
Cohesion: 0.4
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 0.5
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 0.5
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 11`** (2 nodes): `testConnection()`, `db.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (2 nodes): `seed()`, `seedBooks3.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (2 nodes): `seed()`, `seedBooks2.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (2 nodes): `migrate()`, `migrate.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (2 nodes): `seed()`, `seedBooks4.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (2 nodes): `extractUserId()`, `orderRoutes.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `catalog.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `server.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `cartModel.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `userModel.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `productModel.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `adminController.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `productController.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `authController.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `productRoutes.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `authRoutes.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `cartRoutes.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `adminRoutes.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `wishlistRoutes.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `reviewRoutes.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiFetch()` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `loadProducts()` connect `Community 1` to `Community 4`, `Community 6`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `fetchProducts()` connect `Community 1` to `Community 0`, `Community 3`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `loadProducts()` (e.g. with `fetchProducts()` and `renderProducts()`) actually correct?**
  _`loadProducts()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `showToast()` (e.g. with `handleAddToCart()` and `handleUpdateQty()`) actually correct?**
  _`showToast()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `handleLogin()` (e.g. with `apiLogin()` and `setToken()`) actually correct?**
  _`handleLogin()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._