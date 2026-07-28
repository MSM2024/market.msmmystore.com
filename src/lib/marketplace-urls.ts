const MARKETPLACE_ORIGIN = "https://marketplace.msmmystore.com";

interface MarketplaceUrlParams {
  destination?: string;
  slug?: string;
  pathname?: string;
  searchParams?: Record<string, string>;
  productId?: string;
  storeSlug?: string;
  category?: string;
  query?: string;
  campaign?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  returnTo?: string;
}

const ALLOWED_MARKETPLACE_PATHS = [
  "/",
  "/productos",
  "/tiendas",
  "/pedidos",
  "/crear-tienda",
  "/vender",
  "/vender/crear-producto",
  "/proveedores",
];

function isAllowedPath(path: string): boolean {
  return ALLOWED_MARKETPLACE_PATHS.some(p => path === p || path.startsWith(p + "/"));
}

export function getMarketplaceUrl(params: MarketplaceUrlParams = {}): string {
  const {
    destination,
    slug,
    pathname,
    searchParams = {},
    productId,
    storeSlug,
    category,
    query,
    campaign,
    utmSource,
    utmMedium,
    utmCampaign,
    returnTo,
  } = params;

  let path = pathname || destination || "/";

  if (storeSlug) path = `/tiendas/${storeSlug}`;
  else if (productId) path = `/productos/${productId}`;
  else if (destination === "store" && slug) path = `/tiendas/${slug}`;
  else if (destination === "product" && slug) path = `/productos/${slug}`;
  else if (destination === "stores") path = "/tiendas";
  else if (destination === "products") path = "/productos";
  else if (destination === "orders") path = "/pedidos";
  else if (destination === "create-store") path = "/crear-tienda";
  else if (destination === "sell") path = "/vender";
  else if (destination === "create-product") path = "/vender/crear-producto";
  else if (destination === "profile" && slug) path = `/tiendas/${slug}`;

  if (!path.startsWith("/")) path = "/" + path;

  const params_obj = new URLSearchParams();

  if (category) params_obj.set("category", category);
  if (query) params_obj.set("q", query);
  if (campaign) params_obj.set("campaign", campaign);
  if (returnTo) params_obj.set("return", returnTo);
  for (const [k, v] of Object.entries(searchParams)) {
    if (v) params_obj.set(k, v);
  }
  if (utmSource) params_obj.set("utm_source", utmSource);
  if (utmMedium) params_obj.set("utm_medium", utmMedium);
  if (utmCampaign) params_obj.set("utm_campaign", utmCampaign);

  const qs = params_obj.toString();
  return `${MARKETPLACE_ORIGIN}${path}${qs ? "?" + qs : ""}`;
}

export function getMarketplaceStoreUrl(storeSlug: string): string {
  return `${MARKETPLACE_ORIGIN}/tiendas/${encodeURIComponent(storeSlug)}`;
}

export function getMarketplaceProductUrl(productSlug: string): string {
  return `${MARKETPLACE_ORIGIN}/productos/${encodeURIComponent(productSlug)}`;
}

export function getMarketplaceCreateStoreUrl(): string {
  return `${MARKETPLACE_ORIGIN}/crear-tienda`;
}

export function getMarketplaceCreateProductUrl(): string {
  return `${MARKETPLACE_ORIGIN}/vender/crear-producto`;
}

export function isMarketplaceUrl(url: string): boolean {
  try {
    return new URL(url).origin === MARKETPLACE_ORIGIN;
  } catch {
    return false;
  }
}

export { MARKETPLACE_ORIGIN };
