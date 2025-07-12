import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SellerLocation = () => {
  const [location, setLocation] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch seller location from API (if exists)
    const fetchLocation = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/seller/location`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLocation(data);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchLocation();
  }, []);

  const handleChange = (e) => {
    setLocation((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess(false);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/seller/location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(location),
      });
      if (!res.ok) throw new Error("Failed to save location");
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Store Pickup Location</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <Label htmlFor="street">Street Address</Label>
          <Input
            id="street"
            name="street"
            value={location.street}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            value={location.city}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="state">State/Province</Label>
          <Input
            id="state"
            name="state"
            value={location.state}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="zipCode">ZIP/Postal Code</Label>
          <Input
            id="zipCode"
            name="zipCode"
            value={location.zipCode}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            value={location.country}
            onChange={handleChange}
            required
          />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && (
          <div className="text-green-600 text-sm">Location saved!</div>
        )}
        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Location"}
        </Button>
      </form>
    </div>
  );
};

export default SellerLocation;
