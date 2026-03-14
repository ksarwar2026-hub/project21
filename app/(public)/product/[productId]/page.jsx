'use client'

import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { generateProductSchema } from "@/lib/seo/productSchema";

export default function Product() {

const { productId } = useParams();
const [product, setProduct] = useState(null);
const products = useSelector(state => state.product.list);

useEffect(() => {

if (products.length > 0 && productId) {

  const foundProduct = products.find(
    (item) => item.id === productId
  );

  setProduct(foundProduct || null);

}

window.scrollTo(0, 0);

}, [productId, products]);

if (!product) {

return (
  <div className="mx-6 mt-20 text-center text-gray-500">
    Loading product...
  </div>
);

}

const schema = generateProductSchema(product);

return (

<div className="mx-6">

  {/* SEO Product Schema */}
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(schema)
    }}
  />

  <div className="max-w-7xl mx-auto">

    {/* Breadcrumbs */}
    <div className="text-gray-600 text-sm mt-8 mb-5">
      Home / Products / {product.category}
    </div>

    {/* Product Details */}
    <ProductDetails product={product} />

    {/* Description & Reviews */}
    <ProductDescription product={product} />

  </div>

</div>
);

}
