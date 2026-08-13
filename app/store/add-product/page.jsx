'use client'

import { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import ProductForm from "@/components/store/ProductForm";

function getErrorMessage(error) {
  const value = error?.response?.data?.error || error?.message || error;

  if (!value) return "Unable to add product";
  if (typeof value === "string") return value;
  if (typeof value.message === "string") return value.message;

  try {
    return JSON.stringify(value);
  } catch {
    return "Unable to add product";
  }
}

export default function StoreAddProduct() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formVersion, setFormVersion] = useState(0);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.post("/api/store/product", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success(data.message);
      setFormVersion((prev) => prev + 1);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProductForm
      key={formVersion}
      onSubmit={handleSubmit}
      submitting={loading}
      submitLabel="Add Product"
      heading="Add New Product"
      helperText="Build a polished catalog entry with richer photos, correct categories, and FAQs your buyers actually care about."
      enableDraft
    />
  );
}
