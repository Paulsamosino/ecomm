import { PayPalScriptProvider } from "@paypal/react-paypal-js";

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

if (!PAYPAL_CLIENT_ID) {
  console.error(
    "PayPal Client ID is missing. Please add VITE_PAYPAL_CLIENT_ID to your .env file"
  );
}

const paypalConfig = {
  "client-id": PAYPAL_CLIENT_ID,
  currency: "PHP",
  components: "buttons",
  intent: "capture",
};

export const PayPalProvider = ({ children }) => {
  if (!PAYPAL_CLIENT_ID) {
    return (
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">
          PayPal configuration is missing. Please check your environment
          variables.
        </p>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={paypalConfig}>
      {children}
    </PayPalScriptProvider>
  );
};
