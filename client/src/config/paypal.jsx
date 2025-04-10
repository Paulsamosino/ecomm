import { PayPalScriptProvider } from "@paypal/react-paypal-js";

const PAYPAL_CLIENT_ID =
  import.meta.env.VITE_PAYPAL_CLIENT_ID ||
  "AYkrBEqm9dM5MUBk32oRp5T67oVJqi3m4CrtCkLTdvfDJ135RFSy0wC2M8Mb7wlIWXndWc9KiLOTITyT";

const paypalConfig = {
  "client-id": PAYPAL_CLIENT_ID,
  currency: "PHP",
  components: "buttons",
};

export const PayPalProvider = ({ children }) => {
  return (
    <PayPalScriptProvider options={paypalConfig}>
      {children}
    </PayPalScriptProvider>
  );
};
