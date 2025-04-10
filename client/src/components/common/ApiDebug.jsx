import React, { useEffect, useState } from "react";

const ApiDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    apiUrl: "",
    env: "",
    mode: "",
  });

  useEffect(() => {
    // Get the API URL from environment variable
    setDebugInfo({
      apiUrl: import.meta.env.VITE_API_URL || "Not set",
      env: import.meta.env.MODE || "Not set",
      mode: import.meta.env.PROD ? "Production" : "Development",
    });
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white p-3 rounded shadow-lg border text-xs z-50">
      <h4 className="font-bold mb-1">Debug Info:</h4>
      <p>
        <strong>API URL:</strong> {debugInfo.apiUrl}
      </p>
      <p>
        <strong>Environment:</strong> {debugInfo.env}
      </p>
      <p>
        <strong>Mode:</strong> {debugInfo.mode}
      </p>
    </div>
  );
};

export default ApiDebug;
