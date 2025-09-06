import React, { useState } from 'react';
import { Input } from "@/components/ui/input";

// Breed data organized by category
const breedsByCategory = {
  chicken: [
    "Rhode Island Red",
    "Leghorn", 
    "Buff Orpington",
    "Australorp",
    "Sussex",
    "Wyandotte",
    "Cornish Cross",
    "Silkie",
    "Marans",
    "Ameraucana",
    "Barred Plymouth Rock",
    "New Hampshire Red",
    "Brahma",
    "Cochin",
    "Polish",
    "Bantam",
    "Ancona",
    "Araucana",
    "Delaware",
    "Jersey Giant",
    "Orpington",
    "Faverolles",
    "Hamburg",
    "Houdan",
    "La Fleche",
    "Langshan",
    "Minorca",
    "Modern Game",
    "Old English Game",
    "Phoenix",
    "Redcap",
    "Rosecomb",
    "Sebright",
    "Spanish",
    "Sultan",
    "Sumatra",
    "Mixed Breed"
  ],
  duck: [
    "Mallard",
    "Pekin",
    "Rouen",
    "Khaki Campbell",
    "Indian Runner",
    "Cayuga",
    "Swedish",
    "Welsh Harlequin",
    "Buff Orpington",
    "Crested",
    "Call Duck",
    "Muscovy",
    "Mixed Breed"
  ],
  turkey: [
    "Bronze",
    "Bourbon Red",
    "Narragansett",
    "Royal Palm",
    "Black Spanish",
    "White Holland",
    "Slate",
    "Broad Breasted White",
    "Heritage Mixed",
    "Mixed Breed"
  ],
  other: [
    "Goose",
    "Guinea Fowl",
    "Quail",
    "Pheasant",
    "Mixed Poultry"
  ]
};

const BreedSelect = ({ 
  category = "chicken", 
  value, 
  onChange, 
  onValueChange, 
  name, 
  className = "", 
  required = false, 
  multiple = false 
}) => {
  // Whether we're showing the custom text input
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customBreed, setCustomBreed] = useState("");

  // Get breeds for the selected category
  const availableBreeds = breedsByCategory[category] || breedsByCategory.chicken;

  // Keep component controlled: if the incoming value is not one of the available
  // breeds and is a non-empty string, treat it as a custom breed and show the
  // custom input with that value.
  React.useEffect(() => {
    if (multiple) return; // skip for multiple selects
    if (value && value !== "" && !availableBreeds.includes(value)) {
      setShowCustomInput(true);
      setCustomBreed(value);
    } else {
      setShowCustomInput(false);
      // clear customBreed when value is a known breed or empty
      if (!value) setCustomBreed("");
    }
  }, [value, category, availableBreeds, multiple]);

  const handleChange = (e) => {
    const selectedValue = e.target.value;

    // If user chooses the "Other" option, open custom input and don't emit
    // a value yet. The calling form should receive the typed value when the
    // user enters it.
    if (selectedValue === "Other") {
      setShowCustomInput(true);
      // clear any previous custom value so the input starts empty
      setCustomBreed("");
      if (onChange) onChange("");
      if (onValueChange) onValueChange("");
      return;
    }

    setShowCustomInput(false);
    setCustomBreed("");

    const finalValue = multiple 
      ? Array.from(e.target.selectedOptions, option => option.value)
      : selectedValue;

    // Support both onChange and onValueChange props
    if (onChange) onChange(finalValue);
    if (onValueChange) onValueChange(finalValue);
  };

  const handleCustomBreedChange = (e) => {
    const customValue = e.target.value;
    setCustomBreed(customValue);

    if (onChange) onChange(customValue);
    if (onValueChange) onValueChange(customValue);
  };

  const handleCustomBreedKeyDown = (e) => {
    if (e.key === 'Escape') {
      // Cancel custom entry and reset
      setShowCustomInput(false);
      setCustomBreed("");
      if (onChange) onChange("");
      if (onValueChange) onValueChange("");
    }
  };

  // If showing custom input, render a controlled text input so user can type
  if (showCustomInput) {
    return (
      <div className="space-y-2">
        <Input
          value={customBreed}
          onChange={handleCustomBreedChange}
          onKeyDown={handleCustomBreedKeyDown}
          placeholder="Enter custom breed name..."
          className={`${className}`}
          autoFocus
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setShowCustomInput(false);
              setCustomBreed("");
              if (onChange) onChange("");
              if (onValueChange) onValueChange("");
            }}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Cancel
          </button>
          <span className="text-xs text-gray-400">Press Escape to cancel</span>
        </div>
      </div>
    );
  }

  return (
    <select
      name={name}
      value={value || ""}
      onChange={handleChange}
      required={required}
      multiple={multiple}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${className}`}
    >
      <option value="">Select a breed...</option>
      {availableBreeds.map((breed) => (
        <option key={breed} value={breed}>
          {breed}
        </option>
      ))}
      <option value="Other">Other (custom)</option>
    </select>
  );
};

export default BreedSelect;
