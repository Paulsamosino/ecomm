import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Wrench, Plus, Pencil, Trash2, ImagePlus, Heart, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  apiGetBreedingPresets,
  apiCreateBreedingPreset,
  apiUpdateBreedingPreset,
  apiDeleteBreedingPreset,
  apiUploadPresetImage,
} from "@/api/admin";

// ─── Slider (mirrors BreedingManagementPage's) ──────────────────────────────
function Slider({ label, minLabel, maxLabel, value, onChange, min = 0, max = 100 }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-semibold text-orange-600">{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full appearance-none h-2 rounded-full bg-orange-200 accent-orange-500"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

const FEATHER_OPTIONS = ["smooth", "curly", "frizzle"];
const EMPTY_FORM = {
  name: "",
  size: 50,
  eggProd: 50,
  feather: "smooth",
  colorName: "White",
  colorHex: "#F8FAFC",
  imageUrl: "",
  imagePublicId: "",
};

// ─── PresetCard ──────────────────────────────────────────────────────────────
function PresetCard({ preset, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition overflow-hidden">
      {preset.imageUrl ? (
        <img
          src={preset.imageUrl}
          alt={preset.name}
          className="w-full h-36 object-cover"
        />
      ) : (
        <div
          className="w-full h-36 flex items-center justify-center"
          style={{ background: (preset.colorHex || "#F8FAFC") + "33" }}
        >
          <Heart className="text-orange-300" size={36} />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-4 h-4 rounded-full border shadow-sm flex-shrink-0"
            style={{ background: preset.colorHex || "#F8FAFC" }}
          />
          <h3 className="font-bold text-gray-900 truncate">{preset.name}</h3>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          <span className="text-xs bg-orange-50 text-gray-600 px-2 py-0.5 rounded-full">
            Size: {preset.size}%
          </span>
          <span className="text-xs bg-orange-50 text-gray-600 px-2 py-0.5 rounded-full">
            Eggs: {preset.eggProd}%
          </span>
          <span className="text-xs bg-orange-50 text-gray-600 px-2 py-0.5 rounded-full capitalize">
            {preset.feather}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-orange-200 hover:border-orange-400 gap-1"
            onClick={() => onEdit(preset)}
          >
            <Pencil size={13} /> Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-200 hover:bg-red-50 hover:border-red-400 text-red-500 gap-1 px-3"
            onClick={() => onDelete(preset)}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── PresetFormDialog ────────────────────────────────────────────────────────
function PresetFormDialog({ open, onClose, initialData, onSaved }) {
  const isEdit = !!initialData?._id;
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const colorRef = useRef(null);

  // Reset form whenever dialog opens
  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          name: initialData.name || "",
          size: initialData.size ?? 50,
          eggProd: initialData.eggProd ?? 50,
          feather: initialData.feather || "smooth",
          colorName: initialData.colorName || "White",
          colorHex: initialData.colorHex || "#F8FAFC",
          imageUrl: initialData.imageUrl || "",
          imagePublicId: initialData.imagePublicId || "",
        });
        setImagePreview(initialData.imageUrl || null);
      } else {
        setForm(EMPTY_FORM);
        setImagePreview(null);
      }
      setImageFile(null);
    }
  }, [open, initialData]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Preset name is required");
      return;
    }
    setSaving(true);
    try {
      let imageUrl = form.imageUrl;
      let imagePublicId = form.imagePublicId;

      // Upload new image if chosen
      if (imageFile) {
        setUploading(true);
        const uploaded = await apiUploadPresetImage(imageFile);
        imageUrl = uploaded.imageUrl;
        imagePublicId = uploaded.imagePublicId;
        setUploading(false);
      }

      const payload = { ...form, imageUrl, imagePublicId };

      if (isEdit) {
        await apiUpdateBreedingPreset(initialData._id, payload);
        toast.success("Preset updated");
      } else {
        await apiCreateBreedingPreset(payload);
        toast.success("Preset created");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save preset");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Preset" : "Add New Preset"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Name */}
          <div>
            <Label htmlFor="pName">Breed Name *</Label>
            <Input
              id="pName"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Leghorn"
              className="mt-1"
            />
          </div>

          {/* Image upload */}
          <div>
            <Label>Preview Image</Label>
            <div className="mt-1 space-y-2">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-full h-44 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                      setForm((f) => ({ ...f, imageUrl: "", imagePublicId: "" }));
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 bg-white/80 rounded-full p-1 hover:bg-white transition shadow"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-orange-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-orange-400 hover:bg-orange-50 transition text-gray-500 hover:text-orange-600"
                >
                  <ImagePlus size={24} />
                  <span className="text-sm">Click to upload image</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {imagePreview && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="text-sm text-orange-500 hover:text-orange-700 underline"
                >
                  Change image
                </button>
              )}
            </div>
          </div>

          {/* Size */}
          <Slider
            label="Body Size"
            minLabel="Small"
            maxLabel="Large"
            value={form.size}
            onChange={(v) => setForm((f) => ({ ...f, size: v }))}
          />

          {/* Egg Production */}
          <Slider
            label="Egg Production"
            minLabel="Low"
            maxLabel="High"
            value={form.eggProd}
            onChange={(v) => setForm((f) => ({ ...f, eggProd: v }))}
          />

          {/* Feather */}
          <div>
            <Label>Feather Type</Label>
            <div className="flex gap-2 mt-1.5">
              {FEATHER_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setForm((s) => ({ ...s, feather: f }))}
                  className={`px-3 py-1.5 rounded-full text-sm border transition capitalize ${
                    form.feather === f
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <Label>Breed Color</Label>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-full border-2 border-white shadow cursor-pointer"
                  style={{ background: form.colorHex }}
                  onClick={() => colorRef.current?.click()}
                />
                <input
                  ref={colorRef}
                  type="color"
                  value={form.colorHex}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      colorHex: e.target.value,
                      colorName: e.target.value,
                    }))
                  }
                  className="absolute inset-0 opacity-0 w-0 h-0"
                />
              </div>
              <span className="font-mono text-sm text-gray-500">{form.colorHex}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white"
            onClick={handleSave}
            disabled={saving || uploading}
          >
            {(saving || uploading) && <Loader2 size={14} className="mr-2 animate-spin" />}
            {uploading ? "Uploading…" : saving ? "Saving…" : isEdit ? "Save Changes" : "Create Preset"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── AdminToolsHubPage ───────────────────────────────────────────────────────
export default function AdminToolsHubPage() {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);

  const fetchPresets = async () => {
    setLoading(true);
    try {
      const data = await apiGetBreedingPresets();
      setPresets(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load presets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPresets(); }, []);

  const openCreate = () => {
    setEditingPreset(null);
    setDialogOpen(true);
  };

  const openEdit = (preset) => {
    setEditingPreset(preset);
    setDialogOpen(true);
  };

  const handleDelete = async (preset) => {
    if (!window.confirm(`Delete preset "${preset.name}"? This cannot be undone.`)) return;
    try {
      await apiDeleteBreedingPreset(preset._id);
      toast.success("Preset deleted");
      fetchPresets();
    } catch {
      toast.error("Failed to delete preset");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow text-white">
            <Wrench size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tools Hub</h1>
            <p className="text-gray-500 text-sm">Manage Quick Presets for the Breeding Tool</p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow hover:shadow-md gap-2"
        >
          <Plus size={16} />
          Add Preset
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-2xl h-56 animate-pulse" />
          ))}
        </div>
      ) : presets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Heart className="text-orange-400" size={36} />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No presets yet</h3>
          <p className="text-gray-500 mb-6 max-w-xs">
            Create your first Quick Preset. Sellers and buyers will see them in the Breeding
            Management tool.
          </p>
          <Button
            onClick={openCreate}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white gap-2"
          >
            <Plus size={16} />
            Add First Preset
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {presets.map((preset) => (
            <PresetCard
              key={preset._id}
              preset={preset}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <PresetFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initialData={editingPreset}
        onSaved={fetchPresets}
      />
    </div>
  );
}
