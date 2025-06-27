import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

const CreateDelivery = ({ order }) => (
  <Card>
    <CardHeader>
      <CardTitle>Delivery</CardTitle>
    </CardHeader>
    <CardContent>
      <Alert variant="info">
        Delivery is now fully automated. Lalamove delivery will be created
        automatically when an order is placed. You can track the delivery status
        below.
      </Alert>
    </CardContent>
  </Card>
);

export default CreateDelivery;
