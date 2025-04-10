import { PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const PayPalButton = ({ amount, onSuccess, onError, disabled }) => {
  const [isPending, setIsPending] = useState(false);

  const createOrder = (data, actions) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            currency_code: "PHP",
            value: amount.toFixed(2),
          },
        },
      ],
    });
  };

  const onApprove = async (data, actions) => {
    try {
      setIsPending(true);
      const order = await actions.order.capture();
      toast.success("Payment successful!");
      onSuccess?.(order);
    } catch (err) {
      console.error("PayPal error:", err);
      toast.error("Payment failed. Please try again.");
      onError?.(err);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full">
      {isPending ? (
        <div className="w-full h-12 flex items-center justify-center bg-gray-50 rounded-md">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span>Processing payment...</span>
        </div>
      ) : (
        <PayPalButtons
          style={{
            layout: "vertical",
            height: 48,
          }}
          disabled={disabled || isPending}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={(err) => {
            console.error("PayPal error:", err);
            toast.error("Payment failed. Please try again.");
            onError?.(err);
          }}
        />
      )}
    </div>
  );
};
