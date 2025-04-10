import React, { useState, useEffect } from "react";

const BouncingChicken = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Random movement effect
  useEffect(() => {
    const interval = setInterval(() => {
      setPosition({
        x: Math.random() * 20 - 10, // Random x position between -10 and 10
        y: Math.random() * 10 - 5, // Random y position between -5 and 5
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Trigger animation on hover
  const handleMouseEnter = () => setIsAnimating(true);
  const handleMouseLeave = () => setIsAnimating(false);

  return (
    <div
      className="relative w-64 h-64 flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl animate-pulse"></div>

      {/* Chicken container with floating animation */}
      <div
        className={`relative transition-transform duration-1000 ease-in-out ${
          isAnimating ? "scale-110" : "scale-100"
        }`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: "transform 2s ease-in-out",
        }}
      >
        {/* Chicken body with improved bounce animation */}
        <div className="w-32 h-32 bg-[#ffb761] rounded-full relative animate-[bounce_3s_ease-in-out_infinite] shadow-lg">
          {/* Chicken head with improved positioning */}
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-[#ffb761] rounded-full">
            {/* Chicken beak with improved shape */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-6 h-4 bg-orange-600 rounded-md"></div>

            {/* Chicken eyes with animation */}
            <div className="absolute top-3 left-3 w-3 h-3 bg-black rounded-full animate-[blink_4s_ease-in-out_infinite]"></div>
            <div className="absolute top-3 right-3 w-3 h-3 bg-black rounded-full animate-[blink_4s_ease-in-out_infinite]"></div>

            {/* Chicken comb with improved shape */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-5 bg-red-500 rounded-t-full"></div>
          </div>

          {/* Chicken wings with flapping animation */}
          <div
            className={`absolute top-8 -left-6 w-10 h-14 bg-[#e69e4d] rounded-l-full transform origin-right transition-transform duration-300 ${
              isAnimating ? "rotate-12" : "rotate-0"
            }`}
          ></div>
          <div
            className={`absolute top-8 -right-6 w-10 h-14 bg-[#e69e4d] rounded-r-full transform origin-left transition-transform duration-300 ${
              isAnimating ? "-rotate-12" : "rotate-0"
            }`}
          ></div>

          {/* Chicken feet with improved shape */}
          <div className="absolute -bottom-3 left-8 w-3 h-6 bg-orange-600 rounded-b-full transform -rotate-12"></div>
          <div className="absolute -bottom-3 right-8 w-3 h-6 bg-orange-600 rounded-b-full transform rotate-12"></div>
        </div>

        {/* Eggs with improved animation */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex justify-center gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`w-6 h-8 bg-gradient-to-b from-orange-100 to-orange-200 rounded-full border border-orange-300 shadow-sm ${
                isAnimating ? "animate-bounce" : ""
              }`}
              style={{
                animationDelay: `${i * 0.2}s`,
                transform: `translateY(${
                  Math.sin(Date.now() / 1000 + i) * 5
                }px)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Particle effects */}
      {isAnimating && (
        <>
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-[float_3s_ease-in-out_infinite]"></div>
          <div
            className="absolute top-1/3 right-1/4 w-2 h-2 bg-secondary/30 rounded-full animate-[float_3s_ease-in-out_infinite]"
            style={{ animationDelay: "0.5s" }}
          ></div>
          <div
            className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-primary/30 rounded-full animate-[float_3s_ease-in-out_infinite]"
            style={{ animationDelay: "1s" }}
          ></div>
        </>
      )}
    </div>
  );
};

export default BouncingChicken;
