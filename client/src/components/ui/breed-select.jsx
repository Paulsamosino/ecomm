import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const breeds = {
  chicken: [
    // Heritage Breeds
    { name: "Rhode Island Red", category: "heritage", purpose: "dual-purpose" },
    { name: "Plymouth Rock", category: "heritage", purpose: "dual-purpose" },
    { name: "Leghorn", category: "heritage", purpose: "egg production" },
    { name: "Orpington", category: "heritage", purpose: "dual-purpose" },
    { name: "Wyandotte", category: "heritage", purpose: "dual-purpose" },
    // Hybrid Breeds
    { name: "ISA Brown", category: "hybrid", purpose: "egg production" },
    { name: "Golden Comet", category: "hybrid", purpose: "egg production" },
    { name: "Black Star", category: "hybrid", purpose: "egg production" },
    // Meat Breeds
    { name: "Cornish Cross", category: "hybrid", purpose: "meat" },
    { name: "Rangers", category: "hybrid", purpose: "meat" },
    // Bantam Breeds
    { name: "Sebright", category: "bantam", purpose: "ornamental" },
    { name: "Japanese", category: "bantam", purpose: "ornamental" },
  ],
  duck: [
    "Pekin",
    "Mallard",
    "Runner",
    "Khaki Campbell",
    "Muscovy",
    "Welsh Harlequin",
    "Cayuga",
    "Rouen",
  ],
  turkey: [
    "Broad Breasted White",
    "Broad Breasted Bronze",
    "Bourbon Red",
    "Narragansett",
    "Royal Palm",
    "Blue Slate",
    "Black Spanish",
  ],
  other: ["Guinea Fowl", "Quail", "Pheasant", "Peacock", "Goose"],
};

const BreedSelect = ({ category, value, onValueChange, className }) => {
  const breedList = breeds[category] || [];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select breed" />
      </SelectTrigger>
      <SelectContent>
        {category === "chicken" ? (
          <>
            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
              Heritage & Standard Breeds
            </div>
            {breedList
              .filter((breed) => breed.category === "heritage")
              .map((breed) => (
                <SelectItem key={breed.name} value={breed.name}>
                  {breed.name}
                </SelectItem>
              ))}

            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground mt-2">
              Hybrid Breeds
            </div>
            {breedList
              .filter((breed) => breed.category === "hybrid")
              .map((breed) => (
                <SelectItem key={breed.name} value={breed.name}>
                  {breed.name}
                </SelectItem>
              ))}

            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground mt-2">
              Bantam Breeds
            </div>
            {breedList
              .filter((breed) => breed.category === "bantam")
              .map((breed) => (
                <SelectItem key={breed.name} value={breed.name}>
                  {breed.name}
                </SelectItem>
              ))}
          </>
        ) : (
          breedList.map((breed) => (
            <SelectItem key={breed} value={breed}>
              {breed}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default BreedSelect;
