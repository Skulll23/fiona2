# Graph Report - /Users/arpitgoyal/Desktop/fiona2  (2026-05-16)

## Corpus Check
- 8 files · ~1,843,788 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 179 nodes · 420 edges · 13 communities detected
- Extraction: 71% EXTRACTED · 29% INFERRED · 0% AMBIGUOUS · INFERRED: 122 edges (avg confidence: 0.8)
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

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 35 edges
2. `showToast()` - 19 edges
3. `loadProducts()` - 17 edges
4. `emitAppSnapshot()` - 13 edges
5. `handleLogin()` - 13 edges
6. `openAdminPanel()` - 13 edges
7. `renderSkeletons()` - 10 edges
8. `renderCart()` - 10 edges
9. `handleRegister()` - 10 edges
10. `submitCheckout()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `showCartError()` --calls--> `loadCart()`  [INFERRED]
  /Users/arpitgoyal/Desktop/fiona2/frontend/js/ui.js → /Users/arpitgoyal/Desktop/fiona2/frontend/js/app.js
- `showToast()` --calls--> `handleWishlistToggle()`  [INFERRED]
  /Users/arpitgoyal/Desktop/fiona2/frontend/js/ui.js → /Users/arpitgoyal/Desktop/fiona2/frontend/js/app.js
- `showToast()` --calls--> `handleSubmitReview()`  [INFERRED]
  /Users/arpitgoyal/Desktop/fiona2/frontend/js/ui.js → /Users/arpitgoyal/Desktop/fiona2/frontend/js/app.js
- `showToast()` --calls--> `handleDeleteReview()`  [INFERRED]
  /Users/arpitgoyal/Desktop/fiona2/frontend/js/ui.js → /Users/arpitgoyal/Desktop/fiona2/frontend/js/app.js
- `showToast()` --calls--> `saveCurrentFilterCollection()`  [INFERRED]
  /Users/arpitgoyal/Desktop/fiona2/frontend/js/ui.js → /Users/arpitgoyal/Desktop/fiona2/frontend/js/app.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.1
Nodes (32): applyCategoryBySlug(), applyCollection(), applySavedFilterCollection(), clearAdvancedFilters(), clearSearch(), closeAdminPanel(), closeAutocomplete(), closeCommandPalette() (+24 more)

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (19): calculateCheckoutTotals(), openCheckout(), openModal(), rememberRecentlyViewed(), adminStockMeta(), authorBio(), categoryTotals(), cleanImageUrl() (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.19
Nodes (20): addToCart(), addToWishlist(), apiDeleteAdminProduct(), apiFetch(), apiGetMe(), apiLogin(), apiRegister(), clearCart() (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.19
Nodes (17): setStoredUser(), setToken(), cartProductIds(), closeAuthModal(), emitAppSnapshot(), getAppSnapshot(), handleLogin(), handleRegister() (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.23
Nodes (16): removeStoredUser(), removeToken(), closeCheckout(), handleAddToCart(), handleAdminProductDelete(), handleApplyCoupon(), handleCheckout(), handleClearCart() (+8 more)

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (7): connectMongo(), ensureMongoSeed(), getCartResponse(), getCollections(), getTokenUser(), requireUser(), userFromDb()

### Community 6 - "Community 6"
Cohesion: 0.18
Nodes (11): apiGetAdminProducts(), apiGetAdminReviews(), apiGetAdminUsers(), apiGetAllOrders(), apiGetAllUserCarts(), apiGetAnalytics(), apiUpdateAdminUser(), apiUpdateOrderStatus() (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.2
Nodes (11): clearLegacySession(), deleteReview(), fetchReviews(), generateUUID(), getSessionId(), getStoredUser(), getToken(), submitReview() (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.33
Nodes (6): handleWishlistToggle(), openAuthModal(), openOrders(), switchAuthView(), renderAuthModal(), renderOrderHistory()

### Community 9 - "Community 9"
Cohesion: 0.5
Nodes (2): formatMoney(), ReactAssignmentDashboard()

### Community 10 - "Community 10"
Cohesion: 0.67
Nodes (3): apiCreateAdminProduct(), apiUpdateAdminProduct(), handleAdminProductSave()

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0):

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (0):

## Knowledge Gaps
- **Thin community `Community 11`** (1 nodes): `catalog.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (1 nodes): `server.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `showToast()` connect `Community 4` to `Community 0`, `Community 1`, `Community 3`, `Community 6`, `Community 7`, `Community 8`, `Community 10`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `openAdminPanel()` connect `Community 6` to `Community 0`, `Community 1`, `Community 10`, `Community 4`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `Community 2` to `Community 10`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `showToast()` (e.g. with `handleAddToCart()` and `handleUpdateQty()`) actually correct?**
  _`showToast()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `loadProducts()` (e.g. with `fetchProducts()` and `renderProducts()`) actually correct?**
  _`loadProducts()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `handleLogin()` (e.g. with `apiLogin()` and `setToken()`) actually correct?**
  _`handleLogin()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._