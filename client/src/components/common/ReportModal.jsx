import React, { useState, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { submitReport } from "@/api/reports";

const ReportModal = ({
  isOpen,
  onClose,
  reportedUserId,
  reporterRole,
  evidence,
}) => {
  const [formData, setFormData] = useState({
    reason: "",
    description: "",
    category: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportCategories = {
    buyer: {
      fraud: {
        label: "Fraud",
        reasons: [
          "Fraudulent activity",
          "Non-delivery of product",
          "Item not as described",
        ],
      },
      product_quality: {
        label: "Product Quality",
        reasons: ["Damaged product", "Wrong item received", "Quality issues"],
      },
      shipping: {
        label: "Shipping",
        reasons: ["Delayed shipping", "Wrong address", "Lost package"],
      },
      communication: {
        label: "Communication",
        reasons: ["Poor communication", "No response", "Rude behavior"],
      },
      other: {
        label: "Other",
        reasons: ["Misleading information", "Policy violation", "Other"],
      },
    },
    seller: {
      payment: {
        label: "Payment",
        reasons: ["Payment issues", "Fraudulent payment", "Chargeback"],
      },
      harassment: {
        label: "Harassment",
        reasons: ["Harassment", "Threats", "Inappropriate behavior"],
      },
      communication: {
        label: "Communication",
        reasons: ["Poor communication", "False claims", "Suspicious behavior"],
      },
      other: {
        label: "Other",
        reasons: ["Policy violation", "Other issues"],
      },
    },
  };

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    if (!formData.reason) {
      newErrors.reason = "Please select a specific reason";
    }

    if (!formData.description) {
      newErrors.description = "Please provide a description";
    } else if (formData.description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      // Reset reason if category changes
      ...(field === "category" ? { reason: "" } : {}),
    }));
    // Clear error for the field being changed
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);
    try {
      const reportData = {
        reportedUserId,
        reason: formData.reason,
        description: formData.description.trim(),
        reporterRole,
        category: formData.category,
        evidence: evidence
          ? [
              {
                type: evidence.type,
                reference: evidence.reference,
                description: evidence.description,
              },
            ]
          : [],
      };

      await submitReport(reportData);
      toast.success(
        "Report submitted successfully. We will investigate this matter promptly."
      );
      handleClose();
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to submit report. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      reason: "",
      description: "",
      category: "",
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose}></div>

      <div className="modal modal-open">
        <div className="modal-box max-w-md">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <h3 className="font-bold text-lg">File a Report</h3>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Your report will be reviewed by our team. We take all reports
            seriously and will investigate the matter thoroughly.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Category</span>
              </label>
              <select
                className={`select select-bordered w-full ${
                  errors.category ? "select-error" : ""
                }`}
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
              >
                <option value="">Select a category</option>
                {Object.entries(reportCategories[reporterRole] || {}).map(
                  ([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  )
                )}
              </select>
              {errors.category && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.category}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Specific Reason</span>
              </label>
              <select
                className={`select select-bordered w-full ${
                  errors.reason ? "select-error" : ""
                }`}
                value={formData.reason}
                onChange={(e) => handleInputChange("reason", e.target.value)}
                disabled={!formData.category}
              >
                <option value="">
                  {formData.category
                    ? "Select a reason"
                    : "Select a category first"}
                </option>
                {formData.category &&
                  reportCategories[reporterRole][
                    formData.category
                  ]?.reasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
              </select>
              {errors.reason && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.reason}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">
                  Detailed Description
                </span>
              </label>
              <textarea
                className={`textarea textarea-bordered h-24 ${
                  errors.description ? "textarea-error" : ""
                }`}
                placeholder="Please provide specific details about the issue..."
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
              />
              <label className="label">
                <span
                  className={`label-text-alt ${
                    formData.description.length < 20
                      ? "text-error"
                      : "text-success"
                  }`}
                >
                  {formData.description.length < 20
                    ? `Please provide at least ${
                        20 - formData.description.length
                      } more characters`
                    : `${formData.description.length} characters`}
                </span>
                {errors.description && (
                  <span className="label-text-alt text-error">
                    {errors.description}
                  </span>
                )}
              </label>
            </div>

            {evidence && (
              <div className="alert alert-info">
                <div>
                  <p className="text-sm">
                    Supporting evidence will be attached to your report:
                    <br />
                    {evidence.description}
                  </p>
                </div>
              </div>
            )}

            <div className="modal-action">
              <button
                type="button"
                className="btn"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-primary ${isSubmitting ? "loading" : ""}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
