import Title from "./Title";
import ProductCard from "./ProductCard";

const BestSelling = ({ products = [] }) => {
  const displayQuantity = 8;

  return (
    <div className="px-6 my-30 max-w-6xl mx-auto">
      <Title
        title="Best Selling"
        description={`Showing ${products.length < displayQuantity ? products.length : displayQuantity} of ${products.length} products`}
        href="/shop"
      />

      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {products
          .slice()
          .sort((a, b) => b.rating.length - a.rating.length)
          .slice(0, displayQuantity)
          .map((product) => (
            <ProductCard key={product.id} product={product} truncateName={true} />
          ))}
      </div>
    </div>
  );
};

export default BestSelling;
