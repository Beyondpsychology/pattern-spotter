const ORDER_STATUS = "completed";

function getConfig() {
  const apiUrl = process.env.WOOCOMMERCE_API_URL;
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
  if (!apiUrl || !consumerKey || !consumerSecret) return null;
  return { apiUrl: apiUrl.replace(/\/+$/, ""), consumerKey, consumerSecret };
}

/**
 * Creates a paid, completed order in WooCommerce for a Pattern Spotter
 * purchase, purely so it shows up in the WordPress/WooCommerce dashboard
 * alongside her other sales - no payment actually runs through WooCommerce,
 * the real charge already happened via Stripe. `set_paid: true` marks it
 * paid immediately; WooCommerce may still fire its own order-status emails
 * depending on the site's plugins/theme, which isn't something the REST API
 * can fully guarantee off - if a duplicate customer email shows up, that's
 * a WooCommerce-side notification setting to turn off, not something this
 * function controls. Never throws: a failure here should never block the
 * purchase flow.
 */
export async function createWooCommerceOrder(
  email: string,
  name: string,
  credits: number,
  priceEuros: number
): Promise<void> {
  const config = getConfig();
  if (!config) {
    console.error("WooCommerce order sync skipped: missing env vars");
    return;
  }

  try {
    const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString(
      "base64"
    );

    const res = await fetch(`${config.apiUrl}/wp-json/wc/v3/orders`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: ORDER_STATUS,
        set_paid: true,
        payment_method: "stripe",
        payment_method_title: "Stripe (Pattern Spotter)",
        billing: {
          email,
          first_name: name || undefined,
        },
        line_items: [
          {
            name: `The Pattern Spotter — ${credits} Reading${credits === 1 ? "" : "s"}`,
            quantity: 1,
            total: priceEuros.toFixed(2),
            subtotal: priceEuros.toFixed(2),
          },
        ],
        meta_data: [{ key: "source", value: "pattern-spotter" }],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("WooCommerce order creation failed", res.status, text);
    }
  } catch (err) {
    console.error("WooCommerce order sync failed", err);
  }
}
