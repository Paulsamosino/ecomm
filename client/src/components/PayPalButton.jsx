import { PayPalButtons } from "@paypal/react-paypal-js";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const PayPalButton = ({
  amount,
  shippingAddress,
  recentItems = [],
  onSuccess,
  onError,
  disabled,
}) => {
  const [isPending, setIsPending] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Reset loading state if stuck for more than 30 seconds
  useEffect(() => {
    let timeoutId;
    if (isPending) {
      timeoutId = setTimeout(() => {
        setIsPending(false);
        setIsRetrying(false);
        toast.error("Payment process timed out. Please try again.");
      }, 30000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isPending]);

  const handleCreateOrder = useCallback(
    (_, actions) => {
      setIsPending(true);

      const order = {
        purchase_units: [
          {
            amount: {
              currency_code: "PHP",
              value: amount.toFixed(2),
            },
            description: "Purchase from C&P Marketplace",
          },
        ],
        application_context: {
          shipping_preference: shippingAddress
            ? "SET_PROVIDED_ADDRESS"
            : "NO_SHIPPING",
          user_action: "PAY_NOW",
        },
      };

      if (shippingAddress?.street) {
        order.purchase_units[0].shipping = {
          address: {
            address_line_1: shippingAddress.street,
            admin_area_2: shippingAddress.city,
            admin_area_1: shippingAddress.state,
            postal_code: shippingAddress.zipCode,
            country_code: shippingAddress.country || "PH",
          },
        };
      }

      return actions.order.create(order).catch((err) => {
        console.error("Create order error:", err);
        setIsPending(false);
        setIsRetrying(false);
        toast.error("Failed to create payment. Please try again.");
        throw err;
      });
    },
    [amount, shippingAddress]
  );

  const handleApprove = useCallback(
    async (data, actions) => {
      try {
        const order = await actions.order.capture();

        if (order.status === "COMPLETED") {
          toast.success("Payment successful!");
          // Persist recent items locally for Inventory quick-add (lightweight)
          try {
            const recent = (recentItems || []).map(i => ({ name: i.name || (i.product && i.product.name) || 'Item', qty: i.quantity || i.qty || 1, category: i.category || (i.product && i.product.category) }));
            if (recent.length > 0) {
              localStorage.setItem('recent_purchases_v1', JSON.stringify(recent));
            }
          } catch (e) {
            console.warn('Failed to persist recent items', e);
          }
          onSuccess?.(order);
        } else {
          throw new Error(`Payment not completed. Status: ${order.status}`);
        }
      } catch (err) {
        console.error("Payment capture error:", err);

        if (err.message.includes("Window closed")) {
          toast.error("Payment window was closed. Please try again.");
        } else {
          toast.error("Payment failed. Please try again.");
        }

        onError?.(err);
      } finally {
        setIsPending(false);
        setIsRetrying(false);
      }
    },
    [onSuccess, onError]
  );

  const handleError = useCallback(
    (err) => {
      console.error("PayPal error:", err);
      setIsPending(false);
      setIsRetrying(false);

      let message = "Payment failed. Please try again.";

      if (
        err.message.includes("Window closed") ||
        err.message.includes("popup close")
      ) {
        message = "Payment window was closed. Please try again.";
      } else if (err.message.includes("popup blocked")) {
        message =
          "Payment window was blocked. Please allow popups and try again.";
      } else if (err.message.includes("INSTRUMENT_DECLINED")) {
        message =
          "Your payment method was declined. Please try a different payment method.";
      }

      toast.error(message);
      onError?.(err);
    },
    [onError]
  );

  const handleCancel = useCallback(() => {
    setIsPending(false);
    setIsRetrying(false);
    toast.info("Payment was cancelled. Please try again when ready.");
  }, []);

  // Force reset of loading state when component unmounts
  useEffect(() => {
    return () => {
      setIsPending(false);
      setIsRetrying(false);
    };
  }, []);

  return (
    <div className="space-y-4">
      {isPending && (
        <div className="w-full h-12 flex items-center justify-center bg-gray-50 rounded-md">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span>Processing payment...</span>
        </div>
      )}

      {/* make PayPal buttons span the available width so they fit the gray area */}
      <div className="w-full relative z-10 flex items-center justify-center" style={{ minWidth: '100%' }}>
        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 520 }}>
          <PayPalButtons
            className="w-full"
            style={{
              layout: "horizontal",
              height: 40,
              shape: "rect",
            }}
            disabled={disabled || isRetrying}
            forceReRender={[amount]}
            createOrder={handleCreateOrder}
            onApprove={handleApprove}
            onError={handleError}
            onCancel={handleCancel}
            onClick={() => {
              // Reset states when starting a new payment attempt
              setIsPending(false);
              setIsRetrying(false);
            }}
          />
        </div>
      </div>
    </div>
  );
};
