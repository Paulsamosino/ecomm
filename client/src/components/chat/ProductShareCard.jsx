import React from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProductShareCard = ({ product, onViewProduct }) => {
  if (!product) return null;

  return (
    <div className="border rounded-lg overflow-hidden max-w-full mb-2">
      <div className="flex">
        <img
          src={product.images?.[0] || "/placeholder-product.jpg"}
          alt={product.name}
          className="w-16 h-16 object-cover"
        />
        <div className="p-2 flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{product.name}</p>
          <p className="text-sm text-primary">
            ₱{product.price?.toFixed(2) || "0.00"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-7 px-2 text-xs"
            onClick={() => onViewProduct(product)}
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            View Product
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductShareCard;
