import React, { useEffect, useState } from "react";

const ApiDebug = () => {
  const [apiUrl, setApiUrl] = useState("");

  useEffect(() => {
    // Get the API URL from environment variable
    const url = import.meta.env.VITE_API_URL || "Not set";
    setApiUrl(url);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white p-3 rounded shadow-lg border text-xs z-50">
      <h4 className="font-bold mb-1">Debug Info:</h4>
      <p>
        <strong>API URL:</strong> {apiUrl}
      </p>
    </div>
  );
};

export default ApiDebug;
