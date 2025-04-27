import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink } from "lucide-react";

const RecommendedBreedingStock = ({ projects, activePairs }) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    // Generate recommendations based on active projects and pairs
    const generateRecommendations = () => {
      const recs = [];

      // Look for complementary breeding stock based on current pairs
      if (activePairs && activePairs.length > 0) {
        activePairs.forEach((pair) => {
          // Recommend replacements or additional stock with similar traits
          if (Math.random() > 0.5) {
            // Simplified logic - in real app would use actual trait matching
            recs.push({
              id: `rec-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 5)}`,
              name: `${pair.sire.breed} Rooster`,
              breed: pair.sire.breed,
              image: "/1f425.png",
              price: Math.floor(Math.random() * 50) + 30,
              relevance:
                "Compatible replacement for your current breeding program",
              matchScore: Math.floor(Math.random() * 20) + 80,
            });
          } else {
            recs.push({
              id: `rec-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 5)}`,
              name: `${pair.dam.breed} Hen`,
              breed: pair.dam.breed,
              image: "/1f425.png",
              price: Math.floor(Math.random() * 40) + 25,
              relevance:
                "Expands your current breeding flock with compatible genetics",
              matchScore: Math.floor(Math.random() * 20) + 80,
            });
          }
        });
      }

      // Add recommendations based on projects
      if (projects && projects.length > 0) {
        projects.forEach((project) => {
          // Recommend new stock that would enhance project goals
          recs.push({
            id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: `Premium ${project.primaryBreed} Breeding Stock`,
            breed: project.primaryBreed || "Mixed Breed",
            image: "/1f425.png",
            price: Math.floor(Math.random() * 60) + 40,
            relevance: `Perfect addition to your ${project.name} project`,
            matchScore: Math.floor(Math.random() * 15) + 85,
          });
        });
      }

      // Add some general high-quality breeding stock recommendations
      const commonBreeds = [
        "Rhode Island Red",
        "Plymouth Rock",
        "Orpington",
        "Leghorn",
        "Wyandotte",
        "Sussex",
      ];
      const randomBreeds = commonBreeds
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      randomBreeds.forEach((breed) => {
        recs.push({
          id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: `Show Quality ${breed}`,
          breed: breed,
          image: "/1f425.png",
          price: Math.floor(Math.random() * 70) + 50,
          relevance: "Exceptional genetics for starting a new breeding line",
          matchScore: Math.floor(Math.random() * 20) + 75,
        });
      });

      // Sort by match score
      return recs.sort((a, b) => b.matchScore - a.matchScore);
    };

    setRecommendations(generateRecommendations());
  }, [projects, activePairs]);

  const viewProduct = (id) => {
    navigate(`/products/${id}`);
  };

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-md border-[#ffb464]/30">
      <CardHeader className="bg-gradient-to-r from-[#fff5e8] to-[#ffeed7]">
        <CardTitle className="text-[#a05e2b] flex items-center justify-between">
          Recommended Breeding Stock
          <Button
            variant="ghost"
            size="sm"
            className="text-[#a05e2b] hover:text-[#d37b33] hover:bg-[#ffeed7]"
            onClick={() => navigate("/products?category=breeding")}
          >
            View All <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription className="text-[#b06a30]">
          Selected based on your breeding projects and goals
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        <ScrollArea className="h-[350px]">
          <div className="grid gap-4">
            {recommendations.slice(0, 6).map((product) => (
              <div
                key={product.id}
                className="flex items-center space-x-4 p-3 border border-[#ffb464]/20 rounded-lg hover:border-[#ffb464]/50 transition-all hover:bg-[#fff5e8]/50 cursor-pointer"
                onClick={() => viewProduct(product.id)}
              >
                <div className="w-16 h-16 rounded-md bg-[#fff5e8] flex items-center justify-center overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-[#a05e2b]">
                      {product.name}
                    </h4>
                    <Badge className="bg-[#fff5e8] text-[#a05e2b]">
                      ${product.price}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#b06a30]">{product.breed}</p>
                  <p className="text-xs text-[#b06a30] mt-1">
                    {product.relevance}
                  </p>
                  <div className="flex items-center mt-1">
                    <div className="h-1.5 flex-1 bg-[#fff5e8] rounded-full">
                      <div
                        className="h-full bg-gradient-to-r from-[#ffb464] to-[#ffa040] rounded-full"
                        style={{ width: `${product.matchScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-[#a05e2b] ml-2">
                      {product.matchScore}% match
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecommendedBreedingStock;
