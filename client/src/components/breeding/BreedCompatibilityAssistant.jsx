import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Check, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const BreedCompatibilityAssistant = () => {
  const [step, setStep] = useState(1);
  const [selectedBreed1, setSelectedBreed1] = useState("");
  const [selectedBreed2, setSelectedBreed2] = useState("");
  const [experience, setExperience] = useState("");
  const [goal, setGoal] = useState("");

  const compatibilityScore = () => {
    if (!selectedBreed1 || !selectedBreed2) return 0;
    // Simplified scoring - would be more complex in real implementation
    return Math.floor(Math.random() * 30) + 70; // Returns 70-100
  };

  const recommendations = [
    {
      text: "Regular health monitoring",
      importance: "High",
      description: "Check birds daily for signs of stress or health issues",
    },
    {
      text: "Proper nutrition",
      importance: "High",
      description: "Feed balanced diet suitable for breeding pairs",
    },
    {
      text: "Environmental control",
      importance: "Medium",
      description: "Maintain optimal temperature and humidity",
    },
  ];

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#a05e2b]">
              Select Primary Breed
            </h3>
            <Select value={selectedBreed1} onValueChange={setSelectedBreed1}>
              <SelectTrigger>
                <SelectValue placeholder="Choose first breed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breed1">Plymouth Rock</SelectItem>
                <SelectItem value="breed2">Rhode Island Red</SelectItem>
                <SelectItem value="breed3">Wyandotte</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#a05e2b]">
              Select Secondary Breed
            </h3>
            <Select value={selectedBreed2} onValueChange={setSelectedBreed2}>
              <SelectTrigger>
                <SelectValue placeholder="Choose second breed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breed1">Plymouth Rock</SelectItem>
                <SelectItem value="breed2">Rhode Island Red</SelectItem>
                <SelectItem value="breed3">Wyandotte</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#a05e2b]">
              Your Experience Level
            </h3>
            <Select value={experience} onValueChange={setExperience}>
              <SelectTrigger>
                <SelectValue placeholder="Select your experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#a05e2b]">
              Breeding Goals
            </h3>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger>
                <SelectValue placeholder="Select your goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eggs">Egg Production</SelectItem>
                <SelectItem value="meat">Meat Production</SelectItem>
                <SelectItem value="dual">Dual Purpose</SelectItem>
                <SelectItem value="show">Show Birds</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-[#a05e2b] mb-2">
                Compatibility Score
              </h3>
              <div className="relative">
                <Progress value={compatibilityScore()} className="h-3" />
                <span className="absolute right-0 -top-6 text-sm font-medium text-[#a05e2b]">
                  {compatibilityScore()}%
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-[#a05e2b] mb-3">
                Key Recommendations
              </h3>
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-[#fff5e8] rounded-lg"
                  >
                    <div className="mt-1">
                      <Check className="h-5 w-5 text-[#ffb464]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-[#a05e2b]">
                          {rec.text}
                        </h4>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-[#ffb464]" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{rec.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-sm text-[#b06a30]">
                        Importance: {rec.importance}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="breeding-assistant-card border-[#ffb464]/30">
      <CardHeader className="bg-gradient-to-r from-[#fff5e8] to-[#ffeed7]">
        <CardTitle className="text-[#a05e2b] flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Breed Compatibility Assistant
        </CardTitle>
        <CardDescription className="text-[#b06a30]">
          Let us help you choose the right breeding pairs
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4, 5].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step >= stepNumber
                    ? "bg-gradient-to-r from-[#ffb464] to-[#ffa040] text-white"
                    : "bg-[#fff5e8] text-[#b06a30]"
                }`}
              >
                {stepNumber}
              </div>
            ))}
          </div>
          <div className="relative w-full h-1 bg-[#fff5e8] rounded-full">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#ffb464] to-[#ffa040] rounded-full transition-all duration-300"
              style={{ width: `${((step - 1) / 4) * 100}%` }}
            />
          </div>
        </div>

        {renderStep()}

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
            className="border-[#ffb464]/50 hover:bg-[#fff5e8] text-[#a05e2b]"
          >
            Back
          </Button>
          <Button
            onClick={nextStep}
            disabled={step === 5}
            className="bg-gradient-to-r from-[#ffb464] to-[#ffa040] text-white hover:opacity-90"
          >
            {step === 4 ? "View Results" : "Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BreedCompatibilityAssistant;
