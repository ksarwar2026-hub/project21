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

async function uploadImages(images) {
  return Promise.all(
    images.map(async (image) => {
      const buffer = Buffer.from(await image.arrayBuffer());
      const response = await imagekit.upload({
        file: buffer,
        fileName: image.name,
        folder: "products",
      });

      return imagekit.url({
        path: response.filePath,
        transformation: [{ quality: "auto" }, { format: "webp" }, { width: "1024" }],
      });
    })
  );
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
    const faqs = parseFaqs(formData.get("faqs"));

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

    const imageUrls = await uploadImages(images);

    await prisma.product.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        mrp,
        price,
        category: category.trim(),
        images: imageUrls,
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
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

export async function PUT(request) {
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
    const newImages = formData
      .getAll("images")
      .filter((image) => image && typeof image.arrayBuffer === "function");
    const faqs = parseFaqs(formData.get("faqs"));

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

    const uploadedImages = await uploadImages(newImages);
    const allImages = [...existingImages, ...uploadedImages];

    if (allImages.length < 1) {
      return NextResponse.json({ error: "please keep at least one image" }, { status: 400 });
    }

    if (allImages.length > PRODUCT_IMAGE_LIMIT) {
      return NextResponse.json(
        { error: `you can keep up to ${PRODUCT_IMAGE_LIMIT} images` },
        { status: 400 }
      );
    }

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
        faqs: {
          deleteMany: {},
          create: faqs.map((faq) => ({
            question: faq.question.trim(),
            answer: faq.answer.trim(),
          })),
        },
      },
    });

    return NextResponse.json({ message: "Product updated successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
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

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
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
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}
