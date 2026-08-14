import imagekit from "@/configs/imageKit";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PRODUCT_IMAGE_LIMIT } from "@/lib/store/productCategories";

function parseFaqs(rawFaqs) {
  if (!rawFaqs) {
    return [];
  }

  try {
    return JSON.parse(rawFaqs).filter((faq) => faq.question?.trim() && faq.answer?.trim());
  } catch {
    return [];
  }
}

function parseExistingImages(rawImages) {
  if (!rawImages) {
    return [];
  }

  try {
    return JSON.parse(rawImages).filter(Boolean);
  } catch {
    return [];
  }
}

function parseContent(rawContent) {
  if (!rawContent) {
    return {};
  }

  try {
    const content = JSON.parse(rawContent);
    return content && typeof content === "object" && !Array.isArray(content) ? content : {};
  } catch {
    return {};
  }
}

function compactTextArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

function sanitizeContent(content) {
  return {
    isBestSeller: Boolean(content.isBestSeller),
    ingredientBanner: {
      url: String(content.ingredientBanner?.url || "").trim(),
      fileId: String(content.ingredientBanner?.fileId || "").trim(),
    },
    introduction: String(content.introduction || "").trim(),
    formulaTitle: String(content.formulaTitle || "").trim(),
    formulaDescription: String(content.formulaDescription || "").trim(),
    productType: String(content.productType || "").trim(),
    formula: String(content.formula || "").trim(),
    hairType: String(content.hairType || "").trim(),
    volume: String(content.volume || "").trim(),
    whoItsFor: String(content.whoItsFor || "").trim(),
    keyIngredients: Array.isArray(content.keyIngredients)
      ? content.keyIngredients
          .map((ingredient) => ({
            name: String(ingredient?.name || "").trim(),
            benefit: String(ingredient?.benefit || "").trim(),
            imageUrl: String(ingredient?.imageUrl || "").trim(),
          }))
          .filter((ingredient) => ingredient.name || ingredient.benefit || ingredient.imageUrl)
      : [],
    benefits: compactTextArray(content.benefits),
    usageSteps: Array.isArray(content.usageSteps)
      ? content.usageSteps
          .map((step, index) => ({
            step: String(step?.step || String(index + 1).padStart(2, "0")).trim(),
            title: String(step?.title || "").trim(),
            text: String(step?.text || "").trim(),
          }))
          .filter((step) => step.title || step.text)
      : [],
    fullIngredients: compactTextArray(content.fullIngredients),
    safety: compactTextArray(content.safety),
    imageFiles: Array.isArray(content.imageFiles)
      ? content.imageFiles
          .map((file) => ({
            url: String(file?.url || "").trim(),
            fileId: String(file?.fileId || "").trim(),
          }))
          .filter((file) => file.url)
      : [],
  };
}

function getErrorMessage(error) {
  const value = error?.response?.data?.error || error?.message || error?.code || error;

  if (!value) return "Unable to save product";
  if (typeof value === "string") return value;
  if (typeof value.message === "string") return value.message;

  try {
    return JSON.stringify(value);
  } catch {
    return "Unable to save product";
  }
}

async function uploadImages(images, { folder = "products", width = "1024" } = {}) {
  return Promise.all(
    images.map(async (image) => {
      const buffer = Buffer.from(await image.arrayBuffer());
      const response = await imagekit.upload({
        file: buffer,
        fileName: image.name,
        folder,
      });

      const url = imagekit.url({
        path: response.filePath,
        transformation: [{ quality: "auto" }, { format: "webp" }, { width }],
      });

      return {
        url,
        fileId: response.fileId,
      };
    })
  );
}

async function deleteImageKitFiles(fileIds) {
  const uniqueFileIds = [...new Set(fileIds.filter(Boolean))];

  await Promise.allSettled(uniqueFileIds.map((fileId) => imagekit.deleteFile(fileId)));
}

function validateProductFields({ name, description, mrp, price, category }) {
  if (!name?.trim() || !description?.trim() || !category?.trim()) {
    return "missing product details";
  }

  if (Number.isNaN(mrp) || Number.isNaN(price) || mrp <= 0 || price <= 0) {
    return "price details are invalid";
  }

  if (price > mrp) {
    return "offer price cannot be greater than MRP";
  }

  return null;
}

async function getStoreId(request) {
  const { userId } = getAuth(request);
  return authSeller(userId);
}

