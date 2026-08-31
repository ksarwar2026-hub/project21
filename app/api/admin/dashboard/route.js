import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { clerkClient, getAuth } from "@clerk/nextjs/server";
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

function buildFunnelStage({ key, label, count, previousCount, firstCount }) {
  const numericCount = toNumber(count);

  return {
    key,
    label,
    count: numericCount,
    hasData: numericCount > 0,
    previousRate:
      previousCount > 0 && numericCount > 0 ? ratio(numericCount, previousCount) : null,
    overallRate:
      firstCount > 0 && numericCount > 0 ? ratio(numericCount, firstCount) : null,
  };
}

function getBiggestDropoff(stages = []) {
  const dropoffs = [];

  for (let index = 1; index < stages.length; index += 1) {
    const previous = stages[index - 1];
    const current = stages[index];

    if (!previous?.hasData || !current?.hasData || previous.count <= 0) {
      continue;
    }

    dropoffs.push({
      from: previous.label,
      to: current.label,
      dropoffRate: Math.max(0, Number((((previous.count - current.count) / previous.count) * 100).toFixed(1))),
    });
  }

  return dropoffs.sort((a, b) => b.dropoffRate - a.dropoffRate)[0] || null;
}

function buildCheckoutFunnel(row = {}, sessionRows = []) {
  const addToCart = toNumber(row.add_to_cart);
  const cartViewed = toNumber(row.cart_viewed);
  const checkoutStarted = toNumber(row.checkout_started);
  const addressStarted = toNumber(row.address_started);
  const addressCompleted = toNumber(row.address_completed);
  const orderCompleted = toNumber(row.order_completed);

  const coreStages = [
    buildFunnelStage({
      key: "add_to_cart",
      label: "Add To Cart",
      count: addToCart,
      previousCount: null,
      firstCount: addToCart,
    }),
    buildFunnelStage({
      key: "cart_viewed",
      label: "Cart Viewed",
      count: cartViewed,
      previousCount: addToCart,
      firstCount: addToCart,
    }),
    buildFunnelStage({
      key: "checkout_started",
      label: "Checkout Started",
      count: checkoutStarted,
      previousCount: cartViewed,
      firstCount: addToCart,
    }),
    buildFunnelStage({
      key: "address_started",
      label: "Address Started",
      count: addressStarted,
      previousCount: checkoutStarted,
      firstCount: addToCart,
    }),
    buildFunnelStage({
      key: "address_completed",
      label: "Address Completed",
      count: addressCompleted,
      previousCount: addressStarted,
      firstCount: addToCart,
    }),
    buildFunnelStage({
      key: "order_completed",
      label: "Order Completed",
      count: orderCompleted,
      previousCount: addressCompleted,
      firstCount: addToCart,
    }),
  ];

  const guestCheckoutUsers = toNumber(row.guest_checkout_users);
  const loginPromptShown = toNumber(row.login_prompt_shown);
  const loginStarted = toNumber(row.login_started);
  const loginCompleted = toNumber(row.login_completed);
  const orderAfterLogin = sessionRows.filter(
    (session) => toNumber(session.login_completed) > 0 && toNumber(session.order_completed) > 0
  ).length;
  const hasSessionData = sessionRows.length > 0;

  const authStages = [
    buildFunnelStage({
      key: "guest_checkout_users",
      label: "Guest Checkout Users",
      count: guestCheckoutUsers,
      previousCount: null,
      firstCount: guestCheckoutUsers,
    }),
    buildFunnelStage({
      key: "login_prompt_shown",
      label: "Login Prompt Shown",
      count: loginPromptShown,
      previousCount: guestCheckoutUsers,
      firstCount: guestCheckoutUsers,
    }),
    buildFunnelStage({
      key: "login_started",
      label: "Login Started",
      count: loginStarted,
      previousCount: loginPromptShown,
      firstCount: guestCheckoutUsers,
    }),
    buildFunnelStage({
      key: "login_completed",
      label: "Login Completed",
      count: loginCompleted,
      previousCount: loginStarted,
      firstCount: guestCheckoutUsers,
    }),
    buildFunnelStage({
      key: "orders_after_login",
      label: "Orders After Login",
      count: orderAfterLogin,
      previousCount: loginCompleted,
      firstCount: guestCheckoutUsers,
    }),
  ];

  return {
    periodLabel: "Last 30 days",
    historicalNote:
      "Checkout funnel tracking started recently; historical data before these events were added may be incomplete.",
    coreStages,
    authStages,
    biggestDropoff: getBiggestDropoff(coreStages),
    authDropoff: getBiggestDropoff(authStages),
    orderAfterLoginAvailable: hasSessionData,
    orderAfterLoginNote:
      hasSessionData
        ? "Orders after login are matched by anonymous checkout_session_id. This is accurate for new checkout events only."
        : "Orders after login prompt need new checkout_session_id event data before they can be measured accurately.",
  };
}

