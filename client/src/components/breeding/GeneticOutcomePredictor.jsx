import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dna, ChevronRight, ShoppingCart, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

const GeneticOutcomePredictor = () => {
  const [selectedTraits, setSelectedTraits] = useState([]);
  const [predictedOutcomes, setPredictedOutcomes] = useState(null);

  // Sample trait data - would come from API in real implementation
  const availableTraits = {
    eggProduction: [
      { name: "High", probability: 85 },
      { name: "Medium", probability: 60 },
      { name: "Low", probability: 40 },
    ],
    temperament: [
      { name: "Docile", probability: 75 },
      { name: "Moderate", probability: 65 },
      { name: "Active", probability: 45 },
    ],
    size: [
      { name: "Large", probability: 70 },
      { name: "Medium", probability: 80 },
      { name: "Small", probability: 50 },
    ],
    featherColor: [
      { name: "Brown", probability: 90 },
      { name: "White", probability: 65 },
      { name: "Black", probability: 55 },
    ],
  };

  // Sample recommended products
  const recommendedProducts = [
    {
      id: 1,
      name: "Premium Layer Feed",
      price: "$24.99",
      relevance: "Optimal nutrition for egg production",
      image: "https://example.com/feed.jpg",
    },
    {
      id: 2,
      name: "Nesting Boxes (Set of 3)",
      price: "$49.99",
      relevance: "Essential for breeding pairs",
      image: "https://example.com/nesting.jpg",
    },
  ];

  const calculateOutcomes = () => {
    // Simulate outcome calculation
    const outcomes = Object.entries(availableTraits).map(([trait, values]) => {
      const highestProb = Math.max(...values.map((v) => v.probability));
      const mostLikely = values.find((v) => v.probability === highestProb);
      return {
        trait,
        mostLikely: mostLikely.name,
        probability: mostLikely.probability,
      };
    });
    setPredictedOutcomes(outcomes);
  };

  const TraitBadge = ({ trait, selected, onClick }) => (
    <Badge
      className={`cursor-pointer transition-all ${
        selected
          ? "bg-gradient-to-r from-[#ffb464] to-[#ffa040] text-white hover:opacity-90"
          : "bg-[#fff5e8] text-[#a05e2b] hover:bg-[#ffeed7]"
      }`}
      onClick={onClick}
    >
      {trait}
    </Badge>
  );

  return (
    <div className="space-y-6">
      <Card className="border-[#ffb464]/30">
        <CardHeader className="bg-gradient-to-r from-[#fff5e8] to-[#ffeed7]">
          <CardTitle className="text-[#a05e2b] flex items-center gap-2">
            <Dna className="h-5 w-5" />
            Genetic Outcome Predictor
          </CardTitle>
          <CardDescription className="text-[#b06a30]">
            Predict potential offspring traits based on parent characteristics
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Trait Selection */}
            {Object.entries(availableTraits).map(([trait, values]) => (
              <div key={trait} className="space-y-2">
                <h3 className="text-sm font-medium text-[#a05e2b] capitalize">
                  {trait.replace(/([A-Z])/g, " $1").trim()}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {values.map((value) => (
                    <TraitBadge
                      key={value.name}
                      trait={value.name}
                      selected={selectedTraits.includes(
                        `${trait}-${value.name}`
                      )}
                      onClick={() => {
                        const traitId = `${trait}-${value.name}`;
                        setSelectedTraits((prev) =>
                          prev.includes(traitId)
                            ? prev.filter((t) => t !== traitId)
                            : [...prev, traitId]
                        );
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}

            <Button
              onClick={calculateOutcomes}
              className="w-full bg-gradient-to-r from-[#ffb464] to-[#ffa040] text-white hover:opacity-90"
            >
              Calculate Potential Outcomes
            </Button>
          </div>

          {/* Outcomes Display */}
          {predictedOutcomes && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium text-[#a05e2b]">
                Predicted Outcomes
              </h3>
              {predictedOutcomes.map((outcome) => (
                <div
                  key={outcome.trait}
                  className="p-4 bg-[#fff5e8] rounded-lg space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-[#a05e2b] capitalize">
                      {outcome.trait.replace(/([A-Z])/g, " $1").trim()}
                    </h4>
                    <Badge className="bg-[#ffb464] text-white">
                      {outcome.probability}% Likely
                    </Badge>
                  </div>
                  <div className="relative pt-1">
                    <Progress
                      value={outcome.probability}
                      className="h-2"
                      indicatorClassName="bg-gradient-to-r from-[#ffb464] to-[#ffa040]"
                    />
                  </div>
                  <p className="text-sm text-[#b06a30]">
                    Most likely outcome: {outcome.mostLikely}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommended Products */}
      {predictedOutcomes && (
        <Card className="border-[#ffb464]/30">
          <CardHeader className="bg-gradient-to-r from-[#fff5e8] to-[#ffeed7]">
            <CardTitle className="text-[#a05e2b] flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recommended Products
            </CardTitle>
            <CardDescription className="text-[#b06a30]">
              Products that match your breeding goals
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {recommendedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-4 border border-[#ffb464]/20 rounded-lg hover:border-[#ffb464]/50 transition-all"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-[#a05e2b]">
                      {product.name}
                    </h4>
                    <p className="text-sm text-[#b06a30]">
                      {product.relevance}
                    </p>
                    <p className="text-sm font-medium text-[#a05e2b] mt-1">
                      {product.price}
                    </p>
                  </div>
                  <Link to={`/products/${product.id}`}>
                    <Button
                      variant="outline"
                      className="border-[#ffb464]/50 hover:bg-[#fff5e8] text-[#a05e2b]"
                    >
                      View <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="bg-[#fff5e8] flex justify-between items-center">
            <div className="flex items-center gap-2 text-[#b06a30]">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Products tailored to predicted outcomes
              </span>
            </div>
            <Link to="/products">
              <Button
                variant="outline"
                className="border-[#ffb464]/50 hover:bg-white text-[#a05e2b]"
              >
                View All Products
              </Button>
            </Link>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default GeneticOutcomePredictor;
