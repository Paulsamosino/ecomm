import React from 'react';

// Chicken breeds data for product listings
const chickenBreeds = [
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
  "Mixed Breed",
  "Other"
];

const BreedSelect = ({ value, onChange, name, className = "", required = false, multiple = false }) => {
  const handleChange = (e) => {
    const selectedValue = multiple 
      ? Array.from(e.target.selectedOptions, option => option.value)
      : e.target.value;
    
    if (onChange) {
      onChange(selectedValue);
    }
  };

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
      {chickenBreeds.map((breed) => (
        <option key={breed} value={breed}>
          {breed}
        </option>
      ))}
    </select>
  );
};

export default BreedSelect;
