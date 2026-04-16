import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getMissingPostHogClientEnvVars,
  getMissingPostHogQueryEnvVars,
  isPostHogClientConfigured,
  isPostHogQueryConfigured,
  POSTHOG_EVENTS,
} from "@/lib/posthog/config";
import { runPostHogQuery } from "@/lib/posthog/server";

function toNumber(value) {
  return Number(value || 0);
}

function ratio(part, whole) {
  if (!whole) return 0;
  return Number(((part / whole) * 100).toFixed(1));
}

function emptyPostHogSummary({ missingEnv = [], issue = "" } = {}) {
  return {
    analyticsEnabled: false,
    analyticsIssue:
      issue ||
      (missingEnv.length
        ? `Missing deployment env: ${missingEnv.join(", ")}`
        : ""),
    analyticsMissingEnv: missingEnv,
    summary: {
      visitors30d: 0,
      pageviews30d: 0,
      logins30d: 0,
      productViews30d: 0,
      addToCarts30d: 0,
      ordersPlaced30d: 0,
      activeUsers30d: 0,
      conversionRate: 0,
      cartToOrderRate: 0,
    },
    trend: [],
    topProducts: [],
    topSearches: [],
    activeUsers: [],
  };
}

async function getDatabaseSummary() {
  const [orders, stores, products, allOrders] = await Promise.all([
    prisma.order.count(),
    prisma.store.count(),
    prisma.product.count(),
    prisma.order.findMany({
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const revenue = allOrders.reduce((acc, order) => acc + order.total, 0);

  return {
    orders,
    stores,
    products,
    revenue: Number(revenue.toFixed(2)),
    allOrders,
  };
}

async function getPostHogSummary() {
  if (!isPostHogQueryConfigured()) {
    return emptyPostHogSummary({
      missingEnv: getMissingPostHogQueryEnvVars(),
    });
  }

  try {
    const summaryQuery = `
    SELECT
      countIf(event = '$pageview') AS pageviews_30d,
      uniqIf(distinct_id, event = '$pageview') AS visitors_30d,
      countIf(event = '${POSTHOG_EVENTS.USER_LOGGED_IN}') AS logins_30d,
      countIf(event = '${POSTHOG_EVENTS.PRODUCT_VIEWED}') AS product_views_30d,
      countIf(event IN ('${POSTHOG_EVENTS.ADD_TO_CART_CLICKED}', '${POSTHOG_EVENTS.CART_QUANTITY_INCREASED}')) AS add_to_carts_30d,
      countIf(event = '${POSTHOG_EVENTS.ORDER_PLACED}') AS orders_placed_30d,
      uniqIf(properties.user_id, properties.user_id != '') AS active_users_30d
    FROM events
    WHERE timestamp >= now() - INTERVAL 30 DAY
  `;

    const trendQuery = `
    SELECT
      toDate(timestamp) AS date,
      countIf(event = '$pageview') AS pageviews,
      countIf(event = '${POSTHOG_EVENTS.PRODUCT_VIEWED}') AS product_views,
      countIf(event IN ('${POSTHOG_EVENTS.ADD_TO_CART_CLICKED}', '${POSTHOG_EVENTS.CART_QUANTITY_INCREASED}')) AS add_to_carts,
      countIf(event = '${POSTHOG_EVENTS.ORDER_PLACED}') AS orders,
      countIf(event = '${POSTHOG_EVENTS.USER_LOGGED_IN}') AS logins
    FROM events
    WHERE timestamp >= now() - INTERVAL 14 DAY
    GROUP BY date
    ORDER BY date ASC
  `;

    const topProductsQuery = `
    SELECT
      properties.product_name AS product_name,
      any(properties.product_id) AS product_id,
      countIf(event = '${POSTHOG_EVENTS.PRODUCT_VIEWED}') AS views,
      countIf(event IN ('${POSTHOG_EVENTS.ADD_TO_CART_CLICKED}', '${POSTHOG_EVENTS.CART_QUANTITY_INCREASED}')) AS carts,
      countIf(event = '${POSTHOG_EVENTS.PRODUCT_ORDERED}') AS orders
    FROM events
    WHERE timestamp >= now() - INTERVAL 30 DAY
      AND properties.product_name IS NOT NULL
      AND properties.product_name != ''
    GROUP BY product_name
    HAVING views > 0 OR carts > 0 OR orders > 0
    ORDER BY orders DESC, carts DESC, views DESC
    LIMIT 8
  `;

    const topSearchesQuery = `
    SELECT
      properties.query AS query,
      count() AS searches
    FROM events
    WHERE timestamp >= now() - INTERVAL 30 DAY
      AND event = '${POSTHOG_EVENTS.SEARCH_SUBMITTED}'
      AND properties.query IS NOT NULL
      AND properties.query != ''
    GROUP BY query
    ORDER BY searches DESC
    LIMIT 8
  `;

    const activeUsersQuery = `
    SELECT
      coalesce(nullIf(properties.user_name, ''), nullIf(properties.user_email, ''), properties.user_id) AS user_label,
      properties.user_email AS email,
      properties.user_id AS user_id,
      countIf(event = '${POSTHOG_EVENTS.PRODUCT_VIEWED}') AS views,
      countIf(event IN ('${POSTHOG_EVENTS.ADD_TO_CART_CLICKED}', '${POSTHOG_EVENTS.CART_QUANTITY_INCREASED}')) AS carts,
      countIf(event = '${POSTHOG_EVENTS.PRODUCT_ORDERED}') AS orders,
      max(timestamp) AS last_seen
    FROM events
    WHERE timestamp >= now() - INTERVAL 30 DAY
      AND properties.user_id IS NOT NULL
      AND properties.user_id != ''
    GROUP BY user_label, email, user_id
    ORDER BY orders DESC, carts DESC, views DESC, last_seen DESC
    LIMIT 10
  `;

    const [
      summaryRows,
      trendRows,
      topProductsRows,
      topSearchRows,
      activeUserRows,
    ] = await Promise.all([
      runPostHogQuery(summaryQuery, "admin dashboard summary"),
      runPostHogQuery(trendQuery, "admin dashboard trends"),
      runPostHogQuery(topProductsQuery, "admin dashboard top products"),
      runPostHogQuery(topSearchesQuery, "admin dashboard top searches"),
      runPostHogQuery(activeUsersQuery, "admin dashboard active users"),
    ]);

    const summaryRow = summaryRows[0] || {};
    const pageviews30d = toNumber(summaryRow.pageviews_30d);
    const visitors30d = toNumber(summaryRow.visitors_30d);
    const logins30d = toNumber(summaryRow.logins_30d);
    const productViews30d = toNumber(summaryRow.product_views_30d);
    const addToCarts30d = toNumber(summaryRow.add_to_carts_30d);
    const ordersPlaced30d = toNumber(summaryRow.orders_placed_30d);
    const activeUsers30d = toNumber(summaryRow.active_users_30d);

    return {
      analyticsEnabled: true,
      analyticsIssue: "",
      analyticsMissingEnv: [],
      summary: {
        visitors30d,
        pageviews30d,
        logins30d,
        productViews30d,
        addToCarts30d,
        ordersPlaced30d,
        activeUsers30d,
        conversionRate: ratio(ordersPlaced30d, productViews30d),
        cartToOrderRate: ratio(ordersPlaced30d, addToCarts30d),
      },
      trend: trendRows.map((row) => ({
        date: row.date,
        pageviews: toNumber(row.pageviews),
        productViews: toNumber(row.product_views),
        addToCarts: toNumber(row.add_to_carts),
        orders: toNumber(row.orders),
        logins: toNumber(row.logins),
      })),
      topProducts: topProductsRows.map((row) => ({
        productName: row.product_name,
        productId: row.product_id,
        views: toNumber(row.views),
        carts: toNumber(row.carts),
        orders: toNumber(row.orders),
        conversionRate: ratio(toNumber(row.orders), toNumber(row.views)),
      })),
      topSearches: topSearchRows.map((row) => ({
        query: row.query,
        searches: toNumber(row.searches),
      })),
      activeUsers: activeUserRows.map((row) => ({
        label: row.user_label,
        email: row.email,
        userId: row.user_id,
        views: toNumber(row.views),
        carts: toNumber(row.carts),
        orders: toNumber(row.orders),
        lastSeen: row.last_seen,
      })),
    };
  } catch (error) {
    console.error("POSTHOG_DASHBOARD_ERROR", error);
    return emptyPostHogSummary({
      issue:
        "PostHog query failed. Check POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID, and POSTHOG_APP_HOST in deployment env.",
    });
  }
}

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const [databaseSummary, posthogSummary] = await Promise.all([
      getDatabaseSummary(),
      getPostHogSummary(),
    ]);

    return NextResponse.json({
      dashboardData: {
        ...databaseSummary,
        trackingEnabled: isPostHogClientConfigured(),
        trackingIssue: isPostHogClientConfigured()
          ? ""
          : "Browser tracking is disabled. Add NEXT_PUBLIC_POSTHOG_KEY to deployment env and redeploy.",
        trackingMissingEnv: getMissingPostHogClientEnvVars(),
        analyticsEnabled: posthogSummary.analyticsEnabled,
        analyticsIssue: posthogSummary.analyticsIssue,
        analyticsMissingEnv: posthogSummary.analyticsMissingEnv,
        analyticsSummary: posthogSummary.summary,
        engagementTrend: posthogSummary.trend,
        topProducts: posthogSummary.topProducts,
        topSearches: posthogSummary.topSearches,
        activeUsers: posthogSummary.activeUsers,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}
