'use client'

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Save, Trash2, Upload, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { assets } from "@/assets/assets";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_IMAGE_LIMIT,
} from "@/lib/store/productCategories";

const DRAFT_KEY = "ksarwar:add-product-draft:v2";

function createEmptyFaq() {
  return { question: "", answer: "" };
}

function createEmptyIngredient() {
  return { name: "", benefit: "", imageUrl: "" };
}

function createEmptyBenefit() {
  return "";
}

function createEmptyUsageStep(index = 0) {
  return { step: String(index + 1).padStart(2, "0"), title: "", text: "" };
}

function createDefaultContent(product) {
  const content = product?.content || {};

  return {
    introduction: content.introduction || "",
    formulaTitle: content.formulaTitle || "What makes the formula different",
    formulaDescription: content.formulaDescription || "",
    productType: content.productType || "",
    formula: content.formula || "",
    hairType: content.hairType || "All Hair Types",
    volume: content.volume || "",
    keyIngredients:
      content.keyIngredients?.length > 0
        ? content.keyIngredients.map((item) => ({
            name: item.name || "",
            benefit: item.benefit || "",
            imageUrl: item.imageUrl || "",
          }))
        : [
            { name: "Rosemary", benefit: "", imageUrl: "" },
            { name: "Rice Water", benefit: "", imageUrl: "" },
            { name: "Aloe Vera", benefit: "", imageUrl: "" },
            { name: "Amla & Bhringraj", benefit: "", imageUrl: "" },
          ],
    benefits:
      content.benefits?.length > 0
        ? content.benefits
        : [createEmptyBenefit(), createEmptyBenefit(), createEmptyBenefit(), createEmptyBenefit()],
    usageSteps:
      content.usageSteps?.length > 0
        ? content.usageSteps.map((item, index) => ({
            step: item.step || String(index + 1).padStart(2, "0"),
            title: item.title || "",
            text: item.text || "",
          }))
        : [createEmptyUsageStep(0), createEmptyUsageStep(1), createEmptyUsageStep(2)],
    whoItsFor: content.whoItsFor || "",
    fullIngredients:
      content.fullIngredients?.length > 0 ? content.fullIngredients : ["", "", "", ""],
    safety:
      content.safety?.length > 0
        ? content.safety
        : [
            "For external use only.",
            "Avoid direct contact with eyes.",
            "Do a patch test before use.",
            "Store in a cool, dry place away from direct sunlight.",
            "Keep out of reach of children.",
          ],
  };
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
    content: createDefaultContent(product),
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

function normalizeErrorMessage(error) {
  const value = error?.response?.data?.error || error?.message || error;

  if (!value) return "Unable to save product";
  if (typeof value === "string") return value;
  if (typeof value.message === "string") return value.message;

  try {
    return JSON.stringify(value);
  } catch {
    return "Unable to save product";
  }
}

function hasDraftContent(productInfo, content, faqs) {
  const productInfoHasContent = Object.values(productInfo).some((value) =>
    String(value || "").trim()
  );
  const contentHasText =
    content.introduction?.trim() ||
    content.formulaDescription?.trim() ||
    content.whoItsFor?.trim() ||
    content.keyIngredients?.some((item) => item.benefit?.trim() || item.imageUrl?.trim()) ||
    content.benefits?.some((item) => item?.trim()) ||
    content.fullIngredients?.some((item) => item?.trim());
  const faqsHaveText = faqs.some((faq) => faq.question?.trim() || faq.answer?.trim());

  return Boolean(productInfoHasContent || contentHasText || faqsHaveText);
}

const ProductForm = ({
  initialProduct = null,
  onSubmit,
  submitting = false,
  submitLabel = "Save Product",
  heading = "Product Details",
  helperText = "Upload up to 6 photos and keep the first image as the main cover.",
  enableDraft = false,
}) => {
  const initialState = useMemo(() => createInitialState(initialProduct), [initialProduct]);
  const [productInfo, setProductInfo] = useState(initialState.productInfo);
  const [content, setContent] = useState(initialState.content);
  const [faqs, setFaqs] = useState(initialState.faqs);
  const [images, setImages] = useState(initialState.images);
  const [draftAvailable, setDraftAvailable] = useState(false);

  useEffect(() => {
    setProductInfo(initialState.productInfo);
    setContent(initialState.content);
    setFaqs(initialState.faqs);
    setImages(initialState.images);
  }, [initialState]);

  useEffect(() => {
    if (!enableDraft || typeof window === "undefined") return;
    setDraftAvailable(Boolean(window.localStorage.getItem(DRAFT_KEY)));
  }, [enableDraft]);

  useEffect(() => {
    if (!enableDraft || typeof window === "undefined") return;
    if (!hasDraftContent(productInfo, content, faqs)) return;

    const timeoutId = window.setTimeout(() => {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(getDraftPayload()));
      setDraftAvailable(true);
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [enableDraft, productInfo, content, faqs]);

  const filledImagesCount = images.filter((image) => image.preview || image.file).length;

  const updateContent = (field, value) => {
    setContent((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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

  const updateArrayValue = (field, index, value) => {
    setContent((prev) => ({
      ...prev,
      [field]: prev[field].map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  };

  const updateObjectArrayValue = (field, index, key, value) => {
    setContent((prev) => ({
      ...prev,
      [field]: prev[field].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const addArrayItem = (field, emptyValue) => {
    setContent((prev) => ({
      ...prev,
      [field]: [...prev[field], typeof emptyValue === "function" ? emptyValue(prev[field].length) : emptyValue],
    }));
  };

  const removeArrayItem = (field, index) => {
    setContent((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const addFaqField = () => {
    setFaqs((prev) => [...prev, createEmptyFaq()]);
  };

  const removeFaqField = (index) => {
    setFaqs((prev) => prev.filter((_, faqIndex) => faqIndex !== index));
  };

  const getDraftPayload = () => ({
    productInfo,
    content,
    faqs,
    savedAt: new Date().toISOString(),
  });

  const saveDraft = () => {
    if (!enableDraft || typeof window === "undefined") return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(getDraftPayload()));
    setDraftAvailable(true);
    toast.success("Draft saved on this browser");
  };

  const restoreDraft = () => {
    if (!enableDraft || typeof window === "undefined") return;

    try {
      const rawDraft = window.localStorage.getItem(DRAFT_KEY);
      if (!rawDraft) return;

      const draft = JSON.parse(rawDraft);
      if (draft.productInfo) setProductInfo(draft.productInfo);
      if (draft.content) setContent({ ...createDefaultContent(null), ...draft.content });
      if (draft.faqs?.length) setFaqs(draft.faqs);
      toast.success("Draft restored");
    } catch {
      toast.error("Draft could not be restored");
    }
  };

  const clearDraft = ({ silent = false } = {}) => {
    if (!enableDraft || typeof window === "undefined") return;
    window.localStorage.removeItem(DRAFT_KEY);
    setDraftAvailable(false);
    if (!silent) {
      toast.success("Draft cleared");
    }
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
      formData.append("content", JSON.stringify(content));
      formData.append("faqs", JSON.stringify(faqs));
      formData.append("existingImages", JSON.stringify(existingImages));

      if (initialProduct?.id) {
        formData.append("productId", initialProduct.id);
      }

      newImages.forEach((image) => {
        formData.append("images", image);
      });

      await onSubmit(formData);

      if (enableDraft) {
        clearDraft({ silent: true });
      }
    } catch (error) {
      toast.error(normalizeErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-slate-600">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl text-slate-900 font-semibold">{heading}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">{helperText}</p>
        </div>

        {enableDraft && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveDraft}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Save size={16} />
              Save Draft
            </button>
            {draftAvailable && (
              <>
                <button
                  type="button"
                  onClick={restoreDraft}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                >
                  Restore Draft
                </button>
                <button
                  type="button"
                  onClick={clearDraft}
                  className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        )}
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
                placeholder="Example: K-SARWAR Rosemary & Rice Water Hair Care Spray 100ml"
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                required
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-800">Main Description</span>
              <textarea
                name="description"
                value={productInfo.description}
                onChange={onChangeHandler}
                placeholder="Short product description. This appears in product intro, cards, and SEO metadata."
                rows={6}
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400 resize-none"
                required
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-800">Product Introduction</span>
              <textarea
                value={content.introduction}
                onChange={(event) => updateContent("introduction", event.target.value)}
                placeholder="Explain what the product is and which daily routine it is made for."
                rows={4}
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400 resize-none"
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
        <h2 className="text-lg font-semibold text-slate-900">Product Information</h2>
        <p className="mt-1 text-sm text-slate-500">
          These values power the Important Information section on the product page.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Product Type", "productType", "Hair Care Spray"],
            ["Formula", "formula", "Lightweight Leave-In"],
            ["Hair Type", "hairType", "All Hair Types"],
            ["Volume", "volume", "100 ml"],
          ].map(([label, field, placeholder]) => (
            <label key={field} className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-800">{label}</span>
              <input
                type="text"
                value={content[field]}
                onChange={(event) => updateContent(field, event.target.value)}
                placeholder={placeholder}
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
        <h2 className="text-lg font-semibold text-slate-900">Formula Difference</h2>
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <input
            type="text"
            value={content.formulaTitle}
            onChange={(event) => updateContent("formulaTitle", event.target.value)}
            placeholder="What makes the formula different"
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
          />
          <textarea
            value={content.formulaDescription}
            onChange={(event) => updateContent("formulaDescription", event.target.value)}
            placeholder="Describe the formula concept. Keep claims factual and label-supported."
            rows={4}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400 resize-none"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Key Ingredients</h2>
            <p className="text-sm text-slate-500">
              Main ingredients shown as cards on the public product page.
            </p>
          </div>
          <button
            type="button"
            onClick={() => addArrayItem("keyIngredients", createEmptyIngredient)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Plus size={16} />
            Add Ingredient
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          {content.keyIngredients.map((ingredient, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="grid gap-4 lg:grid-cols-[0.35fr_0.45fr_1fr_auto] lg:items-start">
                <input
                  type="text"
                  placeholder="Ingredient name"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  value={ingredient.name}
                  onChange={(event) =>
                    updateObjectArrayValue("keyIngredients", index, "name", event.target.value)
                  }
                />
                <input
                  type="url"
                  placeholder="Optional image URL"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  value={ingredient.imageUrl}
                  onChange={(event) =>
                    updateObjectArrayValue("keyIngredients", index, "imageUrl", event.target.value)
                  }
                />
                <textarea
                  rows={3}
                  placeholder="3-4 line benefit/caption"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none resize-none"
                  value={ingredient.benefit}
                  onChange={(event) =>
                    updateObjectArrayValue("keyIngredients", index, "benefit", event.target.value)
                  }
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem("keyIngredients", index)}
                  disabled={content.keyIngredients.length === 1}
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

      <section className="grid gap-6 xl:grid-cols-2">
        <DynamicListSection
          title="Benefits"
          description="Concise points for How It Works / Benefits."
          items={content.benefits}
          placeholder="Example: Supports everyday scalp care without a heavy feel."
          onChange={(index, value) => updateArrayValue("benefits", index, value)}
          onAdd={() => addArrayItem("benefits", "")}
          onRemove={(index) => removeArrayItem("benefits", index)}
        />

        <DynamicListSection
          title="Full Ingredient List"
          description="Complete ingredient list for transparency section."
          items={content.fullIngredients}
          placeholder="Example: Rosemary Extract"
          onChange={(index, value) => updateArrayValue("fullIngredients", index, value)}
          onAdd={() => addArrayItem("fullIngredients", "")}
          onRemove={(index) => removeArrayItem("fullIngredients", index)}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">How To Use</h2>
            <p className="text-sm text-slate-500">Apply, massage, leave steps shown on the product page.</p>
          </div>
          <button
            type="button"
            onClick={() => addArrayItem("usageSteps", createEmptyUsageStep)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Plus size={16} />
            Add Step
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          {content.usageSteps.map((step, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="grid gap-4 lg:grid-cols-[90px_0.45fr_1fr_auto] lg:items-start">
                <input
                  type="text"
                  placeholder="01"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  value={step.step}
                  onChange={(event) =>
                    updateObjectArrayValue("usageSteps", index, "step", event.target.value)
                  }
                />
                <input
                  type="text"
                  placeholder="Apply"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  value={step.title}
                  onChange={(event) =>
                    updateObjectArrayValue("usageSteps", index, "title", event.target.value)
                  }
                />
                <textarea
                  rows={3}
                  placeholder="Usage instruction"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none resize-none"
                  value={step.text}
                  onChange={(event) =>
                    updateObjectArrayValue("usageSteps", index, "text", event.target.value)
                  }
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem("usageSteps", index)}
                  disabled={content.usageSteps.length === 1}
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

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Who It's For</h2>
          <textarea
            value={content.whoItsFor}
            onChange={(event) => updateContent("whoItsFor", event.target.value)}
            placeholder="Hair types and routine suitability supported by product information."
            rows={7}
            className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400 resize-none"
          />
        </div>

        <DynamicListSection
          title="Safety & Caution"
          description="Use only instructions that are actually supported by the label."
          items={content.safety}
          placeholder="Example: Avoid contact with eyes."
          onChange={(index, value) => updateArrayValue("safety", index, value)}
          onAdd={() => addArrayItem("safety", "")}
          onRemove={(index) => removeArrayItem("safety", index)}
        />
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

const DynamicListSection = ({
  title,
  description,
  items,
  placeholder,
  onChange,
  onAdd,
  onRemove,
}) => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        {items.map((item, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={item}
              onChange={(event) => onChange(index, event.target.value)}
              placeholder={placeholder}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={items.length === 1}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
            >
              <Trash2 size={16} />
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductForm;
