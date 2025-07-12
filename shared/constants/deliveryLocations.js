// Shared delivery location constants
// Keep frontend and backend in sync for supported delivery areas

const DELIVERY_LOCATIONS = {
  "Metro Manila": [
    { value: "manila", label: "Manila", coordinates: { lat: 14.5995, lng: 120.9842 } },
    { value: "quezon city", label: "Quezon City", coordinates: { lat: 14.6760, lng: 121.0437 } },
    { value: "makati", label: "Makati", coordinates: { lat: 14.5547, lng: 121.0244 } },
    { value: "taguig", label: "Taguig", coordinates: { lat: 14.5176, lng: 121.0509 } },
    { value: "pasig", label: "Pasig", coordinates: { lat: 14.5764, lng: 121.0851 } },
    { value: "mandaluyong", label: "Mandaluyong", coordinates: { lat: 14.5832, lng: 121.0409 } },
    { value: "parañaque", label: "Parañaque", coordinates: { lat: 14.4793, lng: 121.0198 } },
    { value: "las piñas", label: "Las Piñas", coordinates: { lat: 14.4542, lng: 120.9936 } },
    { value: "muntinlupa", label: "Muntinlupa", coordinates: { lat: 14.4116, lng: 121.0390 } },
    { value: "san juan", label: "San Juan", coordinates: { lat: 14.6019, lng: 121.0355 } },
    { value: "marikina", label: "Marikina", coordinates: { lat: 14.6507, lng: 121.1029 } },
    { value: "pasay", label: "Pasay", coordinates: { lat: 14.5378, lng: 120.9956 } },
    { value: "caloocan", label: "Caloocan", coordinates: { lat: 14.6588, lng: 120.9672 } },
    { value: "malabon", label: "Malabon", coordinates: { lat: 14.6572, lng: 120.9565 } },
    { value: "navotas", label: "Navotas", coordinates: { lat: 14.6686, lng: 120.9472 } },
    { value: "valenzuela", label: "Valenzuela", coordinates: { lat: 14.7086, lng: 120.9830 } },
    { value: "pateros", label: "Pateros", coordinates: { lat: 14.5433, lng: 121.0697 } }
  ],
  "Cavite": [
    { value: "cavite city", label: "Cavite City", coordinates: { lat: 14.2834, lng: 120.8531 } },
    { value: "bacoor", label: "Bacoor", coordinates: { lat: 14.4584, lng: 120.9526 } },
    { value: "imus", label: "Imus", coordinates: { lat: 14.4297, lng: 120.9370 } },
    { value: "dasmariñas", label: "Dasmariñas", coordinates: { lat: 14.3294, lng: 120.9367 } },
    { value: "general trias", label: "General Trias", coordinates: { lat: 14.3874, lng: 120.8810 } },
    { value: "kawit", label: "Kawit", coordinates: { lat: 14.4408, lng: 120.9045 } },
    { value: "noveleta", label: "Noveleta", coordinates: { lat: 14.4282, lng: 120.8764 } },
    { value: "rosario", label: "Rosario", coordinates: { lat: 14.4156, lng: 120.8587 } },
    { value: "silang", label: "Silang", coordinates: { lat: 14.2306, lng: 120.9722 } },
    { value: "carmona", label: "Carmona", coordinates: { lat: 14.3167, lng: 121.0500 } }
  ],
  "Laguna": [
    { value: "santa rosa", label: "Santa Rosa", coordinates: { lat: 14.3119, lng: 121.1115 } },
    { value: "biñan", label: "Biñan", coordinates: { lat: 14.3386, lng: 121.0860 } },
    { value: "san pedro", label: "San Pedro", coordinates: { lat: 14.3583, lng: 121.0474 } },
    { value: "calamba", label: "Calamba", coordinates: { lat: 14.2119, lng: 121.1652 } },
    { value: "los baños", label: "Los Baños", coordinates: { lat: 14.1692, lng: 121.2264 } },
    { value: "cabuyao", label: "Cabuyao", coordinates: { lat: 14.2789, lng: 121.1253 } },
    { value: "san pablo", label: "San Pablo", coordinates: { lat: 14.0683, lng: 121.3256 } },
    { value: "sta. cruz", label: "Sta. Cruz", coordinates: { lat: 14.2811, lng: 121.4158 } },
    { value: "pagsanjan", label: "Pagsanjan", coordinates: { lat: 14.2725, lng: 121.4567 } },
    { value: "calauan", label: "Calauan", coordinates: { lat: 14.1453, lng: 121.3189 } }
  ],
  "Batangas": [
    { value: "batangas city", label: "Batangas City", coordinates: { lat: 13.7564, lng: 121.0581 } },
    { value: "lipa", label: "Lipa", coordinates: { lat: 13.9411, lng: 121.1624 } },
    { value: "tanauan", label: "Tanauan", coordinates: { lat: 14.0865, lng: 121.1487 } },
    { value: "santo tomas", label: "Santo Tomas", coordinates: { lat: 14.1078, lng: 121.1418 } },
    { value: "malvar", label: "Malvar", coordinates: { lat: 14.0447, lng: 121.1603 } },
    { value: "lemery", label: "Lemery", coordinates: { lat: 13.9167, lng: 120.8833 } },
    { value: "taal", label: "Taal", coordinates: { lat: 14.0022, lng: 120.9250 } },
    { value: "nasugbu", label: "Nasugbu", coordinates: { lat: 14.0717, lng: 120.6347 } }
  ],
  "Rizal": [
    { value: "antipolo", label: "Antipolo", coordinates: { lat: 14.5878, lng: 121.1760 } },
    { value: "cainta", label: "Cainta", coordinates: { lat: 14.5833, lng: 121.1217 } },
    { value: "taytay", label: "Taytay", coordinates: { lat: 14.5674, lng: 121.1324 } },
    { value: "marikina", label: "Marikina", coordinates: { lat: 14.6507, lng: 121.1029 } },
    { value: "san mateo", label: "San Mateo", coordinates: { lat: 14.6969, lng: 121.1219 } },
    { value: "angono", label: "Angono", coordinates: { lat: 14.5261, lng: 121.1531 } },
    { value: "binangonan", label: "Binangonan", coordinates: { lat: 14.4644, lng: 121.1928 } },
    { value: "teresa", label: "Teresa", coordinates: { lat: 14.5597, lng: 121.2067 } },
    { value: "morong", label: "Morong", coordinates: { lat: 14.5181, lng: 121.2378 } }
  ]
};

// Generate flat lookup for coordinates
const CITY_COORDINATE_LOOKUP = {};
Object.values(DELIVERY_LOCATIONS).forEach(cities => {
  cities.forEach(city => {
    CITY_COORDINATE_LOOKUP[city.value] = city.coordinates;
  });
});

// Generate province list
const PROVINCES = Object.keys(DELIVERY_LOCATIONS).map(province => ({
  value: province,
  label: province
}));

// Utility functions
const isDeliverySupported = (city, province) => {
  if (!city || !province) return false;
  return DELIVERY_LOCATIONS[province]?.some(c => c.value === city.toLowerCase());
};

const getCityCoordinates = (city) => {
  return CITY_COORDINATE_LOOKUP[city.toLowerCase()] || { lat: 14.5995, lng: 120.9842 }; // Default to Manila
};

module.exports = {
  DELIVERY_LOCATIONS,
  CITY_COORDINATE_LOOKUP,
  PROVINCES,
  isDeliverySupported,
  getCityCoordinates
};
