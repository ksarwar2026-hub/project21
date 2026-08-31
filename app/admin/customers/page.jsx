'use client'

import Loading from "@/components/Loading";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import {
  Activity,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  ShoppingBasketIcon,
  ShoppingCart,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const formatCompact = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 1,
  });

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN") : "-";

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

const MiniMetric = ({ label, value, helper, icon: Icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCompact(value)}</p>
        {helper && <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>}
      </div>
      <div className="rounded-2xl bg-white p-2.5 text-slate-600 shadow-sm">
        <Icon size={18} />
      </div>
    </div>
  </div>
);

export default function AdminCustomersPage() {
  const { getToken } = useAuth();
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "Rs";
  const [loading, setLoading] = useState(true);
  const [customerSummary, setCustomerSummary] = useState({
    totalSignedUpCustomers: 0,
    totalDbCustomers: 0,
    customersWithOrders: 0,
    customersWithoutOrders: 0,
    customersWithAddresses: 0,
    guestVisitors30d: 0,
    loggedInVisitors30d: 0,
    guestCheckoutUsers30d: 0,
    customerList: [],
    sourceNote: "",
  });

  const fetchCustomers = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomerSummary(data.dashboardData.customerSummary || {});
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 text-slate-600">
      <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#f8fafc)] p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Admin Customers</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Customer accounts and checkout audience</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Track signed-up customers from Clerk, database customers with order/address data, and guest checkout activity from PostHog.
        </p>
      </div>

      <SectionCard
        title="Customer Overview"
        subtitle="Account, guest, and checkout customer counts."
        rightSlot={
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Clerk + DB + PostHog
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MiniMetric
            label="Signed-up customers"
            value={customerSummary.totalSignedUpCustomers}
            helper="Total customer accounts from Clerk."
            icon={UserCheck}
          />
          <MiniMetric
            label="DB customers"
            value={customerSummary.totalDbCustomers}
            helper="Customers created in the app database."
            icon={Users}
          />
          <MiniMetric
            label="Guest visitors"
            value={customerSummary.guestVisitors30d}
            helper="Unique anonymous visitors in the last 30 days."
            icon={ShoppingCart}
          />
          <MiniMetric
            label="Logged-in visitors"
            value={customerSummary.loggedInVisitors30d}
            helper="Unique logged-in visitors in the last 30 days."
            icon={Activity}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MiniMetric
            label="Guest checkout users"
            value={customerSummary.guestCheckoutUsers30d}
            helper="Guests who reached checkout in the last 30 days."
            icon={ShoppingBasketIcon}
          />
          <MiniMetric
            label="Customers with orders"
            value={customerSummary.customersWithOrders}
            helper="Database customers who have placed at least one order."
            icon={PackageCheck}
          />
          <MiniMetric
            label="DB customers without orders"
            value={customerSummary.customersWithoutOrders}
            helper="Database customers who have not placed an order yet."
            icon={Users}
          />
          <MiniMetric
            label="Customers with address"
            value={customerSummary.customersWithAddresses}
            helper="Database customers with at least one saved delivery address."
            icon={MapPin}
          />
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-6 text-slate-600 lg:grid-cols-2">
          <p>
            <span className="font-semibold text-slate-800">Signed-up</span> means Clerk account exists.{" "}
            <span className="font-semibold text-slate-800">DB customer</span> means the app database has a customer row.
          </p>
          <p>
            <span className="font-semibold text-slate-800">Guest visitor</span> means no user id was tracked in PostHog.{" "}
            <span className="font-semibold text-slate-800">Guest checkout user</span> means a guest reached checkout before login.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Customer Details" subtitle="Recent Clerk accounts and database customers with order, cart, and address context.">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Contact</th>
                <th className="pb-3 font-medium">Location</th>
                <th className="pb-3 font-medium">Orders</th>
                <th className="pb-3 font-medium">Cart</th>
                <th className="pb-3 font-medium">Last Order</th>
                <th className="pb-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {customerSummary.customerList?.length > 0 ? (
                customerSummary.customerList.map((customer) => (
                  <tr key={customer.id} className="border-b border-slate-100 align-top">
                    <td className="py-3 pr-5">
                      <div className="flex items-center gap-3">
                        {customer.image ? (
                          <img
                            src={customer.image}
                            alt=""
                            className="h-9 w-9 rounded-full bg-slate-100 object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                            {String(customer.name || "C").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-800">{customer.name}</p>
                          <p className="text-xs text-slate-400">{customer.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-5">
                      <div className="space-y-1 text-xs text-slate-500">
                        <p className="flex items-center gap-1.5">
                          <Mail size={13} />
                          <span>{customer.email || "-"}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone size={13} />
                          <span>{customer.phone || "-"}</span>
                        </p>
                      </div>
                    </td>
                    <td className="py-3 pr-5 text-slate-500">
                      {[customer.city, customer.state, customer.country].filter(Boolean).join(", ") || "-"}
                    </td>
                    <td className="py-3 font-medium text-slate-800">
                      {formatCompact(customer.orderCount)}
                      <p className="mt-1 text-xs font-normal text-slate-500">
                        {currency}{formatCompact(customer.totalSpent)} spent
                      </p>
                    </td>
                    <td className="py-3 text-slate-500">{formatCompact(customer.cartItems)} items</td>
                    <td className="py-3 text-slate-500">{formatDateTime(customer.lastOrderAt)}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        {customer.source}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-slate-500">
                    Customer details will appear after Clerk or database customer records are available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-500">
          {customerSummary.sourceNote ||
            "Signed-up customers come from Clerk, customer order/address data comes from the database, and guest activity comes from PostHog."}
        </p>
      </SectionCard>
    </div>
  );
}
