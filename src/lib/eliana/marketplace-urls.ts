const MARKETPLACE_BASE = 'https://marketplace.msmmystore.com';

interface MarketplaceUrlOptions {
  destination?: string;    // e.g. 'products', 'stores', 'orders', 'cart', 'checkout', 'seller'
  slug?: string;           // e.g. product slug, store slug
  pathname?: string;       // arbitrary path
  searchParams?: Record<string, string>;  // query params to preserve (utm_*, id, category, q, returnTo)
  returnTo?: string;       // where to come back after SSO
  productId?: string;
  storeSlug?: string;
  category?: string;
  query?: string;
}

// Canonical route mapping - maps logical destinations to real marketplace routes
const DESTINATION_ROUTES: Record<string, string> = {
  '': '/',
  'home': '/',
  'products': '/products',
  'productos': '/products',
  'stores': '/tiendas-vip',
  'tiendas': '/tiendas-vip',
  'store': '/vendedores',  // will append /{slug}
  'orders': '/orders',
  'pedidos': '/orders',
  'cart': '/cart',
  'carrito': '/cart',
  'checkout': '/checkout',
  'seller': '/dashboard',
  'vender': '/dashboard',
  'dashboard': '/dashboard',
  'profile': '/account',
  'perfil': '/account',
  'wallet': '/wallet',
  'billetera': '/wallet',
  'wishlist': '/wishlist',
  'reviews': '/reviews/new',
  'remittances': '/remittances',
  'login': '/auth/login',
  'signup': '/auth/signup',
  'register': '/auth/signup',
  'recover': '/auth/forgot-password',
};

export function getMarketplaceUrl(options: MarketplaceUrlOptions = {}): string {
  const url = new URL(MARKETPLACE_BASE);

  // Determine the path
  let path = '/';

  if (options.pathname) {
    path = options.pathname;
  } else if (options.destination && DESTINATION_ROUTES[options.destination] !== undefined) {
    path = DESTINATION_ROUTES[options.destination];
    // Append slug for store/product routes
    if (options.slug && (options.destination === 'store' || options.destination === 'products')) {
      path = `${path}/${options.slug}`;
    }
  }

  // Handle direct store access
  if (options.storeSlug && !options.slug) {
    path = `/vendedores/${options.storeSlug}`;
  }

  url.pathname = path;

  // Preserve search parameters
  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      url.searchParams.set(key, value);
    }
  }

  // Standard preserved params
  if (options.productId) url.searchParams.set('id', options.productId);
  if (options.category) url.searchParams.set('category', options.category);
  if (options.query) url.searchParams.set('q', options.query);
  if (options.returnTo) url.searchParams.set('returnTo', options.returnTo);

  return url.toString();
}

// Get the marketplace URL for a user's profile based on their role
export function getMarketplaceProfileUrl(user: {
  role?: string;
  storeSlug?: string;
  username?: string;
}): string {
  if (user.role === 'vendedor_vip' || user.role === 'vendor' || user.storeSlug) {
    return getMarketplaceUrl({ destination: 'store', slug: user.storeSlug || user.username });
  }
  return getMarketplaceUrl({ destination: 'profile' });
}

// Generate an SSO redirect URL through accounts.msmmystore.com
export function getSSORedirectUrl(targetUrl: string, originApp: string = 'eliana'): string {
  const accountsBase = 'https://accounts.msmmystore.com';
  const params = new URLSearchParams({
    target: targetUrl,
    origin: originApp,
  });
  return `${accountsBase}/sso?${params.toString()}`;
}

// Build a marketplace CTA URL that handles auth state
export function getMarketplaceCTA(user: {
  isAuthenticated: boolean;
  role?: string;
  storeSlug?: string;
  username?: string;
}, destination?: string, slug?: string): string {
  if (!user.isAuthenticated) {
    // Not logged in: go to marketplace homepage (or login if specific destination)
    if (destination === 'seller' || destination === 'dashboard') {
      return getSSORedirectUrl(
        getMarketplaceUrl({ destination, slug }),
        'eliana'
      );
    }
    return getMarketplaceUrl({ destination: destination || 'home' });
  }

  // Authenticated: go to specific profile or destination
  if (destination === 'seller' || destination === 'dashboard' || destination === 'profile') {
    return getMarketplaceProfileUrl(user);
  }

  return getMarketplaceUrl({ destination, slug });
}