export async function POST(request) {
  let uploadedImages = [];
  let uploadedIngredientBanner = null;

  try {
    const storeId = await getStoreId(request);

    if (!storeId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name");
    const description = formData.get("description");
    const mrp = Number(formData.get("mrp"));
    const price = Number(formData.get("price"));
    const category = formData.get("category");
    const images = formData
      .getAll("images")
      .filter((image) => image && typeof image.arrayBuffer === "function");
    const ingredientBanner = formData.get("ingredientBanner");
    const faqs = parseFaqs(formData.get("faqs"));
    const content = sanitizeContent(parseContent(formData.get("content")));

    const validationError = validateProductFields({
      name,
      description,
      mrp,
      price,
      category,
    });

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (images.length < 1) {
      return NextResponse.json({ error: "please upload at least one image" }, { status: 400 });
    }

    if (images.length > PRODUCT_IMAGE_LIMIT) {
      return NextResponse.json(
        { error: `you can upload up to ${PRODUCT_IMAGE_LIMIT} images` },
        { status: 400 }
      );
    }

    uploadedImages = await uploadImages(images);
    const imageUrls = uploadedImages.map((image) => image.url);
    uploadedIngredientBanner =
      ingredientBanner && typeof ingredientBanner.arrayBuffer === "function"
        ? (await uploadImages([ingredientBanner], {
            folder: "product-description-banners",
            width: "1920",
          }))[0]
        : null;

    await prisma.product.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        mrp,
        price,
        category: category.trim(),
        images: imageUrls,
        content: {
          ...content,
          imageFiles: uploadedImages,
          ingredientBanner: uploadedIngredientBanner || content.ingredientBanner,
        },
        storeId,
        faqs: {
          create: faqs.map((faq) => ({
            question: faq.question.trim(),
            answer: faq.answer.trim(),
          })),
        },
      },
    });

    return NextResponse.json({ message: "Product added successfully" });
  } catch (error) {
    console.error(error);
    await deleteImageKitFiles(uploadedImages.map((image) => image.fileId));
    await deleteImageKitFiles(uploadedIngredientBanner ? [uploadedIngredientBanner.fileId] : []);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function PUT(request) {
  let uploadedImages = [];
  let uploadedIngredientBanner = null;

  try {
    const storeId = await getStoreId(request);

    if (!storeId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const productId = formData.get("productId");
    const name = formData.get("name");
    const description = formData.get("description");
    const mrp = Number(formData.get("mrp"));
    const price = Number(formData.get("price"));
    const category = formData.get("category");
    const existingImages = parseExistingImages(formData.get("existingImages"));
    const existingIngredientBanner = String(formData.get("existingIngredientBanner") || "").trim();
    const newImages = formData
      .getAll("images")
      .filter((image) => image && typeof image.arrayBuffer === "function");
    const ingredientBanner = formData.get("ingredientBanner");
    const faqs = parseFaqs(formData.get("faqs"));
    const content = sanitizeContent(parseContent(formData.get("content")));

    if (!productId) {
      return NextResponse.json({ error: "missing product id" }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "product not found" }, { status: 404 });
    }

    const validationError = validateProductFields({
      name,
      description,
      mrp,
      price,
      category,
    });

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    uploadedImages = await uploadImages(newImages);
    const uploadedImageUrls = uploadedImages.map((image) => image.url);
    const allImages = [...existingImages, ...uploadedImageUrls];
    uploadedIngredientBanner =
      ingredientBanner && typeof ingredientBanner.arrayBuffer === "function"
        ? (await uploadImages([ingredientBanner], {
            folder: "product-description-banners",
            width: "1920",
          }))[0]
        : null;

    if (allImages.length < 1) {
      return NextResponse.json({ error: "please keep at least one image" }, { status: 400 });
    }

    if (allImages.length > PRODUCT_IMAGE_LIMIT) {
      return NextResponse.json(
        { error: `you can keep up to ${PRODUCT_IMAGE_LIMIT} images` },
        { status: 400 }
      );
    }

    const previousImageFiles = Array.isArray(product.content?.imageFiles)
      ? product.content.imageFiles
      : [];
    const keptImageFiles = previousImageFiles.filter((file) => existingImages.includes(file.url));
    const removedFileIds = previousImageFiles
      .filter((file) => !existingImages.includes(file.url))
      .map((file) => file.fileId);
    const previousIngredientBanner = product.content?.ingredientBanner || {};
    const keptIngredientBanner =
      previousIngredientBanner.url && previousIngredientBanner.url === existingIngredientBanner
        ? previousIngredientBanner
        : { url: "", fileId: "" };
    const removedIngredientBannerFileIds =
      previousIngredientBanner.fileId && previousIngredientBanner.url !== existingIngredientBanner
        ? [previousIngredientBanner.fileId]
        : [];

    await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        name: name.trim(),
        description: description.trim(),
        mrp,
        price,
        category: category.trim(),
        images: allImages,
        content: {
          ...content,
          imageFiles: [...keptImageFiles, ...uploadedImages],
          ingredientBanner: uploadedIngredientBanner || keptIngredientBanner,
        },
        faqs: {
          deleteMany: {},
          create: faqs.map((faq) => ({
            question: faq.question.trim(),
            answer: faq.answer.trim(),
          })),
        },
      },
    });

    await deleteImageKitFiles(removedFileIds);
    await deleteImageKitFiles(removedIngredientBannerFileIds);

    return NextResponse.json({ message: "Product updated successfully" });
  } catch (error) {
    console.error(error);
    await deleteImageKitFiles(uploadedImages.map((image) => image.fileId));
    await deleteImageKitFiles(uploadedIngredientBanner ? [uploadedIngredientBanner.fileId] : []);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    const storeId = await getStoreId(request);

    if (!storeId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: "missing product id" }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId,
      },
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "product not found" }, { status: 404 });
    }

    if (product._count.orderItems > 0) {
      return NextResponse.json(
        {
          error:
            "This product has order history, so it cannot be deleted. Mark it out of stock instead.",
        },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    const imageFiles = Array.isArray(product.content?.imageFiles) ? product.content.imageFiles : [];
    await deleteImageKitFiles(imageFiles.map((file) => file.fileId));
    await deleteImageKitFiles(
      product.content?.ingredientBanner?.fileId ? [product.content.ingredientBanner.fileId] : []
    );

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function GET(request) {
  try {
    const storeId = await getStoreId(request);

    if (!storeId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: { storeId },
      include: {
        faqs: true,
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}
