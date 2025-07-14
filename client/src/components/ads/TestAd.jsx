import React from "react";
import { ExternalLink, X } from "lucide-react";

const TestAd = ({ type = "banner", className = "" }) => {
  // Real-looking test ads with actual brands/products
  const ads = {
    banner: [
      {
        title: "Purina Pro Plan Poultry Feed",
        description: "Get 25% off premium layer feed. Free shipping on orders over $50!",
        image: null,
        cta: "Shop Now",
        sponsor: "Purina Store",
        url: "https://example.com/",
        price: "Starting at $24.99"
      },
      {
        title: "Automatic Chicken Coop Door",
        description: "Smart door with timer & light sensor. Keep your chickens safe 24/7",
        image: null,
        cta: "Learn More", 
        sponsor: "ChickenGuard",
        url: "https://example.com/",
        price: "$89.99"
      },
      {
        title: "Farm Fresh Egg Cartons - Bulk Pack",
        description: "Premium cardboard egg cartons. Perfect for selling your fresh eggs!",
        image: null,
        cta: "Order Now",
        sponsor: "PackagingPro",
        url: "https://example.com/", 
        price: "100 pack - $32.99"
      }
    ],
    square: [
      {
        title: "Chicken Coop Heater",
        description: "Safe, energy-efficient heating for winter. Thermostat controlled.",
        image: null,
        cta: "Buy Now",
        sponsor: "FarmTech",
        url: "https://example.com/",
        price: "$45.99"
      },
      {
        title: "Organic Layer Pellets",
        description: "Non-GMO certified feed for healthier hens and better eggs.",
        image: null, 
        cta: "Shop Feed",
        sponsor: "Nature's Best",
        url: "https://example.com/",
        price: "$28.50/bag"
      }
    ],
    small: [
      {
        title: "Poultry Insurance",
        description: "Protect your flock with comprehensive livestock coverage",
        cta: "Get Quote",
        sponsor: "AgriShield Insurance",
        url: "https://example.com/"
      },
      {
        title: "Free Farm Newsletter",
        description: "Weekly tips, market prices, and expert advice delivered to your inbox",
        cta: "Subscribe",
        sponsor: "Modern Farmer",
        url: "https://example.com/"
      }
    ]
  };

  // Randomly select an ad from the type array
  const adArray = ads[type] || ads.banner;
  const ad = adArray[Math.floor(Math.random() * adArray.length)];

  const handleAdClick = () => {
    console.log(`Ad clicked: ${ad.title} by ${ad.sponsor}`);
    // Open the ad URL
    if (ad.url) {
      window.open(ad.url, '_blank');
    }
  };

  const handleClose = (e) => {
    e.stopPropagation();
    e.target.closest('.test-ad').style.display = 'none';
  };

  if (type === "small") {
    return (
      <div className={`test-ad bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 relative group hover:shadow-md transition-all cursor-pointer ${className}`} onClick={handleAdClick}>
        <button 
          onClick={handleClose}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
          <div className="w-3 h-3 bg-yellow-400 rounded-sm flex items-center justify-center">
            <span className="text-white text-xs font-bold">Ad</span>
          </div>
          <span>Sponsored</span>
        </div>
        <h4 className="font-semibold text-gray-800 text-sm mb-1">{ad.title}</h4>
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{ad.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{ad.sponsor}</span>
          <button 
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if (ad.url) window.open(ad.url, '_blank');
            }}
          >
            {ad.cta}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`test-ad bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all group cursor-pointer ${className}`} onClick={handleAdClick}>
      <button 
        onClick={handleClose}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-1 text-gray-400 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="relative">
        <div className="flex items-center gap-1 text-xs text-gray-500 absolute top-2 left-2 bg-white/90 px-2 py-1 rounded z-10">
          <div className="w-3 h-3 bg-yellow-400 rounded-sm flex items-center justify-center">
            <span className="text-white text-xs font-bold">Ad</span>
          </div>
          <span>Sponsored</span>
        </div>
        
        <div className={`${type === "banner" ? "h-24 sm:h-32" : "h-48"} bg-gray-100 overflow-hidden flex items-center justify-center`}>
          <div className="text-gray-400 text-lg font-medium">Ad Space</div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-800 text-sm leading-tight pr-2">{ad.title}</h3>
          <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ad.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">{ad.sponsor}</span>
            {ad.price && (
              <span className="text-sm font-semibold text-green-600">{ad.price}</span>
            )}
          </div>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors font-medium"
            onClick={(e) => {
              e.stopPropagation();
              if (ad.url) window.open(ad.url, '_blank');
            }}
          >
            {ad.cta}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestAd;