function emptyCustomerSummary() {
  return {
    totalSignedUpCustomers: 0,
    totalDbCustomers: 0,
    customersWithOrders: 0,
    customersWithoutOrders: 0,
    customersWithAddresses: 0,
    guestVisitors30d: 0,
    loggedInVisitors30d: 0,
    guestCheckoutUsers30d: 0,
    customerList: [],
    sourceNote:
      "Signed-up customers come from Clerk. Order/address totals come from the database. Guest activity comes from PostHog.",
  };
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
    checkoutFunnel: buildCheckoutFunnel(),
    customerAudience: {
      guestVisitors30d: 0,
      loggedInVisitors30d: 0,
      guestCheckoutUsers30d: 0,
    },
  };
}

async function getDatabaseSummary() {
  const [orders, stores, products, allOrders, totalDbCustomers, customersWithAddresses] = await Promise.all([
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
    prisma.user.count(),
    prisma.address.groupBy({
      by: ["userId"],
    }),
  ]);

  const revenue = allOrders.reduce((acc, order) => acc + order.total, 0);

  return {
    orders,
    stores,
    products,
    revenue: Number(revenue.toFixed(2)),
    allOrders,
    totalDbCustomers,
    customersWithAddresses: customersWithAddresses.length,
  };
}

async function getCustomerSummary() {
  const [
    totalDbCustomers,
    customersWithOrders,
    customersWithAddresses,
    dbCustomers,
    customerOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.groupBy({ by: ["userId"] }),
    prisma.address.groupBy({ by: ["userId"] }),
    prisma.user.findMany({
      take: 100,
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        cart: true,
        Address: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            phone: true,
            city: true,
            state: true,
            country: true,
          },
        },
      },
    }),
    prisma.order.findMany({
      select: {
        id: true,
        userId: true,
        createdAt: true,
        total: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const ordersByUser = customerOrders.reduce((acc, order) => {
    const current = acc.get(order.userId) || {
      orderCount: 0,
      totalSpent: 0,
      lastOrderAt: null,
    };

    current.orderCount += 1;
    current.totalSpent += Number(order.total || 0);
    current.lastOrderAt =
      !current.lastOrderAt || new Date(order.createdAt) > new Date(current.lastOrderAt)
        ? order.createdAt
        : current.lastOrderAt;
    acc.set(order.userId, current);
    return acc;
  }, new Map());

  let totalSignedUpCustomers = 0;
  let clerkUserList = [];
  let clerkUsersById = new Map();

  try {
    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({
      limit: 100,
      orderBy: "-created_at",
    });
    clerkUserList = Array.isArray(clerkUsers?.data) ? clerkUsers.data : [];
    totalSignedUpCustomers = Number(clerkUsers?.totalCount || clerkUserList.length || 0);
    clerkUsersById = clerkUserList.reduce((acc, user) => {
      acc.set(user.id, user);
      return acc;
    }, new Map());
  } catch (error) {
    console.error("CLERK_CUSTOMER_SUMMARY_ERROR", error);
  }

  const dbCustomersById = dbCustomers.reduce((acc, customer) => {
    acc.set(customer.id, customer);
    return acc;
  }, new Map());

  const toCustomerRow = (customerId, clerkUser = null, dbCustomer = null) => {
    const firstAddress = dbCustomer?.Address?.[0] || {};
    const orders = ordersByUser.get(customerId) || {
      orderCount: 0,
      totalSpent: 0,
      lastOrderAt: null,
    };
    const cartItems =
      dbCustomer?.cart && typeof dbCustomer.cart === "object" && !Array.isArray(dbCustomer.cart)
        ? Object.values(dbCustomer.cart).reduce((acc, quantity) => acc + Number(quantity || 0), 0)
        : 0;

    return {
      id: customerId,
      name: clerkUser?.fullName || clerkUser?.username || dbCustomer?.name || "Customer",
      email: clerkUser?.primaryEmailAddress?.emailAddress || dbCustomer?.email || "",
      phone: clerkUser?.primaryPhoneNumber?.phoneNumber || firstAddress.phone || "",
      image: clerkUser?.imageUrl || dbCustomer?.image || "",
      city: firstAddress.city || "",
      state: firstAddress.state || "",
      country: firstAddress.country || "",
      orderCount: orders.orderCount,
      totalSpent: Number(orders.totalSpent.toFixed(2)),
      lastOrderAt: orders.lastOrderAt,
      cartItems,
      source: clerkUser && dbCustomer ? "Clerk + DB" : clerkUser ? "Clerk" : "DB",
    };
  };

  const clerkRows = clerkUserList.map((clerkUser) =>
    toCustomerRow(clerkUser.id, clerkUser, dbCustomersById.get(clerkUser.id) || null)
  );
  const dbOnlyRows = dbCustomers
    .filter((customer) => !clerkUsersById.has(customer.id))
    .map((customer) => toCustomerRow(customer.id, null, customer));

  const customerList = [...clerkRows, ...dbOnlyRows].slice(0, 12);

  return {
    ...emptyCustomerSummary(),
    totalSignedUpCustomers,
    totalDbCustomers,
    customersWithOrders: customersWithOrders.length,
    customersWithoutOrders: Math.max(totalDbCustomers - customersWithOrders.length, 0),
    customersWithAddresses: customersWithAddresses.length,
    customerList,
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

    const checkoutFunnelQuery = `
    SELECT
      countIf(event IN ('${POSTHOG_EVENTS.ADD_TO_CART_CLICKED}', '${POSTHOG_EVENTS.CART_QUANTITY_INCREASED}')) AS add_to_cart,
      countIf(event = '${POSTHOG_EVENTS.VIEW_CART}') AS cart_viewed,
      countIf(event = '${POSTHOG_EVENTS.BEGIN_CHECKOUT}') AS checkout_started,
      countIf(event = '${POSTHOG_EVENTS.ADDRESS_STARTED}') AS address_started,
      countIf(event = '${POSTHOG_EVENTS.ADDRESS_COMPLETED}') AS address_completed,
      countIf(event = '${POSTHOG_EVENTS.CHECKOUT_COMPLETED}') AS order_completed,
      uniqIf(distinct_id, event = '${POSTHOG_EVENTS.BEGIN_CHECKOUT}' AND properties.is_logged_in = false) AS guest_checkout_users,
      countIf(event = '${POSTHOG_EVENTS.LOGIN_PROMPT_SHOWN}') AS login_prompt_shown,
      countIf(event = '${POSTHOG_EVENTS.LOGIN_STARTED}') AS login_started,
      countIf(event = '${POSTHOG_EVENTS.LOGIN_COMPLETED}') AS login_completed
    FROM events
    WHERE timestamp >= now() - INTERVAL 30 DAY
  `;

    const checkoutSessionQuery = `
    SELECT
      properties.checkout_session_id AS checkout_session_id,
      countIf(event = '${POSTHOG_EVENTS.LOGIN_PROMPT_SHOWN}') AS login_prompt_shown,
      countIf(event = '${POSTHOG_EVENTS.LOGIN_COMPLETED}') AS login_completed,
      countIf(event = '${POSTHOG_EVENTS.CHECKOUT_COMPLETED}') AS order_completed
    FROM events
    WHERE timestamp >= now() - INTERVAL 30 DAY
      AND properties.checkout_session_id IS NOT NULL
      AND properties.checkout_session_id != ''
    GROUP BY checkout_session_id
  `;

    const customerAudienceQuery = `
    SELECT
      uniqIf(distinct_id, event = '$pageview' AND (properties.user_id IS NULL OR properties.user_id = '')) AS guest_visitors_30d,
      uniqIf(distinct_id, event = '$pageview' AND properties.user_id != '') AS logged_in_visitors_30d,
      uniqIf(distinct_id, event = '${POSTHOG_EVENTS.BEGIN_CHECKOUT}' AND properties.is_logged_in = false) AS guest_checkout_users_30d
    FROM events
    WHERE timestamp >= now() - INTERVAL 30 DAY
  `;

    const [
      summaryRows,
      trendRows,
      topProductsRows,
      topSearchRows,
      activeUserRows,
      checkoutFunnelRows,
      checkoutSessionRows,
      customerAudienceRows,
    ] = await Promise.all([
      runPostHogQuery(summaryQuery, "admin dashboard summary"),
      runPostHogQuery(trendQuery, "admin dashboard trends"),
      runPostHogQuery(topProductsQuery, "admin dashboard top products"),
      runPostHogQuery(topSearchesQuery, "admin dashboard top searches"),
      runPostHogQuery(activeUsersQuery, "admin dashboard active users"),
      runPostHogQuery(checkoutFunnelQuery, "admin dashboard checkout funnel"),
      runPostHogQuery(checkoutSessionQuery, "admin dashboard checkout sessions"),
      runPostHogQuery(customerAudienceQuery, "admin dashboard customer audience"),
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
      checkoutFunnel: buildCheckoutFunnel(checkoutFunnelRows[0] || {}, checkoutSessionRows),
      customerAudience: {
        guestVisitors30d: toNumber(customerAudienceRows[0]?.guest_visitors_30d),
        loggedInVisitors30d: toNumber(customerAudienceRows[0]?.logged_in_visitors_30d),
        guestCheckoutUsers30d: toNumber(customerAudienceRows[0]?.guest_checkout_users_30d),
      },
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

    const [databaseSummary, posthogSummary, customerSummary] = await Promise.all([
      getDatabaseSummary(),
      getPostHogSummary(),
      getCustomerSummary(),
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
        checkoutFunnel: posthogSummary.checkoutFunnel,
        customerSummary: {
          ...customerSummary,
          guestVisitors30d: posthogSummary.customerAudience.guestVisitors30d,
          loggedInVisitors30d: posthogSummary.customerAudience.loggedInVisitors30d,
          guestCheckoutUsers30d: posthogSummary.customerAudience.guestCheckoutUsers30d,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}
