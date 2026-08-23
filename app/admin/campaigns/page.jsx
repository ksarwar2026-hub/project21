'use client'

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  CalendarClock,
  Check,
  Eye,
  Megaphone,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

const emptyForm = {
  name: "",
  description: "",
  desktopBannerUrl: "",
  mobileBannerUrl: "",
  desktopBannerFileId: "",
  mobileBannerFileId: "",
  desktopBanner: null,
  mobileBanner: null,
  startsAt: "",
  endsAt: "",
  products: [],
};

function toDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function statusClass(status) {
  if (status === "Active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Scheduled") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

function getErrorMessage(error) {
  return error?.response?.data?.error || error?.message || "Something went wrong";
}

export default function AdminCampaigns() {
  const { getToken } = useAuth();
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";

  const [campaigns, setCampaigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [productToAdd, setProductToAdd] = useState("");

  const selectedProductIds = useMemo(
    () => new Set(form.products.map((product) => product.productId)),
    [form.products]
  );

  const availableProducts = products.filter((product) => !selectedProductIds.has(product.id));
  const filteredCampaigns =
    statusFilter === "All"
      ? campaigns
      : campaigns.filter((campaign) => campaign.status === statusFilter);

  const fetchCampaigns = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/admin/campaigns", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCampaigns(data.campaigns || []);
      setProducts(data.products || []);
      setSelectedCampaign((current) => {
        if (!current) return null;
        return data.campaigns?.find((campaign) => campaign.id === current.id) || data.campaigns?.[0] || null;
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const resetForm = () => {
    setEditingCampaignId(null);
    setForm(emptyForm);
    setProductToAdd("");
  };

  const editCampaign = (campaign) => {
    setEditingCampaignId(campaign.id);
    setProductToAdd("");
    setForm({
      name: campaign.name || "",
      description: campaign.description || "",
      desktopBannerUrl: campaign.desktopBannerUrl || "",
      mobileBannerUrl: campaign.mobileBannerUrl || "",
      desktopBannerFileId: campaign.desktopBannerFileId || "",
      mobileBannerFileId: campaign.mobileBannerFileId || "",
      desktopBanner: null,
      mobileBanner: null,
      startsAt: toDateTimeInput(campaign.startsAt),
      endsAt: toDateTimeInput(campaign.endsAt),
      products: (campaign.products || []).map((campaignProduct) => ({
        productId: campaignProduct.productId,
        offerPrice: campaignProduct.offerPrice,
        showOnHomepage: campaignProduct.showOnHomepage,
        showCountdown: campaignProduct.showCountdown,
      })),
    });
  };

  const addProductRow = () => {
    if (!productToAdd) return;
    const product = products.find((item) => item.id === productToAdd);

    if (!product) return;

    setForm((current) => ({
      ...current,
      products: [
        ...current.products,
        {
          productId: product.id,
          offerPrice: product.price,
          showOnHomepage: true,
          showCountdown: true,
        },
      ],
    }));
    setProductToAdd("");
  };

  const updateProductRow = (productId, patch) => {
    setForm((current) => ({
      ...current,
      products: current.products.map((product) =>
        product.productId === productId ? { ...product, ...patch } : product
      ),
    }));
  };

  const removeProductRow = (productId) => {
    setForm((current) => ({
      ...current,
      products: current.products.filter((product) => product.productId !== productId),
    }));
  };

  const saveCampaign = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const token = await getToken();
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("description", form.description);
      payload.append("startsAt", new Date(form.startsAt).toISOString());
      payload.append("endsAt", new Date(form.endsAt).toISOString());
      payload.append("desktopBannerUrl", form.desktopBannerUrl || "");
      payload.append("mobileBannerUrl", form.mobileBannerUrl || "");
      payload.append("desktopBannerFileId", form.desktopBannerFileId || "");
      payload.append("mobileBannerFileId", form.mobileBannerFileId || "");
      payload.append(
        "products",
        JSON.stringify(
          form.products.map((product) => ({
            ...product,
            offerPrice: Number(product.offerPrice),
          }))
        )
      );

      if (form.desktopBanner) {
        payload.append("desktopBanner", form.desktopBanner);
      }

      if (form.mobileBanner) {
        payload.append("mobileBanner", form.mobileBanner);
      }

      const request = editingCampaignId
        ? axios.put(`/api/admin/campaigns/${editingCampaignId}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          })
        : axios.post("/api/admin/campaigns", payload, {
            headers: { Authorization: `Bearer ${token}` },
          });

      const { data } = await request;
      toast.success(data.message);
      resetForm();
      setSelectedCampaign(data.campaign || null);
      await fetchCampaigns();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const deleteCampaign = async (campaign) => {
    if (!window.confirm(`Delete "${campaign.name}" and remove all campaign product prices?`)) {
      return;
    }

    try {
      const token = await getToken();
      const { data } = await axios.delete(`/api/admin/campaigns/${campaign.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(data.message);
      resetForm();
      await fetchCampaigns();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const productById = new Map(products.map((product) => [product.id, product]));

  if (loading) {
    return <div className="text-slate-500">Loading campaigns...</div>;
  }

  return (
    <div className="mb-40 text-slate-600">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Megaphone size={14} />
            Marketing
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">Campaigns</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage limited-time product prices centrally without changing permanent product pricing.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
          Total campaigns: <span className="font-semibold text-slate-900">{campaigns.length}</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">View campaigns</h2>
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm">
              {["All", "Active", "Scheduled", "Expired"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-md px-3 py-1.5 transition ${
                    statusFilter === status ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Campaign</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Products</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Start</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">End</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{campaign.name}</td>
                    <td className="px-4 py-3">{campaign.productCount}</td>
                    <td className="px-4 py-3">{format(new Date(campaign.startsAt), "MMM d, yyyy HH:mm")}</td>
                    <td className="px-4 py-3">{format(new Date(campaign.endsAt), "MMM d, yyyy HH:mm")}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCampaign(campaign)}
                          className="rounded-md border border-slate-200 p-2 text-slate-600 transition hover:bg-white"
                          aria-label="View campaign"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => editCampaign(campaign)}
                          className="rounded-md border border-slate-200 p-2 text-slate-600 transition hover:bg-white"
                          aria-label="Edit campaign"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCampaign(campaign)}
                          className="rounded-md border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                          aria-label="Delete campaign"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCampaigns.length === 0 && (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No campaigns found for this status.
            </p>
          )}
        </section>

        <form onSubmit={saveCampaign} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              {editingCampaignId ? "Edit campaign" : "Create campaign"}
            </h2>
            {editingCampaignId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                <X size={14} />
                Cancel edit
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-3">
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Campaign name"
              className="rounded-md border border-slate-200 p-2.5 text-sm outline-slate-400"
              required
            />
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Description"
              className="min-h-20 rounded-md border border-slate-200 p-2.5 text-sm outline-slate-400"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="text-slate-500">Start date and time</span>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-200 p-2.5 outline-slate-400"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="text-slate-500">End date and time</span>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-200 p-2.5 outline-slate-400"
                  required
                />
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Homepage campaign banner</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Optional. Agar dono banners upload karoge to homepage par Product Showcase ke baad full-photo banner section show hoga.
                  Recommended: PC 1920×620px, phone 1080×1350px.
                </p>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="text-slate-500">PC banner</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setForm({ ...form, desktopBanner: event.target.files?.[0] || null })
                    }
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-sm"
                  />
                  {(form.desktopBanner || form.desktopBannerUrl) && (
                    <img
                      src={
                        form.desktopBanner
                          ? URL.createObjectURL(form.desktopBanner)
                          : form.desktopBannerUrl
                      }
                      alt="PC campaign banner preview"
                      className="mt-2 h-20 w-full rounded-md border border-slate-200 object-cover"
                    />
                  )}
                </label>
                <label className="text-sm">
                  <span className="text-slate-500">Phone banner</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setForm({ ...form, mobileBanner: event.target.files?.[0] || null })
                    }
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-sm"
                  />
                  {(form.mobileBanner || form.mobileBannerUrl) && (
                    <img
                      src={
                        form.mobileBanner
                          ? URL.createObjectURL(form.mobileBanner)
                          : form.mobileBannerUrl
                      }
                      alt="Phone campaign banner preview"
                      className="mt-2 h-28 w-24 rounded-md border border-slate-200 object-cover"
                    />
                  )}
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <CalendarClock size={16} />
              Campaign products
            </div>

            <div className="mt-3 flex gap-2">
              <select
                value={productToAdd}
                onChange={(event) => setProductToAdd(event.target.value)}
                className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white p-2.5 text-sm outline-slate-400"
              >
                <option value="">Select product</option>
                {availableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {currency}
                    {Number(product.price).toLocaleString()} {product.store?.isActive ? "" : "(Store inactive)"}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addProductRow}
                className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-3 text-sm font-semibold text-white transition hover:bg-slate-950"
              >
                <Plus size={16} />
                Add
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {form.products.map((campaignProduct) => {
                const product = productById.get(campaignProduct.productId);

                return (
                  <div key={campaignProduct.productId} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{product?.name || "Product"}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Normal price: {currency}
                          {Number(product?.price || 0).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProductRow(campaignProduct.productId)}
                        className="rounded-md p-1.5 text-red-500 transition hover:bg-red-50"
                        aria-label="Remove product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                      <label className="text-sm">
                        <span className="text-slate-500">Offer price</span>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={campaignProduct.offerPrice}
                          onChange={(event) =>
                            updateProductRow(campaignProduct.productId, {
                              offerPrice: event.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-md border border-slate-200 p-2 outline-slate-400"
                          required
                        />
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={campaignProduct.showOnHomepage}
                          onChange={(event) =>
                            updateProductRow(campaignProduct.productId, {
                              showOnHomepage: event.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-emerald-700"
                        />
                        Homepage
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={campaignProduct.showCountdown}
                          onChange={(event) =>
                            updateProductRow(campaignProduct.productId, {
                              showCountdown: event.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-emerald-700"
                        />
                        Countdown
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {form.products.length === 0 && (
              <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                Add at least one product when this campaign is ready to price products.
              </p>
            )}
          </div>

          <button
            disabled={saving}
            className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md bg-slate-800 px-5 text-sm font-semibold text-white transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <Check size={16} />
            {saving ? "Saving..." : editingCampaignId ? "Save campaign" : "Create campaign"}
          </button>
        </form>
      </div>

      {selectedCampaign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onClick={() => setSelectedCampaign(null)}
        >
          <section
            className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{selectedCampaign.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedCampaign.description || "No description added."}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Start: {format(new Date(selectedCampaign.startsAt), "MMM d, yyyy HH:mm")} · End: {format(new Date(selectedCampaign.endsAt), "MMM d, yyyy HH:mm")}
                </p>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Banner: {selectedCampaign.desktopBannerUrl && selectedCampaign.mobileBannerUrl ? "ON" : "OFF"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(selectedCampaign.status)}`}>
                  {selectedCampaign.status}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCampaign(null)}
                  className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                  aria-label="Close campaign details"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Homepage par product tab dikhega jab campaign <span className="font-semibold">Active</span> ho,
              product ka <span className="font-semibold">Homepage ON</span> ho, aur product ka store public/active ho.
              Product page par campaign price active date window ke andar dikhega.
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {(selectedCampaign.products || []).map((campaignProduct) => (
                <article key={campaignProduct.productId} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{campaignProduct.product?.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{campaignProduct.product?.category}</p>
                      <p className={`mt-1 text-xs font-medium ${campaignProduct.product?.store?.isActive ? "text-emerald-700" : "text-rose-600"}`}>
                        Store: {campaignProduct.product?.store?.name || "Unknown"} · {campaignProduct.product?.store?.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <p className="text-right text-sm font-semibold text-slate-900">
                      {currency}
                      {Number(campaignProduct.offerPrice).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className={`rounded-full px-2.5 py-1 ${campaignProduct.showOnHomepage ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      Homepage {campaignProduct.showOnHomepage ? "ON" : "OFF"}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 ${campaignProduct.showCountdown ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      Countdown {campaignProduct.showCountdown ? "ON" : "OFF"}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 ${selectedCampaign.status === "Active" && campaignProduct.showOnHomepage && campaignProduct.product?.store?.isActive ? "bg-emerald-50 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      Homepage eligible {selectedCampaign.status === "Active" && campaignProduct.showOnHomepage && campaignProduct.product?.store?.isActive ? "YES" : "NO"}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {selectedCampaign.products?.length === 0 && (
              <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                No products are assigned to this campaign yet.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
