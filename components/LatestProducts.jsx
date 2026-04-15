import Title from "./Title";
import ProductCard from "./ProductCard";

const LatestProducts = ({ products = [] }) => {
  const displayQuantity = 4;

  return (
    <div className="px-6 my-30 max-w-6xl mx-auto">
      <Title
        title="Latest Products"
        description={`Showing ${products.length < displayQuantity ? products.length : displayQuantity} of ${products.length} products`}
        href="/shop"
      />

      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {products
          .slice()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, displayQuantity)
          .map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              truncateName={true}
              eventSource="homepage_latest"
            />
          ))}
      </div>
    </div>
  );
};

export default LatestProducts;
