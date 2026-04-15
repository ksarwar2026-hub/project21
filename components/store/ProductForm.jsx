'use client'

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { assets } from "@/assets/assets";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_IMAGE_LIMIT,
} from "@/lib/store/productCategories";

function createEmptyFaq() {
  return { question: "", answer: "" };
}

function createInitialImages(product) {
  return Array.from({ length: PRODUCT_IMAGE_LIMIT }, (_, index) => ({
    preview: product?.images?.[index] || null,
    file: null,
  }));
}

function createInitialState(product) {
  return {
    productInfo: {
      name: product?.name || "",
      description: product?.description || "",
      mrp: product?.mrp || "",
      price: product?.price || "",
      category: product?.category || "",
    },
    faqs:
      product?.faqs?.length > 0
        ? product.faqs.map((faq) => ({
            question: faq.question || "",
            answer: faq.answer || "",
          }))
        : [createEmptyFaq()],
    images: createInitialImages(product),
  };
}

const ProductForm = ({
  initialProduct = null,
  onSubmit,
  submitting = false,
  submitLabel = "Save Product",
  heading = "Product Details",
  helperText = "Upload up to 6 photos and keep the first image as the main cover.",
}) => {
  const initialState = useMemo(() => createInitialState(initialProduct), [initialProduct]);
  const [productInfo, setProductInfo] = useState(initialState.productInfo);
  const [faqs, setFaqs] = useState(initialState.faqs);
  const [images, setImages] = useState(initialState.images);

  useEffect(() => {
    setProductInfo(initialState.productInfo);
    setFaqs(initialState.faqs);
    setImages(initialState.images);
  }, [initialState]);

  const filledImagesCount = images.filter((image) => image.preview || image.file).length;

  const onChangeHandler = (event) => {
    setProductInfo((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleImageUpload = (index, file) => {
    setImages((prev) =>
      prev.map((image, imageIndex) =>
        imageIndex === index
          ? {
              preview: file ? URL.createObjectURL(file) : null,
              file: file || null,
            }
          : image
      )
    );
  };

  const removeImage = (index) => {
    setImages((prev) =>
      prev.map((image, imageIndex) =>
        imageIndex === index
          ? {
              preview: null,
              file: null,
            }
          : image
      )
    );
  };

  const handleFaqChange = (index, field, value) => {
    setFaqs((prev) =>
      prev.map((faq, faqIndex) =>
        faqIndex === index
          ? {
              ...faq,
              [field]: value,
            }
          : faq
      )
    );
  };

  const addFaqField = () => {
    setFaqs((prev) => [...prev, createEmptyFaq()]);
  };

  const removeFaqField = (index) => {
    setFaqs((prev) => prev.filter((_, faqIndex) => faqIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const existingImages = images
        .filter((image) => image.preview && !image.file)
        .map((image) => image.preview);

      const newImages = images.filter((image) => image.file).map((image) => image.file);

      if (existingImages.length + newImages.length === 0) {
        throw new Error("Please upload at least one product image.");
      }

      const formData = new FormData();
      formData.append("name", productInfo.name.trim());
      formData.append("description", productInfo.description.trim());
      formData.append("mrp", productInfo.mrp);
      formData.append("price", productInfo.price);
      formData.append("category", productInfo.category);
      formData.append("faqs", JSON.stringify(faqs));
      formData.append("existingImages", JSON.stringify(existingImages));

      if (initialProduct?.id) {
        formData.append("productId", initialProduct.id);
      }

      newImages.forEach((image) => {
        formData.append("images", image);
      });

      await onSubmit(formData);
    } catch (error) {
      toast.error(error.message || "Unable to save product");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-slate-600">
      <div>
        <h1 className="text-2xl text-slate-900 font-semibold">{heading}</h1>
        <p className="mt-2 text-sm text-slate-500">{helperText}</p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Product Images</h2>
            <p className="text-sm text-slate-500">
              {filledImagesCount} of {PRODUCT_IMAGE_LIMIT} image slots used
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Up to {PRODUCT_IMAGE_LIMIT} photos
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50"
            >
              <label
                htmlFor={`product-image-${index}`}
                className="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden"
              >
                <Image
                  src={image.preview || assets.upload_area}
                  alt=""
                  fill={!!image.preview}
                  width={!image.preview ? 200 : undefined}
                  height={!image.preview ? 200 : undefined}
                  className={image.preview ? "object-cover" : "h-16 w-16 object-contain opacity-70"}
                />
                {!image.preview && (
                  <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2 text-xs font-medium text-slate-600">
                    <Upload size={14} />
                    Upload
                  </div>
                )}
              </label>

              <input
                id={`product-image-${index}`}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => handleImageUpload(index, event.target.files?.[0] || null)}
              />

              <div className="absolute left-2 top-2 rounded-full bg-slate-900/75 px-2 py-1 text-[11px] font-medium text-white">
                {index === 0 ? "Cover" : `Image ${index + 1}`}
              </div>

              {image.preview && (
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-slate-700 shadow-sm transition hover:bg-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
          <div className="grid gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-800">Product Name</span>
              <input
                type="text"
                name="name"
                value={productInfo.name}
                onChange={onChangeHandler}
                placeholder="Example: Glow Reset Vitamin C Face Wash"
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                required
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-800">Description</span>
              <textarea
                name="description"
                value={productInfo.description}
                onChange={onChangeHandler}
                placeholder="Talk about use case, skin or hair concern, key ingredients, and why it works."
                rows={7}
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400 resize-none"
                required
              />
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-800">MRP</span>
              <input
                type="number"
                min="0"
                step="0.01"
                name="mrp"
                value={productInfo.mrp}
                onChange={onChangeHandler}
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                required
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-800">Offer Price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                name="price"
                value={productInfo.price}
                onChange={onChangeHandler}
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                required
              />
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-800">Category</span>
            <select
              value={productInfo.category}
              onChange={(event) =>
                setProductInfo((prev) => ({
                  ...prev,
                  category: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
              required
            >
              <option value="">Select a category</option>
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Product FAQs</h2>
            <p className="text-sm text-slate-500">
              Add common questions so buyers understand usage, ingredients, and results faster.
            </p>
          </div>

          <button
            type="button"
            onClick={addFaqField}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Plus size={16} />
            Add FAQ
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr_auto] lg:items-start">
                <input
                  type="text"
                  placeholder="Question"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  value={faq.question}
                  onChange={(event) => handleFaqChange(index, "question", event.target.value)}
                />

                <textarea
                  rows={3}
                  placeholder="Answer"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none resize-none"
                  value={faq.answer}
                  onChange={(event) => handleFaqChange(index, "answer", event.target.value)}
                />

                <button
                  type="button"
                  onClick={() => removeFaqField(index)}
                  disabled={faqs.length === 1}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
