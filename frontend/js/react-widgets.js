(function mountReactAssignmentDashboard() {
  const rootEl = document.getElementById('reactAssignmentDashboard');
  if (!rootEl || !window.React || !window.ReactDOM) return;

  const { createElement: h, useEffect, useMemo, useReducer } = window.React;

  const initialSnapshot = {
    products: [],
    categories: [],
    cart: { items: [], subtotal: 0, item_count: 0 },
    totalProducts: 0,
    wishlistCount: 0,
    user: null,
    viewMode: 'grid',
  };

  function reducer(current, action) {
    if (action.type === 'SYNC') return { ...current, ...action.snapshot, reason: action.reason };
    return current;
  }

  function formatMoney(value) {
    return `$${Number(value || 0).toFixed(2)}`;
  }

  function categoryBreakdown(products) {
    return products.reduce((acc, product) => {
      const key = displayCategoryName(product.category_name || 'Books');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function ReactAssignmentDashboard() {
    const [snapshot, dispatch] = useReducer(reducer, initialSnapshot);

    useEffect(() => {
      const sync = event => {
        dispatch({
          type: 'SYNC',
          reason: event.detail?.reason || 'state',
          snapshot: event.detail?.snapshot || window.InkboundApp?.getSnapshot?.() || initialSnapshot,
        });
      };
      window.addEventListener('inkbound:state', sync);
      dispatch({
        type: 'SYNC',
        reason: 'mount',
        snapshot: window.InkboundApp?.getSnapshot?.() || initialSnapshot,
      });
      return () => window.removeEventListener('inkbound:state', sync);
    }, []);

    const products = snapshot.products || [];
    const categories = snapshot.categories || [];
    const stats = useMemo(() => {
      const genreCount = new Set(products.map(product => product.genre_name).filter(Boolean)).size;
      const starterShelf = products.filter(product => Number(product.goodreads_rating || 0) >= 4.2).length;
      const averageRating = products.length
        ? products.reduce((sum, product) => sum + Number(product.goodreads_rating || 0), 0) / products.length
        : 0;
      const categoryMix = categoryBreakdown(products);
      const leadingCategory = Object.entries(categoryMix).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Curated';
      return { genreCount, starterShelf, averageRating, leadingCategory };
    }, [products]);

    const topBooks = useMemo(() => (
      [...products]
        .sort((a, b) => Number(b.goodreads_rating || 0) - Number(a.goodreads_rating || 0))
        .slice(0, 3)
    ), [products]);

    const cart = snapshot.cart || initialSnapshot.cart;
    const isAdmin = snapshot.user?.role === 'admin';

    return h('div', { className: 'react-dashboard-inner' },
      h('div', { className: 'react-dashboard-copy' },
        h('span', { className: 'react-eyebrow' }, 'React intelligence layer'),
        h('h2', null, 'Live store pulse'),
        h('p', null, 'This panel is rendered with React 18 using useReducer, useMemo, and effect-driven synchronization with the bookstore SPA.')
      ),
      h('div', { className: 'react-metric-grid' },
        h('button', {
          className: 'react-metric-card',
          type: 'button',
          onClick: () => window.InkboundApp?.setViewMode?.('spotlight'),
        }, h('span', null, 'Catalog'), h('strong', null, snapshot.totalProducts || products.length || 500), h('em', null, `${categories.length || 4} departments`)),
        h('button', {
          className: 'react-metric-card',
          type: 'button',
          onClick: () => window.InkboundApp?.openCheckout?.(),
        }, h('span', null, 'Cart'), h('strong', null, cart.item_count || 0), h('em', null, formatMoney(cart.subtotal))),
        h('button', {
          className: 'react-metric-card',
          type: 'button',
          onClick: () => window.InkboundApp?.setViewMode?.('shelf'),
        }, h('span', null, 'Genres'), h('strong', null, stats.genreCount || 24), h('em', null, `${stats.starterShelf} rated 4.2+`)),
        h('button', {
          className: 'react-metric-card',
          type: 'button',
          onClick: () => isAdmin ? window.InkboundApp?.openAdminPanel?.() : window.InkboundApp?.openWishlist?.(),
        }, h('span', null, isAdmin ? 'Admin' : 'Wishlist'), h('strong', null, isAdmin ? 'Open' : snapshot.wishlistCount || 0), h('em', null, isAdmin ? 'control room' : 'saved titles'))
      ),
      h('div', { className: 'react-picks' },
        h('div', null,
          h('span', { className: 'react-eyebrow' }, 'Top signal'),
          h('strong', null, stats.leadingCategory),
          h('small', null, `${stats.averageRating.toFixed(2)} avg rating in current view`)
        ),
        h('div', { className: 'react-mini-covers' },
          topBooks.map(book => h('button', {
            key: book.id,
            type: 'button',
            title: book.title,
            onClick: () => window.InkboundApp?.openBook?.(book.id),
          }, h('img', {
            src: cleanImageUrl(book.image_url),
            alt: book.title,
            onError: event => { event.currentTarget.src = 'images/placeholder.svg'; },
          })))
        )
      )
    );
  }

  window.ReactDOM.createRoot(rootEl).render(h(ReactAssignmentDashboard));
})();
