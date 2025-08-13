import React, { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import deliveryService from "@/services/deliveryService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, Truck } from "lucide-react";

const DeliveryTracking = ({ orderId, onStatusUpdate }) => {
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const statusColors = {
    pending: "bg-yellow-500",
    PENDING: "bg-yellow-500",
    assigning_driver: "bg-blue-500",
    ASSIGNING_DRIVER: "bg-blue-500",
    on_going: "bg-orange-500",
    ON_GOING: "bg-orange-500",
    picked_up: "bg-purple-500",
    PICKED_UP: "bg-purple-500",
    completed: "bg-green-500",
    COMPLETED: "bg-green-500",
    cancelled: "bg-red-500",
    CANCELLED: "bg-red-500",
    expired: "bg-gray-500",
    EXPIRED: "bg-gray-500",
    rejected: "bg-red-600",
    REJECTED: "bg-red-600",
    driver_cancelled: "bg-red-400",
    DRIVER_CANCELLED: "bg-red-400",
    system_cancelled: "bg-red-300",
    SYSTEM_CANCELLED: "bg-red-300",
  };

  const statusLabels = {
    pending: "Pending",
    PENDING: "Pending",
    assigning_driver: "Assigning Driver",
    ASSIGNING_DRIVER: "Assigning Driver",
    on_going: "On Going",
    ON_GOING: "On Going",
    picked_up: "Picked Up",
    PICKED_UP: "Picked Up",
    completed: "Delivered",
    COMPLETED: "Delivered",
    cancelled: "Cancelled",
    CANCELLED: "Cancelled",
    expired: "Expired",
    EXPIRED: "Expired",
    rejected: "Rejected",
    REJECTED: "Rejected",
    driver_cancelled: "Driver Cancelled",
    DRIVER_CANCELLED: "Driver Cancelled",
    system_cancelled: "System Cancelled",
    SYSTEM_CANCELLED: "System Cancelled",
  };

  useEffect(() => {
    const fetchDeliveryInfo = async () => {
      try {
        setLoading(true);
        const [statusRes, driverRes] = await Promise.all([
          deliveryService.getDeliveryStatus(orderId),
          deliveryService.getDriverInfo(orderId).catch(() => null),
        ]);

        setDeliveryStatus(statusRes);
        setDriverInfo(driverRes);

        if (onStatusUpdate) {
          onStatusUpdate(statusRes.status);
        }
      } catch (err) {
        console.error("Error fetching delivery info:", err);
        setError(err.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch delivery information",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryInfo();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchDeliveryInfo, 30000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!deliveryStatus) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Delivery Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className="font-medium">Status:</span>
          <Badge className={statusColors[deliveryStatus.status]}>
            {statusLabels[deliveryStatus.status]}
          </Badge>
        </div>

        {/* Driver Information */}
        {driverInfo && (
          <div className="space-y-2 border rounded-lg p-4">
            <h3 className="font-medium mb-2">Driver Information</h3>
            <div className="flex items-center gap-2">
              <img
                src={driverInfo.photo}
                alt={driverInfo.name}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium">{driverInfo.name}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {driverInfo.phone}
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    {driverInfo.plate}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Location Updates */}
        {deliveryStatus.tracking?.stops && (
          <div className="space-y-2">
            <h3 className="font-medium mb-2">Delivery Progress</h3>
            <div className="space-y-4">
              {deliveryStatus.tracking.stops.map((stop, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 border-l-2 border-gray-200 pl-4 pb-4 last:pb-0"
                >
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{stop.address}</p>
                    {stop.arrivalTime && (
                      <p className="text-sm text-gray-500">
                        {new Date(stop.arrivalTime).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delivery Details */}
        {deliveryStatus.price && (
          <div className="border-t pt-4 mt-4">
            <p className="flex justify-between">
              <span>Delivery Fee:</span>
              <span className="font-medium">
                {deliveryStatus.price.currency}{" "}
                {deliveryStatus.price.amount.toFixed(2)}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryTracking;
