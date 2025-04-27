import React, { useState, useEffect } from "react";
import { breedDatabase } from "../data/breedDatabase";
import breedingService from "../services/breedingService";
import "./BreedingCalculator.css";

const BreedingCalculator = () => {
  const [breeds, setBreeds] = useState([]);
  const [breed1, setBreed1] = useState(null);
  const [breed2, setBreed2] = useState(null);
  const [compatibilityResults, setCompatibilityResults] = useState(null);
  const [offspringTraits, setOffspringTraits] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [activeTab, setActiveTab] = useState("compatibility");

  useEffect(() => {
    // Load breeds from database
    setBreeds(Object.keys(breedDatabase).sort());
  }, []);

  useEffect(() => {
    if (breed1 && breed2) {
      const compatibility = breedingService.calculateCompatibility(
        breed1.name,
        breed2.name
      );
      setCompatibilityResults(compatibility);

      const traits = breedingService.predictOffspring(breed1.name, breed2.name);
      setOffspringTraits(traits);

      const recs = breedingService.generateBreedingRecommendations(
        breed1.name,
        breed2.name
      );
      setRecommendations(recs);
    } else {
      setCompatibilityResults(null);
      setOffspringTraits(null);
      setRecommendations([]);
    }
  }, [breed1, breed2]);

  const handleBreed1Change = (e) => {
    const selectedBreed = breedDatabase.find(
      (breed) => breed.id === Number(e.target.value)
    );
    setBreed1(selectedBreed);
  };

  const handleBreed2Change = (e) => {
    const selectedBreed = breedDatabase.find(
      (breed) => breed.id === Number(e.target.value)
    );
    setBreed2(selectedBreed);
  };

  const resetCalculator = () => {
    setBreed1(null);
    setBreed2(null);
    setCompatibilityResults(null);
    setOffspringTraits(null);
    setRecommendations([]);
    setActiveTab("compatibility");
  };

  const renderCompatibility = () => {
    if (!compatibilityResults)
      return <p>Select two breeds and calculate compatibility</p>;

    return (
      <div className="compatibility-results">
        <div className="score-display">
          <div
            className="score-circle"
            style={{
              background: `conic-gradient(
                ${
                  compatibilityResults.score >= 75
                    ? "#4CAF50"
                    : compatibilityResults.score >= 50
                    ? "#FFC107"
                    : "#F44336"
                } 
                ${compatibilityResults.score * 3.6}deg, 
                #e0e0e0 ${compatibilityResults.score * 3.6}deg 360deg)`,
            }}
          >
            <span className="score-text">{compatibilityResults.score}%</span>
          </div>
          <h3>{compatibilityResults.description}</h3>
        </div>

        {compatibilityResults.factors.length > 0 && (
          <div className="factors">
            <h4>Key Factors:</h4>
            <ul>
              {compatibilityResults.factors.map((factor, index) => (
                <li
                  key={index}
                  className={
                    factor.includes("mismatch") || factor.includes("concern")
                      ? "negative-factor"
                      : "positive-factor"
                  }
                >
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderOffspring = () => {
    if (!offspringTraits)
      return (
        <p>Select two breeds and calculate to see offspring predictions</p>
      );
    if (offspringTraits.error)
      return <p className="error">{offspringTraits.error}</p>;

    return (
      <div className="offspring-results">
        <div className="confidence-rating">
          <h4>
            Prediction Confidence: {offspringTraits.confidenceRating.rating}%
          </h4>
          <p>{offspringTraits.confidenceRating.description}</p>
        </div>

        <div className="offspring-traits">
          <h4>Predicted Offspring Traits:</h4>

          <div className="trait-grid">
            <div className="trait-item">
              <strong>Egg Production:</strong>{" "}
              {offspringTraits.eggProduction.annual} eggs/year
            </div>
            <div className="trait-item">
              <strong>Egg Size:</strong> {offspringTraits.eggProduction.eggSize}
            </div>
            <div className="trait-item">
              <strong>Egg Color:</strong> {offspringTraits.eggColor}
            </div>
            <div className="trait-item">
              <strong>Weight (Rooster):</strong>{" "}
              {offspringTraits.weight.rooster} lbs
            </div>
            <div className="trait-item">
              <strong>Weight (Hen):</strong> {offspringTraits.weight.hen} lbs
            </div>
            <div className="trait-item">
              <strong>Temperament:</strong>{" "}
              {offspringTraits.temperament.join(", ")}
            </div>
            <div className="trait-item">
              <strong>Broodiness:</strong> {offspringTraits.broodiness}
            </div>
            <div className="trait-item">
              <strong>Feather Color:</strong> {offspringTraits.featherColor}
            </div>
            <div className="trait-item">
              <strong>Comb Type:</strong> {offspringTraits.combType}
            </div>
            <div className="trait-item">
              <strong>Foraging Ability:</strong>{" "}
              {offspringTraits.foragingAbility}
            </div>
            <div className="trait-item">
              <strong>Climate Adaptability:</strong>{" "}
              {offspringTraits.climateAdaptability}
            </div>
            <div className="trait-item">
              <strong>Lifespan:</strong> {offspringTraits.lifespan} years
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!recommendations.length)
      return (
        <p>Select two breeds and calculate to see breeding recommendations</p>
      );

    return (
      <div className="recommendations">
        <h4>Breeding Recommendations:</h4>
        <ul className="recommendation-list">
          {recommendations.map((recommendation, index) => (
            <li key={index}>{recommendation}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="breeding-calculator">
      <h2>Breeding Compatibility Calculator</h2>
      <p className="calculator-description">
        Select two dog breeds to calculate their breeding compatibility, predict
        offspring traits, and receive breeding recommendations.
      </p>

      <div className="breed-selectors">
        <div className="breed-selector">
          <label htmlFor="breed1">First Breed:</label>
          <select
            id="breed1"
            value={breed1?.id || ""}
            onChange={handleBreed1Change}
          >
            <option value="">Select a breed</option>
            {breedDatabase.map((breed) => (
              <option key={breed.id} value={breed.id}>
                {breed.name}
              </option>
            ))}
          </select>

          {breed1 && (
            <div className="breed-info">
              <p>
                <strong>Size:</strong> {breed1.size}
              </p>
              <p>
                <strong>Temperament:</strong> {breed1.temperament.join(", ")}
              </p>
              <p>
                <strong>Energy Level:</strong> {breed1.energyLevel}
              </p>
            </div>
          )}
        </div>

        <div className="breed-selector">
          <label htmlFor="breed2">Second Breed:</label>
          <select
            id="breed2"
            value={breed2?.id || ""}
            onChange={handleBreed2Change}
          >
            <option value="">Select a breed</option>
            {breedDatabase.map((breed) => (
              <option key={breed.id} value={breed.id}>
                {breed.name}
              </option>
            ))}
          </select>

          {breed2 && (
            <div className="breed-info">
              <p>
                <strong>Size:</strong> {breed2.size}
              </p>
              <p>
                <strong>Temperament:</strong> {breed2.temperament.join(", ")}
              </p>
              <p>
                <strong>Energy Level:</strong> {breed2.energyLevel}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="calculator-actions">
        <button className="reset-button" onClick={resetCalculator}>
          Reset
        </button>
      </div>

      {breed1 && breed2 && compatibilityResults && (
        <div className="results-container">
          <div className="compatibility-score">
            <div
              className="score-circle"
              style={{
                background: `conic-gradient(
                ${
                  compatibilityResults.score >= 75
                    ? "#4CAF50"
                    : compatibilityResults.score >= 50
                    ? "#FFC107"
                    : "#F44336"
                } 
                ${compatibilityResults.score * 3.6}deg, 
                #e0e0e0 ${compatibilityResults.score * 3.6}deg 360deg)`,
              }}
            >
              <span>{compatibilityResults.score}%</span>
              <p>Compatibility</p>
            </div>
            <p className="confidence-level">
              Confidence:{" "}
              <span
                className={`confidence-${compatibilityResults.confidenceLevel.toLowerCase()}`}
              >
                {compatibilityResults.confidenceLevel}
              </span>
            </p>
          </div>

          <div className="result-tabs">
            <div className="tab-headers">
              <button
                className={`tab-button ${
                  activeTab === "compatibility" ? "active" : ""
                }`}
                onClick={() => setActiveTab("compatibility")}
              >
                Compatibility Factors
              </button>
              <button
                className={`tab-button ${
                  activeTab === "offspring" ? "active" : ""
                }`}
                onClick={() => setActiveTab("offspring")}
              >
                Potential Offspring
              </button>
              <button
                className={`tab-button ${
                  activeTab === "recommendations" ? "active" : ""
                }`}
                onClick={() => setActiveTab("recommendations")}
              >
                Recommendations
              </button>
            </div>

            <div className="tab-content">
              {activeTab === "compatibility" && renderCompatibility()}
              {activeTab === "offspring" && renderOffspring()}
              {activeTab === "recommendations" && renderRecommendations()}
            </div>
          </div>
        </div>
      )}

      {(!breed1 || !breed2) && (
        <div className="placeholder-message">
          <p>Select two breeds to see compatibility results</p>
        </div>
      )}

      <div className="disclaimer">
        <p>
          <strong>Disclaimer:</strong> This calculator provides estimates based
          on general breed characteristics. Individual dogs may vary. Always
          consult with a veterinarian or professional dog breeder before making
          breeding decisions.
        </p>
      </div>
    </div>
  );
};

export default BreedingCalculator;
