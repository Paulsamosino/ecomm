import React, { useMemo, useState, useEffect } from "react";
import {
  PlusCircle,
  Download,
  Trash2,
  Search,
  Filter,
  Heart,
  TrendingUp,
  BarChart3,
  Zap,
  Calendar,
  Eye,
  EyeOff,
  Copy,
  Archive,
  Edit,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { logBreedingChange } from "@/utils/changeLogger";

const STORAGE_KEY = "breeding_records_v2";
const PRESETS_KEY = "breeding_presets_v2";

const Slider = ({ label, minLabel, maxLabel, value, onChange, min = 0, max = 100 }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        {/* Removed visual value "bubble" to keep UI minimal */}
      </div>
      <div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full appearance-none h-2 rounded-full bg-orange-300 hover:bg-orange-400 transition-all"
          style={{ outline: "none" }}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <div>{minLabel}</div>
        <div>{maxLabel}</div>
      </div>
    </div>
  );
};

// valueLabel removed - visual value bubbles were removed in favor of a cleaner native range thumb

const ToggleGroup = ({ label, options, value, onChange }) => {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1 rounded-full text-sm border transition ${value === opt.value ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function BreedingManagementPage() {
  const defaultParent = {
    size: 60, // range 0-100: Small -> Large
    eggProd: 50, // 0-100 Low -> High
    feather: 'smooth',
    color: 'white',
  };

  const [breedingRecords, setBreedingRecords] = useState([]);
  const [p1, setP1] = useState({ ...defaultParent });
  const [p2, setP2] = useState({ ...defaultParent });
  const [p1Name, setP1Name] = useState("Parent 1");
  const [p2Name, setP2Name] = useState("Parent 2");
  const [result, setResult] = useState(null);
  const [applyTarget, setApplyTarget] = useState(1); // 1 or 2
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selected, setSelected] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Load data from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setBreedingRecords(Array.isArray(saved) ? saved : []);
    } catch (e) {
      setBreedingRecords([]);
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(breedingRecords));
    } catch (e) {
      // ignore
    }
  }, [breedingRecords]);

  const predict = () => {
    // Simplified demo prediction logic: average numeric traits, dominant preferences
    const avgSize = Math.round((p1.size + p2.size) / 2);
    const avgEgg = Math.round((p1.eggProd + p2.eggProd) / 2);
    // Feather dominance: if parents match, child inherits; else pick one as dominant randomly
    const feather = p1.feather === p2.feather ? p1.feather : (Math.random() > 0.5 ? p1.feather : p2.feather);
    // Color simple dominance map (demo): dark dominates light
    const colorPriority = ['black', 'brown', 'red', 'white', 'gold'];
    const color = [p1.color, p2.color].sort((a,b) => (colorPriority.indexOf(a) - colorPriority.indexOf(b)))[0] || p1.color;

    const newRecord = {
      id: Date.now().toString(),
      parent1: { ...p1, name: p1Name },
      parent2: { ...p2, name: p2Name },
      offspring: { size: avgSize, eggProd: avgEgg, feather, color, name: '', description: '' },
      createdAt: new Date().toISOString(),
      notes: `Breeding record created on ${new Date().toLocaleDateString()}`,
      archived: false
    };

    logBreedingChange('create', newRecord);
    setBreedingRecords(prev => [newRecord, ...prev]);
    setResult({ size: avgSize, eggProd: avgEgg, feather, color, details: { parents: [p1, p2] } });
  };

  const openEditModal = (record) => {
    setEditingRecord({ ...record });
    setIsEditModalOpen(true);
  };

  const saveEditedRecord = () => {
    if (!editingRecord) return;

    const originalRecord = breedingRecords.find(r => r.id === editingRecord.id);
    logBreedingChange('edit', editingRecord, { originalRecord });
    setBreedingRecords(prev =>
      prev.map(r => r.id === editingRecord.id ? editingRecord : r)
    );
    setIsEditModalOpen(false);
    setEditingRecord(null);
  };

  const sizeLabel = (v) => {
    if (v < 33) return 'Small';
    if (v < 66) return 'Medium';
    return 'Large';
  };

  const eggLabel = (v) => {
    if (v < 33) return 'Low';
    if (v < 66) return 'Moderate';
    return 'High';
  };

  const featherOptions = [
    { label: 'Smooth', value: 'smooth' },
    { label: 'Curly', value: 'curly' },
    { label: 'Frizzle', value: 'frizzle' },
  ];

  const colorOptions = [
    { label: 'White', value: 'white' },
    { label: 'Brown', value: 'brown' },
    { label: 'Black', value: 'black' },
    { label: 'Red', value: 'red' },
    { label: 'Gold', value: 'gold' },
  ];

  // Breed presets with hex colors for cleaner swatches
  const initialPresets = [
    { name: 'Leghorn', size: 45, eggProd: 85, feather: 'smooth', colorName: 'White', color: '#F8FAFC' },
    { name: 'Rhode Island Red', size: 70, eggProd: 70, feather: 'smooth', colorName: 'Red', color: '#E11D48' },
    { name: 'Silkie', size: 30, eggProd: 35, feather: 'frizzle', colorName: 'White', color: '#F8FAFC' },
    { name: 'Plymouth Rock', size: 75, eggProd: 60, feather: 'smooth', colorName: 'Brown', color: '#7F2A2A' },
    { name: 'Ayam Cemani', size: 55, eggProd: 40, feather: 'smooth', colorName: 'Black', color: '#0F172A' },
  ];
  const [breedPresetsState, setBreedPresetsState] = useState(() => {
    try {
      // Try the new key first, fallback to the older key to migrate
      const raw = localStorage.getItem(PRESETS_KEY) || localStorage.getItem('breeding_presets_v1');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return initialPresets;
  });
  // Persist presets when they change (use PRESETS_KEY)
  useEffect(() => {
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify(breedPresetsState)); } catch (e) {}
  }, [breedPresetsState]);
  const [selectedPresetP1, setSelectedPresetP1] = useState(null);
  const [selectedPresetP2, setSelectedPresetP2] = useState(null);
  const [selectedPresetP1Color, setSelectedPresetP1Color] = useState(null);
  const [selectedPresetP2Color, setSelectedPresetP2Color] = useState(null);

  const applyPresetToParent = (preset, which) => {
    const data = { size: preset.size, eggProd: preset.eggProd, feather: preset.feather, color: preset.colorName ? preset.colorName.toLowerCase() : 'white' };
    if (which === 1) {
      setP1((s) => ({ ...s, ...data }));
      setP1Name(preset.name);
      setSelectedPresetP1(preset.name);
      // store color hex on selection for outline use
      setSelectedPresetP1Color(preset.color || '#F59E0B');
    } else {
      setP2((s) => ({ ...s, ...data }));
      setP2Name(preset.name);
      setSelectedPresetP2(preset.name);
      // store color hex on selection for outline use
      setSelectedPresetP2Color(preset.color || '#FB923C');
    }
  };

  // Favorites handling
  const toggleFavorite = (presetName) => {
    setBreedPresetsState((prev) => prev.map((p) => p.name === presetName ? { ...p, favorite: !p.favorite } : p));
  };

  const exportPresetsCSV = () => {
    const rows = [['name','size','eggProd','feather','colorName','color','favorite']];
    for (const p of breedPresetsState) rows.push([p.name,p.size,p.eggProd,p.feather,p.colorName,p.color, p.favorite ? '1' : '0']);
    const csv = rows.map(r => r.map(v=>String(v).replace(/"/g,'""')).map(v=>`"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'presets.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const importPresetsCSV = async () => {
    // For simplicity: prompt user for CSV text paste
    const text = prompt('Paste CSV contents here (name,size,eggProd,feather,colorName,color,favorite)');
    if (!text) return;
    try {
      const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
      const parsed = lines.slice(1).map(l => {
        const cols = l.split(',').map(s => s.replace(/^"|"$/g,'').trim());
        return { name: cols[0] || 'Custom', size: Number(cols[1]||50), eggProd: Number(cols[2]||50), feather: cols[3]||'smooth', colorName: cols[4]||'White', color: cols[5]||'#F8FAFC', favorite: cols[6] === '1' };
      });
      setBreedPresetsState(parsed);
      alert('Imported presets');
    } catch (e) { alert('Failed to parse CSV'); }
  };

  const clearPreset = (which) => {
    if (which === 1) {
      setSelectedPresetP1(null);
      setSelectedPresetP1Color(null);
      setP1Name("Parent 1");
    } else {
      setSelectedPresetP2(null);
      setSelectedPresetP2Color(null);
      setP2Name("Parent 2");
    }
  };

  const pretty = useMemo(() => ({
    sizeLabel,
    eggLabel,
  }), []);

  // Helper: compute a usable outline color (fallback to orange for very light swatches)
  const hexToLuminance = (hex) => {
    if (!hex) return 0;
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0,2),16)/255;
    const g = parseInt(h.substring(2,4),16)/255;
    const b = parseInt(h.substring(4,6),16)/255;
    const a = [r,g,b].map((v)=> v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4));
    return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2];
  };

  const outlineColor = (hex) => {
    if (!hex) return null;
    try {
      const lum = hexToLuminance(hex);
      // if very light, return a darker orange instead for visibility
      if (lum > 0.85) return '#FB923C';
      return hex;
    } catch (e) {
      return hex;
    }
  };



  return (
    <div className="min-h-screen bg-orange-50 pt-20 pb-8 px-4">
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4 shadow-lg">
            <Heart className="text-white" size={24} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">
            Breeding Management
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Predict offspring traits and manage your breeding records
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardContent className="p-6">

            {/* Parent Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Parent 1 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                    {p1Name.charAt(0).toUpperCase() || "1"}
                  </div>
                  <Input
                    value={p1Name}
                    onChange={(e) => setP1Name(e.target.value)}
                    placeholder="Parent 1 name"
                    className="w-32 text-sm font-semibold border-orange-200 focus:border-orange-500"
                  />
                  {selectedPresetP1 && (
                    <span className="text-sm text-gray-500">({selectedPresetP1})</span>
                  )}
                </div>
                <div className="space-y-3 pl-10">
                  <Slider label={`Size: ${pretty.sizeLabel(p1.size)}`} minLabel="Small" maxLabel="Large" value={p1.size} onChange={(v) => setP1((s)=>({ ...s, size: v }))} />
                  <Slider label={`Egg Production: ${pretty.eggLabel(p1.eggProd)}`} minLabel="Low" maxLabel="High" value={p1.eggProd} onChange={(v) => setP1((s)=>({ ...s, eggProd: v }))} />
                  <ToggleGroup label="Feather Type" options={featherOptions} value={p1.feather} onChange={(v)=> setP1((s)=>({...s, feather: v }))} />
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Color</div>
                    <div className="flex gap-2">
                      {colorOptions.map((c) => (
                        <button key={c.value} onClick={() => setP1((s)=>({...s, color: c.value }))} className={`w-6 h-6 rounded-full border-2 ${p1.color === c.value ? 'ring-2 ring-orange-300' : ''}`} style={{ background: c.value === 'white' ? '#F8FAFC' : c.value }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent 2 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-sm">
                    {p2Name.charAt(0).toUpperCase() || "2"}
                  </div>
                  <Input
                    value={p2Name}
                    onChange={(e) => setP2Name(e.target.value)}
                    placeholder="Parent 2 name"
                    className="w-32 text-sm font-semibold border-orange-200 focus:border-orange-500"
                  />
                  {selectedPresetP2 && (
                    <span className="text-sm text-gray-500">({selectedPresetP2})</span>
                  )}
                </div>
                <div className="space-y-3 pl-10">
                  <Slider label={`Size: ${pretty.sizeLabel(p2.size)}`} minLabel="Small" maxLabel="Large" value={p2.size} onChange={(v) => setP2((s)=>({ ...s, size: v }))} />
                  <Slider label={`Egg Production: ${pretty.eggLabel(p2.eggProd)}`} minLabel="Low" maxLabel="High" value={p2.eggProd} onChange={(v) => setP2((s)=>({ ...s, eggProd: v }))} />
                  <ToggleGroup label="Feather Type" options={featherOptions} value={p2.feather} onChange={(v)=> setP2((s)=>({...s, feather: v }))} />
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Color</div>
                    <div className="flex gap-2">
                      {colorOptions.map((c) => (
                        <button key={c.value} onClick={() => setP2((s)=>({...s, color: c.value }))} className={`w-6 h-6 rounded-full border-2 ${p2.color === c.value ? 'ring-2 ring-orange-300' : ''}`} style={{ background: c.value === 'white' ? '#F8FAFC' : c.value }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Apply to:</span>
                  <div className="flex rounded-lg bg-gray-100 p-1">
                    <button onClick={() => setApplyTarget(1)} className={`px-3 py-1 rounded-md text-sm transition ${applyTarget === 1 ? 'bg-orange-500 text-white' : 'text-gray-700'}`}>P1</button>
                    <button onClick={() => setApplyTarget(2)} className={`px-3 py-1 rounded-md text-sm transition ${applyTarget === 2 ? 'bg-orange-500 text-white' : 'text-gray-700'}`}>P2</button>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} />
                  Auto-advance
                </label>
              </div>
              <Button
                className="bg-orange-500 text-white font-semibold px-6 py-2 shadow-md hover:shadow-lg transition"
                onClick={predict}
              >
                <Zap className="mr-2" size={16} /> Predict Offspring
              </Button>
            </div>

            {/* Breed Presets */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="text-orange-500" size={16} />
                <span className="font-semibold text-gray-800">Quick Presets</span>
                <span className="text-sm text-gray-500">Click to apply to selected parent</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {breedPresetsState.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyPresetToParent(preset, applyTarget)}
                    className="p-3 rounded-lg border border-orange-200 bg-orange-50/50 hover:bg-orange-100 transition text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 rounded-full border" style={{ background: preset.color }} />
                      <span className="text-sm font-medium text-gray-900">{preset.name}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Size: {preset.size}% • Eggs: {preset.eggProd}%
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {/* Prediction Result */}
            {result && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="text-green-600" size={16} />
                  <span className="font-semibold text-green-800">Predicted Offspring</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium ml-1">{result.size}% ({sizeLabel(result.size)})</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Egg Production:</span>
                    <span className="font-medium ml-1">{result.eggProd}% ({eggLabel(result.eggProd)})</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Feather:</span>
                    <span className="font-medium ml-1 capitalize">{result.feather}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Color:</span>
                    <span className="font-medium ml-1 capitalize">{result.color}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Records Section */}
            <div className="border-t border-orange-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Breeding Records</h3>
                  <p className="text-sm text-gray-500">
                    {breedingRecords.filter(r => !r.archived).length} active • {breedingRecords.filter(r => r.archived).length} archived
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search records..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-48 border-orange-200 focus:border-[#ffb761]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowArchived(!showArchived)}
                    className={`border-orange-300 hover:border-[#ffb761] hover:bg-[#ffb761]/5 ${showArchived ? 'bg-orange-50' : ''}`}
                  >
                    {showArchived ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span className="ml-1 text-xs">{showArchived ? 'Hide Archived' : 'Show Archived'}</span>
                  </Button>
                </div>
              </div>

              {breedingRecords.filter(r => showArchived || !r.archived).length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="text-orange-300 mx-auto mb-4" size={48} />
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">No Records Yet</h4>
                  <p className="text-gray-600">Create your first breeding prediction above</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {(() => {
                    const visibleRecords = breedingRecords.filter(r => showArchived || !r.archived);
                    const totalPages = Math.ceil(visibleRecords.length / itemsPerPage);
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedRecords = visibleRecords.slice(startIndex, endIndex);

                    return (
                      <>
                        <table className="w-full">
                          <thead className="bg-orange-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">
                                <input
                                  type="checkbox"
                                  checked={selected.length === visibleRecords.length && visibleRecords.length > 0}
                                  onChange={() => {
                                    setSelected(selected.length === visibleRecords.length ? [] : visibleRecords.map(r => r.id));
                                  }}
                                  className="w-4 h-4 text-[#ffb761] bg-orange-50 border-orange-300 rounded focus:ring-[#ffb761]"
                                />
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Date</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Parents</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Offspring</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Status</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedRecords.map((record) => (
                        <tr key={record.id} className={`border-b border-orange-100 hover:bg-orange-50/50 transition ${selected.includes(record.id) ? 'bg-[#ffb761]/5' : ''} ${record.archived ? 'opacity-75' : ''}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selected.includes(record.id)}
                              onChange={() => setSelected(prev =>
                                prev.includes(record.id)
                                  ? prev.filter(id => id !== record.id)
                                  : [...prev, record.id]
                              )}
                              className="w-4 h-4 text-[#ffb761] bg-orange-50 border-orange-300 rounded focus:ring-[#ffb761]"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(record.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{record.parent1.name || 'Parent 1'}</div>
                              <div className="text-gray-600">{record.parent2.name || 'Parent 2'}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {record.offspring.name || `Offspring ${breedingRecords.filter(r => r.createdAt < record.createdAt).length + 1}`}
                              </div>
                              <div className="text-gray-600">Size: {record.offspring.size}% • Eggs: {record.offspring.eggProd}%</div>
                              <div className="text-gray-600 capitalize">{record.offspring.feather} • {record.offspring.color}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              record.archived
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-green-100 text-green-600'
                            }`}>
                              {record.archived ? 'Archived' : 'Active'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(record)}
                                className="text-purple-500 hover:text-purple-700 hover:bg-purple-50 h-8 w-8 p-0"
                                title="Edit Record"
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newRecord = { ...record, id: Date.now().toString() + '_copy' };
                                  logBreedingChange('duplicate', newRecord, { originalRecord: record });
                                  setBreedingRecords(prev => [newRecord, ...prev]);
                                }}
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                                title="Duplicate"
                              >
                                <Copy size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const action = record.archived ? 'restore' : 'archive';
                                  const updatedRecord = { ...record, archived: !record.archived };
                                  logBreedingChange(action, updatedRecord, { originalRecord: record });
                                  setBreedingRecords(prev => prev.map(r =>
                                    r.id === record.id ? updatedRecord : r
                                  ));
                                }}
                                className={`h-8 w-8 p-0 ${
                                  record.archived
                                    ? 'text-green-500 hover:text-green-700 hover:bg-green-50'
                                    : 'text-orange-500 hover:text-orange-700 hover:bg-orange-50'
                                }`}
                                title={record.archived ? "Unarchive" : "Archive"}
                              >
                                <Archive size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (window.confirm('Delete this record?')) {
                                    logBreedingChange('delete', record);
                                    setBreedingRecords(prev => prev.filter(r => r.id !== record.id));
                                  }
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-orange-200">
                      <div className="flex items-center gap-4 text-sm text-orange-700">
                        <div className="text-sm text-orange-700">
                          Showing {startIndex + 1} to {Math.min(endIndex, visibleRecords.length)} of {visibleRecords.length} entries
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-orange-700">Show:</label>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="text-sm border border-orange-300 rounded-md px-2 py-1 bg-white text-orange-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="border-orange-300 text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                        >
                          Previous
                        </Button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className={currentPage === pageNum
                                  ? "bg-orange-500 text-white"
                                  : "border-orange-300 text-orange-700 hover:bg-orange-50"
                                }
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="border-orange-300 text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                    )}
                </>
                    );
                  })()}
                </div>
              )}

              {/* Bulk Actions */}
              {selected.length > 0 && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-orange-100">
                  <span className="text-sm text-gray-600">{selected.length} selected</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const selectedRecords = breedingRecords.filter(r => selected.includes(r.id));
                      const hasArchived = selectedRecords.some(r => r.archived);
                      const hasActive = selectedRecords.some(r => !r.archived);
                      const action = hasArchived && hasActive ? 'toggle' : hasArchived ? 'unarchive' : 'archive';
                      const confirmMessage = action === 'archive' ? `Archive ${selected.length} selected records?` :
                                           action === 'unarchive' ? `Unarchive ${selected.length} selected records?` :
                                           `Toggle archive status for ${selected.length} selected records?`;

                      if (!window.confirm(confirmMessage)) return;

                      setBreedingRecords(prev => prev.map(r => {
                        if (selected.includes(r.id)) {
                          const updatedRecord = { ...r, archived: !r.archived };
                          logBreedingChange(r.archived ? 'restore' : 'archive', updatedRecord, { originalRecord: r, source: 'bulk_operation' });
                          return updatedRecord;
                        }
                        return r;
                      }));
                      setSelected([]);
                    }}
                    className="border-orange-300 hover:border-orange-500 hover:bg-orange-50 text-orange-600"
                  >
                    Toggle Archive Status
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelected([])}
                    className="border-gray-300 hover:border-gray-500 hover:bg-gray-50"
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Record Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <Edit className="text-white" size={20} />
              </div>
              <span className="bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent font-bold">
                Edit Breeding Record
              </span>
            </DialogTitle>
          </DialogHeader>

          {editingRecord && (
            <div className="space-y-6">
              {/* Record Info Header */}
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-orange-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="text-orange-500" size={16} />
                  <h3 className="font-semibold text-gray-800">Record Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Created:</span>
                    <span className="font-medium text-gray-700">{new Date(editingRecord.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Status:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      editingRecord.archived
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {editingRecord.archived ? 'Archived' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Parent Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Parent 1 */}
                <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-orange-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {editingRecord.parent1?.name?.charAt(0)?.toUpperCase() || "1"}
                    </div>
                    <h3 className="font-semibold text-gray-800">Parent 1</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <Input
                        value={editingRecord.parent1?.name || ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          parent1: { ...prev.parent1, name: e.target.value }
                        }))}
                        placeholder="Enter parent name"
                        className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>

                    <div className="bg-orange-50/50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Genetic Traits</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Size:</span>
                          <span className="font-medium">{editingRecord.parent1?.size}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Eggs:</span>
                          <span className="font-medium">{editingRecord.parent1?.eggProd}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Feather:</span>
                          <span className="font-medium capitalize">{editingRecord.parent1?.feather}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Color:</span>
                          <span className="font-medium capitalize">{editingRecord.parent1?.color}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parent 2 */}
                <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-orange-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-orange-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {editingRecord.parent2?.name?.charAt(0)?.toUpperCase() || "2"}
                    </div>
                    <h3 className="font-semibold text-gray-800">Parent 2</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <Input
                        value={editingRecord.parent2?.name || ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          parent2: { ...prev.parent2, name: e.target.value }
                        }))}
                        placeholder="Enter parent name"
                        className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>

                    <div className="bg-orange-50/50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Genetic Traits</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Size:</span>
                          <span className="font-medium">{editingRecord.parent2?.size}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Eggs:</span>
                          <span className="font-medium">{editingRecord.parent2?.eggProd}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Feather:</span>
                          <span className="font-medium capitalize">{editingRecord.parent2?.feather}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Color:</span>
                          <span className="font-medium capitalize">{editingRecord.parent2?.color}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Offspring Information */}
              <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-green-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <Heart className="text-white" size={16} />
                  </div>
                  <h3 className="font-semibold text-gray-800">Predicted Offspring</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Offspring Name</label>
                      <Input
                        value={editingRecord.offspring?.name || ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          offspring: { ...prev.offspring, name: e.target.value }
                        }))}
                        placeholder="Name your offspring"
                        className="border-green-200 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>

                    <div className="bg-green-50/50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Predicted Traits</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Size:</span>
                          <span className="font-medium">{editingRecord.offspring?.size}% ({sizeLabel(editingRecord.offspring?.size)})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Eggs:</span>
                          <span className="font-medium">{editingRecord.offspring?.eggProd}% ({eggLabel(editingRecord.offspring?.eggProd)})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Feather:</span>
                          <span className="font-medium capitalize">{editingRecord.offspring?.feather}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Color:</span>
                          <span className="font-medium capitalize">{editingRecord.offspring?.color}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description & Notes</label>
                      <Textarea
                        value={editingRecord.notes || ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          notes: e.target.value
                        }))}
                        placeholder="Add observations, special notes, or any additional information about this breeding..."
                        rows={6}
                        className="resize-none border-green-200 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Archive Status */}
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Archive className="text-gray-500" size={16} />
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Archive Status</h4>
                      <p className="text-xs text-gray-500">Hide this record from active view</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingRecord.archived || false}
                      onChange={(e) => setEditingRecord(prev => ({
                        ...prev,
                        archived: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-orange-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingRecord(null);
                  }}
                  className="px-6 py-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                >
                  <X className="mr-2" size={16} />
                  Cancel
                </Button>
                <Button
                  onClick={saveEditedRecord}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                >
                  <Edit className="mr-2" size={16} />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
