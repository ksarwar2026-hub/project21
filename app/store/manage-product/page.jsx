'use client'

import { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { Pencil, Trash2, PackageX, PackageCheck, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth, useUser } from "@clerk/nextjs";
import Loading from "@/components/Loading";
import ProductForm from "@/components/store/ProductForm";

export default function StoreManageProducts() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/store/product", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(data.products);
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStock = async (productId) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/store/stock-toggle",
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === productId ? { ...product, inStock: data.inStock } : product
        )
      );

      toast.success(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    }
  };

  const deleteProduct = async (productId) => {
    try {
      const token = await getToken();
      const { data } = await axios.delete("/api/store/product", {
        headers: { Authorization: `Bearer ${token}` },
        data: { productId },
      });

      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== productId)
      );
      toast.success(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    }
  };

  const updateProduct = async (formData) => {
    try {
      setSaving(true);
      const token = await getToken();
      const { data } = await axios.put("/api/store/product", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchProducts();
      setEditingProduct(null);
      toast.success(data.message);
    } catch (error) {
      throw new Error(error?.response?.data?.error || error.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  if (loading) return <Loading />;

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl text-slate-900 font-semibold">Manage Products</h1>
          <p className="mt-2 text-sm text-slate-500">
            Update catalog details, switch stock state, or remove products that are no longer needed.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Total products: <span className="font-semibold text-slate-900">{products.length}</span>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No products added yet. Start by creating your first product.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute left-4 top-4 flex gap-2">
                  <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                    {product.category}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium shadow-sm ${
                      product.inStock
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="line-clamp-2 text-lg font-semibold text-slate-900">
                      {product.name}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 text-sm">
                  <p className="text-lg font-semibold text-slate-900">
                    {currency}
                    {Number(product.price).toLocaleString()}
                  </p>
                  <p className="text-slate-400 line-through">
                    {currency}
                    {Number(product.mrp).toLocaleString()}
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <span>{product.images.length} images</span>
                  <span>•</span>
                  <span>{product.faqs?.length || 0} FAQs</span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(product)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const label = product.inStock ? "mark out of stock" : "bring back in stock";
                      if (window.confirm(`Do you want to ${label} for "${product.name}"?`)) {
                        toggleStock(product.id);
                      }
                    }}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                      product.inStock
                        ? "border border-amber-200 text-amber-700 hover:bg-amber-50"
                        : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    {product.inStock ? <PackageX size={16} /> : <PackageCheck size={16} />}
                    {product.inStock ? "Out of Stock" : "Back In Stock"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete "${product.name}" permanently from the database?`
                        )
                      ) {
                        deleteProduct(product.id);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-6xl flex-col rounded-[28px] bg-slate-50 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Edit Product</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Fine-tune images, descriptions, pricing, FAQs, and category without re-uploading everything.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <ProductForm
                initialProduct={editingProduct}
                onSubmit={updateProduct}
                submitting={saving}
                submitLabel="Save Changes"
                heading={`Edit ${editingProduct.name}`}
                helperText="Refresh the catalog entry while preserving any images you want to keep."
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
