'use client'

import Loading from "@/components/Loading";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import {
  Activity,
  BadgePercent,
  CircleDollarSignIcon,
  Search,
  ShoppingBasketIcon,
  ShoppingCart,
  StoreIcon,
  TagsIcon,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const formatCompact = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 1,
  });

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

const StatCard = ({ title, value, icon: Icon, accent = "emerald", helper }) => {
  const styles = {
    emerald: "from-emerald-50 to-white text-emerald-700",
    amber: "from-amber-50 to-white text-amber-700",
    sky: "from-sky-50 to-white text-sky-700",
    rose: "from-rose-50 to-white text-rose-700",
    slate: "from-slate-100 to-white text-slate-700",
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
          {helper && <p className="mt-2 text-xs text-slate-500">{helper}</p>}
        </div>
        <div className={`rounded-2xl bg-gradient-to-br p-3 ${styles[accent]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

const SectionCard = ({ title, subtitle, children, rightSlot }) => (
  <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {rightSlot}
    </div>
    <div className="mt-6">{children}</div>
  </section>
);

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "Rs";

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    products: 0,
    revenue: 0,
    orders: 0,
    stores: 0,
    trackingEnabled: false,
    trackingIssue: "",
    trackingMissingEnv: [],
    analyticsEnabled: false,
    analyticsIssue: "",
    analyticsMissingEnv: [],
    analyticsSummary: {},
    engagementTrend: [],
    topProducts: [],
    topSearches: [],
    activeUsers: [],
  });

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardData(data.dashboardData);
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const metrics = useMemo(
    () => [
      {
        title: "Total Revenue",
        value: `${currency}${formatCompact(dashboardData.revenue)}`,
        icon: CircleDollarSignIcon,
        accent: "emerald",
        helper: "All-time confirmed order value",
      },
      {
        title: "Total Orders",
        value: formatCompact(dashboardData.orders),
        icon: TagsIcon,
        accent: "amber",
        helper: "Orders stored in your database",
      },
      {
        title: "Total Products",
        value: formatCompact(dashboardData.products),
        icon: ShoppingBasketIcon,
        accent: "sky",
        helper: "Live catalog entries across stores",
      },
      {
        title: "Total Stores",
        value: formatCompact(dashboardData.stores),
        icon: StoreIcon,
        accent: "slate",
        helper: "Approved and pending seller stores",
      },
      {
        title: "Visitors (30d)",
        value: formatCompact(dashboardData.analyticsSummary?.visitors30d),
        icon: Users,
        accent: "sky",
        helper: "Unique people who opened the site",
      },
      {
        title: "Product Views (30d)",
        value: formatCompact(dashboardData.analyticsSummary?.productViews30d),
        icon: Activity,
        accent: "emerald",
        helper: "Tracked visits to product detail pages",
      },
      {
        title: "Add To Cart (30d)",
        value: formatCompact(dashboardData.analyticsSummary?.addToCarts30d),
        icon: ShoppingCart,
        accent: "amber",
        helper: "Explicit cart intent across the store",
      },
      {
        title: "Conversion Rate",
        value: `${dashboardData.analyticsSummary?.conversionRate || 0}%`,
        icon: BadgePercent,
        accent: "rose",
        helper: "Orders divided by product views in the last 30 days",
      },
    ],
    [currency, dashboardData]
  );

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 text-slate-600">
      <div className="rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(135deg,#ffffff,#f8fafc)] p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Admin Analytics</p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Business health, traffic, and engagement</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              See how many people arrive, what they click, which products attract attention,
              and how interest turns into carts and orders.
            </p>
          </div>
          <div className="min-w-[320px] rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm shadow-sm">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Browser Tracking
                </p>
                {dashboardData.trackingEnabled ? (
                  <p className="mt-1 font-medium text-emerald-700">
                    Live storefront events can be captured from the browser.
                  </p>
                ) : (
                  <div className="mt-1 space-y-1">
                    <p className="font-medium text-amber-700">
                      {dashboardData.trackingIssue ||
                        "Browser tracking is waiting for PostHog public env vars."}
                    </p>
                    {dashboardData.trackingMissingEnv?.length > 0 && (
                      <p className="text-xs text-slate-500">
                        Missing: {dashboardData.trackingMissingEnv.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="h-px bg-slate-200" />

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Dashboard Queries
                </p>
                {dashboardData.analyticsEnabled ? (
                  <p className="mt-1 font-medium text-emerald-700">
                    Admin analytics queries are connected and returning PostHog data.
                  </p>
                ) : (
                  <div className="mt-1 space-y-1">
                    <p className="font-medium text-amber-700">
                      {dashboardData.analyticsIssue ||
                        "Traffic reporting will appear here after PostHog server env vars are active."}
                    </p>
                    {dashboardData.analyticsMissingEnv?.length > 0 && (
                      <p className="text-xs text-slate-500">
                        Missing: {dashboardData.analyticsMissingEnv.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((metric) => (
          <StatCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <SectionCard
          title="Engagement Trend"
          subtitle="Last 14 days of pageviews, product views, carts, and completed orders."
          rightSlot={
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              14 day window
            </div>
          }
        >
          <div className="h-[360px] text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.engagementTrend}>
                <defs>
                  <linearGradient id="viewsFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  labelFormatter={formatDate}
                  contentStyle={{
                    borderRadius: 18,
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#ffffff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="productViews"
                  stroke="#0f766e"
                  fill="url(#viewsFill)"
                  strokeWidth={2.2}
                  name="Product views"
                />
                <Line type="monotone" dataKey="addToCarts" stroke="#f59e0b" strokeWidth={2} name="Add to cart" dot={false} />
                <Line type="monotone" dataKey="orders" stroke="#dc2626" strokeWidth={2} name="Orders" dot={false} />
                <Line type="monotone" dataKey="logins" stroke="#2563eb" strokeWidth={1.8} name="Logins" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Funnel Snapshot" subtitle="Quick sense of visitor intent in the last 30 days.">
          <div className="space-y-4">
            {[
              {
                label: "Pageviews",
                value: dashboardData.analyticsSummary?.pageviews30d || 0,
                color: "bg-slate-900",
              },
              {
                label: "Product views",
                value: dashboardData.analyticsSummary?.productViews30d || 0,
                color: "bg-emerald-600",
              },
              {
                label: "Add to cart",
                value: dashboardData.analyticsSummary?.addToCarts30d || 0,
                color: "bg-amber-500",
              },
              {
                label: "Orders placed",
                value: dashboardData.analyticsSummary?.ordersPlaced30d || 0,
                color: "bg-rose-500",
              },
            ].map((step, index, arr) => {
              const max = Math.max(...arr.map((item) => item.value), 1);
              return (
                <div key={step.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{step.label}</span>
                    <span className="text-slate-500">{formatCompact(step.value)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${step.color}`}
                      style={{ width: `${Math.max((step.value / max) * 100, step.value ? 8 : 0)}%` }}
                    />
                  </div>
                  {index === arr.length - 1 && (
                    <p className="mt-3 text-xs text-slate-500">
                      Cart to order rate: {dashboardData.analyticsSummary?.cartToOrderRate || 0}%
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <SectionCard title="Top Products" subtitle="Most viewed and most converted products in the last 30 days.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">Views</th>
                  <th className="pb-3 font-medium">Carts</th>
                  <th className="pb-3 font-medium">Orders</th>
                  <th className="pb-3 font-medium">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.topProducts.length > 0 ? (
                  dashboardData.topProducts.map((product) => (
                    <tr key={`${product.productId}-${product.productName}`} className="border-b border-slate-100">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-800">{product.productName}</p>
                        {product.productId && <p className="text-xs text-slate-400">{product.productId}</p>}
                      </td>
                      <td className="py-3">{formatCompact(product.views)}</td>
                      <td className="py-3">{formatCompact(product.carts)}</td>
                      <td className="py-3">{formatCompact(product.orders)}</td>
                      <td className="py-3 text-emerald-700 font-medium">{product.conversionRate}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-slate-500">
                      Product rankings will appear once event data starts coming in.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Top Search Terms"
          subtitle="What visitors are actively trying to find on your site."
          rightSlot={<Search size={18} className="text-slate-400" />}
        >
          <div className="space-y-3">
            {dashboardData.topSearches.length > 0 ? (
              dashboardData.topSearches.map((item, index) => (
                <div
                  key={`${item.query}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-800">{item.query}</p>
                    <p className="text-xs text-slate-500">Search demand signal</p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm">
                    {formatCompact(item.searches)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Search terms will populate after users start searching through the storefront.
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Logged-in User Activity" subtitle="People who are engaging the most with products, carts, and orders.">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Product Views</th>
                <th className="pb-3 font-medium">Carts</th>
                <th className="pb-3 font-medium">Orders</th>
                <th className="pb-3 font-medium">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.activeUsers.length > 0 ? (
                dashboardData.activeUsers.map((user) => (
                  <tr key={`${user.userId}-${user.email}`} className="border-b border-slate-100">
                    <td className="py-3 pr-5">
                      <p className="font-medium text-slate-800">{user.label}</p>
                      {user.email && <p className="text-xs text-slate-400">{user.email}</p>}
                    </td>
                    <td className="py-3">{formatCompact(user.views)}</td>
                    <td className="py-3">{formatCompact(user.carts)}</td>
                    <td className="py-3">{formatCompact(user.orders)}</td>
                    <td className="py-3 text-slate-500">
                      {user.lastSeen ? new Date(user.lastSeen).toLocaleString("en-IN") : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-slate-500">
                    Logged-in user activity will appear after signed-in visitors start browsing and buying.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
