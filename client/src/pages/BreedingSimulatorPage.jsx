import React, { useEffect, useMemo, useState } from "react";
import { Egg, Shuffle, Share2, Save, Beaker, RefreshCcw, ArrowLeftRight, Copy } from "lucide-react";

// Reference data with more accurate loci
// Comb: R (rose) and P (pea) → walnut if both present; otherwise rose/pea/single
// Egg color: O (blue shell) and B (brown overlay)
// Pattern: K (barred) dominant
// Notes: Real strains vary; these reflect commonly accepted breed standards.
const breeds = [
	// Single-comb brown layers
	{ name: "Rhode Island Red", purpose: "dual", egg: 250, eggColor: "brown", size: 2, combR: ["r","r"], combP: ["p","p"], shellBlue: ["o","o"], shellBrown: ["B","B"], patternK: ["k","k"], icon: "🐔" },
	{ name: "Buff Orpington", purpose: "dual", egg: 200, eggColor: "brown", size: 3, combR: ["r","r"], combP: ["p","p"], shellBlue: ["o","o"], shellBrown: ["B","B"], patternK: ["k","k"], icon: "🐔" },
	{ name: "Australorp", purpose: "dual", egg: 260, eggColor: "brown", size: 3, combR: ["r","r"], combP: ["p","p"], shellBlue: ["o","o"], shellBrown: ["B","B"], patternK: ["k","k"], icon: "🐔" },
	{ name: "Sussex", purpose: "dual", egg: 250, eggColor: "brown", size: 2, combR: ["r","r"], combP: ["p","p"], shellBlue: ["o","o"], shellBrown: ["B","b"], patternK: ["k","k"], icon: "🐔" },
	{ name: "Jersey Giant", purpose: "meat", egg: 180, eggColor: "brown", size: 3, combR: ["r","r"], combP: ["p","p"], shellBlue: ["o","o"], shellBrown: ["B","B"], patternK: ["k","k"], icon: "🐔" },

	// White-egg single-comb
	{ name: "White Leghorn", purpose: "egg",  egg: 320, eggColor: "white", size: 2, combR: ["r","r"], combP: ["p","p"], shellBlue: ["o","o"], shellBrown: ["b","b"], patternK: ["k","k"], icon: "🐔" },
	{ name: "Ancona", purpose: "egg",  egg: 220, eggColor: "white", size: 2, combR: ["r","r"], combP: ["p","p"], shellBlue: ["o","o"], shellBrown: ["b","b"], patternK: ["k","k"], icon: "🐔" },

	// Blue-egg breeds
	{ name: "Ameraucana", purpose: "egg", egg: 200, eggColor: "blue", size: 2, combR: ["r","r"], combP: ["P","P"], shellBlue: ["O","O"], shellBrown: ["b","b"], patternK: ["k","k"], icon: "🐔" },
	{ name: "Araucana", purpose: "egg", egg: 180, eggColor: "blue", size: 2, combR: ["r","r"], combP: ["P","P"], shellBlue: ["O","O"], shellBrown: ["b","b"], patternK: ["k","k"], icon: "🐔" },
	{ name: "Cream Legbar", purpose: "egg", egg: 230, eggColor: "blue", size: 2, combR: ["r","r"], combP: ["p","p"], shellBlue: ["O","O"], shellBrown: ["b","b"], patternK: ["K","K"], icon: "🐔" },
	{ name: "Easter Egger", purpose: "egg", egg: 220, eggColor: "green", size: 2, combR: ["r","r"], combP: ["P","p"], shellBlue: ["O","o"], shellBrown: ["B","b"], patternK: ["k","k"], icon: "🐔" },
	{ name: "Olive Egger", purpose: "egg", egg: 200, eggColor: "olive", size: 2, combR: ["r","r"], combP: ["P","p"], shellBlue: ["O","O"], shellBrown: ["B","B"], patternK: ["k","k"], icon: "🐔" },

	// Barred lines
	{ name: "Plymouth Rock (Barred)", purpose: "dual", egg: 200, eggColor: "brown", size: 2, combR: ["r","r"], combP: ["p","p"], shellBlue: ["o","o"], shellBrown: ["B","B"], patternK: ["K","K"], icon: "🐔" },

	// Walnut/rose/pea examples
	{ name: "Wyandotte", purpose: "dual", egg: 200, eggColor: "brown", size: 2, combR: ["R","R"], combP: ["p","p"], shellBlue: ["o","o"], shellBrown: ["B","B"], patternK: ["k","k"], icon: "🐔" },
	{ name: "Brahma", purpose: "meat", egg: 150, eggColor: "brown", size: 3, combR: ["r","r"], combP: ["P","P"], shellBlue: ["o","o"], shellBrown: ["B","b"], patternK: ["k","k"], icon: "🐔" },
	{ name: "Silkie", purpose: "ornamental", egg: 120, eggColor: "cream", size: 1, combR: ["R","R"], combP: ["P","P"], shellBlue: ["o","o"], shellBrown: ["b","b"], patternK: ["k","k"], icon: "�" },
	{ name: "Marans", purpose: "egg", egg: 180, eggColor: "dark brown", size: 3, combR: ["r","r"], combP: ["p","p"], shellBlue: ["o","o"], shellBrown: ["B","B"], patternK: ["k","k"], icon: "🐔" },
	{ name: "Welsummer", purpose: "egg", egg: 180, eggColor: "dark brown", size: 2, combR: ["r","r"], combP: ["p","p"], shellBlue: ["o","o"], shellBrown: ["B","B"], patternK: ["k","k"], icon: "🐔" },
];

const purposeLabel = (p) => ({ egg: "Egg Layer", meat: "Meat", dual: "Dual Purpose", ornamental: "Ornamental" }[p] || p);

// Helpers
const crossAlleles = (a1, a2) => { const out=[]; for(const x of a1) for(const y of a2) out.push([x,y]); return out; };
const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];
const hasDom = (pair, L) => pair.includes(L);
const genoStr = (pair, L) => pair.map(a => a===L?L:a.toLowerCase()).sort((a,b)=>a>b?1:-1).join("");
const setFromGeno = (geno, L) => [geno[0]===L?L:geno[0].toLowerCase(), geno[1]===L?L:geno[1].toLowerCase()];

const phenotypes = {
	comb: (rPair, pPair) => {
		const R = hasDom(rPair, "R");
		const P = hasDom(pPair, "P");
		if (R && P) return "walnut";
		if (R) return "rose";
		if (P) return "pea";
		return "single";
	},
	eggColor: (oPair, bPair) => {
		const O = hasDom(oPair, "O");
		const B = hasDom(bPair, "B");
		if (O && B) return "olive";
		if (O) return "blue";
		if (B) return bPair.filter((x)=>x==='B').length===2?"dark brown":"brown";
		return "white";
	},
	pattern: (kPair) => (hasDom(kPair, "K") ? "barred" : "solid"),
	size: (nums) => { const avg=(Number(nums[0])+Number(nums[1]))/2; return avg>=2.5?"large":avg>=1.5?"standard":"bantam"; },
};

const makeOffspring = (hen, roo) => {
	const rPair = pick(crossAlleles(hen.combR, roo.combR)).sort();
	const pPair = pick(crossAlleles(hen.combP, roo.combP)).sort();
	const oPair = pick(crossAlleles(hen.shellBlue, roo.shellBlue)).sort();
	const bPair = pick(crossAlleles(hen.shellBrown, roo.shellBrown)).sort();
	const kPair = pick(crossAlleles(hen.patternK, roo.patternK)).sort();
	const size = pick(crossAlleles([hen.size], [roo.size]));

	const eggColor = phenotypes.eggColor(oPair, bPair);
	const pattern = phenotypes.pattern(kPair);
	const combType = phenotypes.comb(rPair, pPair);
	const body = phenotypes.size(size);

	const vigor = hen.name !== roo.name ? 20 : -10; // simple hybrid vigor
	const eggs = Math.max(80, Math.round(((hen.egg + roo.egg) / 2) + vigor + (Math.random() - 0.5) * 30));
	const purpose = eggs >= 250 ? "egg" : body === "large" ? "meat" : eggs >= 180 ? "dual" : "ornamental";

	return { eggColor, pattern, combType, size: body, eggs, purpose };
};

const tallyProbabilities = (hen, roo) => {
	const tally = (arr, map) => {
		const counts = {};
		arr.forEach((x) => { const k = map(x); counts[k]=(counts[k]||0)+1; });
		const total = arr.length; return Object.entries(counts).map(([label,c])=>({label, p:c/total})).sort((a,b)=>b.p-a.p);
	};

	const rPairs = crossAlleles(hen.combR, roo.combR).map(p=>p.sort());
	const pPairs = crossAlleles(hen.combP, roo.combP).map(p=>p.sort());
	const combCombos = [];
	rPairs.forEach(r => pPairs.forEach(p => combCombos.push([r,p])));

	const oPairs = crossAlleles(hen.shellBlue, roo.shellBlue).map(p=>p.sort());
	const bPairs = crossAlleles(hen.shellBrown, roo.shellBrown).map(p=>p.sort());
	const eggCombos = [];
	oPairs.forEach(o => bPairs.forEach(b => eggCombos.push([o,b])));

	const kPairs = crossAlleles(hen.patternK, roo.patternK).map(p=>p.sort());
	const sizePairs = crossAlleles([hen.size], [roo.size]);

	return {
		comb: tally(combCombos, ([r,p]) => phenotypes.comb(r,p)),
		egg: tally(eggCombos, ([o,b]) => phenotypes.eggColor(o,b)),
		feather: tally(kPairs, (k) => phenotypes.pattern(k)),
		size: tally(sizePairs, (s) => phenotypes.size(s)),
	};
};

const Stat = ({ title, value, hint, color = "#cd8539" }) => (
	<div className="rounded-lg p-4" style={{ backgroundColor: `${color}12` }}>
		<div className="text-xs font-medium" style={{ color }}>{title}</div>
		<div className="text-sm font-semibold text-gray-900">{value}</div>
		{hint && <div className="text-[11px] text-gray-500 mt-1">{hint}</div>}
	</div>
);

const BarList = ({ items, color = "#4a7aaf" }) => (
	<div className="space-y-2">
		{items.map(({ label, p }) => (
			<div key={label} className="text-xs">
				<div className="flex justify-between mb-1"><span className="capitalize">{label}</span><span>{Math.round(p*100)}%</span></div>
				<div className="h-2 rounded bg-gray-100 overflow-hidden"><div className="h-full" style={{ width: `${p*100}%`, backgroundColor: color }} /></div>
			</div>
		))}
	</div>
);

const GeneSelect = ({ label, letter, pair, onChange }) => {
	const value = genoStr(pair, letter.toUpperCase());
	const opts = [letter+letter, letter + letter.toLowerCase(), letter.toLowerCase()+letter.toLowerCase()];
	return (
		<label className="flex items-center justify-between gap-2 text-xs border rounded-md px-2 py-1 bg-white">
			<span className="text-gray-600">{label}</span>
			<select className="border rounded px-1 py-0.5 text-xs" value={value} onChange={(e)=>onChange(setFromGeno(e.target.value, letter.toUpperCase()))}>
				{opts.map(o => <option key={o} value={o}>{o}</option>)}
			</select>
		</label>
	);
};

export default function BreedingSimulatorPage() {
	const [hen, setHen] = useState(null);
	const [roo, setRoo] = useState(null);
	const [henBase, setHenBase] = useState(null);
	const [rooBase, setRooBase] = useState(null);
	const [offspring, setOffspring] = useState(null);
	const [gallery, setGallery] = useState([]);
	const [isSim, setIsSim] = useState(false);
	const [query, setQuery] = useState("");
	const [saved, setSaved] = useState([]);
	const [runs, setRuns] = useState(20);
	const [multi, setMulti] = useState(null);
	const [showAdvanced, setShowAdvanced] = useState(false);

	useEffect(() => { try { const raw = localStorage.getItem("sim_pairs"); if (raw) setSaved(JSON.parse(raw)); } catch {} }, []);

	const filtered = useMemo(() => breeds.filter(b => b.name.toLowerCase().includes(query.toLowerCase()) || b.purpose.toLowerCase().includes(query.toLowerCase())), [query]);
	const probs = useMemo(() => (hen && roo ? tallyProbabilities(hen, roo) : null), [hen, roo]);

	const cloneBreed = (b) => JSON.parse(JSON.stringify(b));

	const start = () => {
		if (!hen || !roo) return;
		setIsSim(true); setOffspring(null);
		setTimeout(() => {
			const o = makeOffspring(hen, roo);
			setOffspring(o);
			setGallery((g) => [{...o, id: Date.now()}, ...g].slice(0,12));
			setIsSim(false);
		}, 450);
	};
	const reset = () => { setHen(null); setRoo(null); setHenBase(null); setRooBase(null); setOffspring(null); setMulti(null); setGallery([]); setShowAdvanced(false); };
	const randomize = () => { reset(); const h = cloneBreed(pick(breeds)); let r = cloneBreed(pick(breeds)); if (r.name === h.name) r = cloneBreed(breeds[(breeds.indexOf(breeds.find(x=>x.name===h.name))+1)%breeds.length]); setHen(h); setHenBase(cloneBreed(h)); setRoo(r); setRooBase(cloneBreed(r)); };
	const swap = () => { const h = hen; const hb = henBase; setHen(roo); setHenBase(rooBase); setRoo(h); setRooBase(hb); setOffspring(null); setMulti(null); setGallery([]); };
	const savePair = () => { if (!hen || !roo) return; const next = [{ hen: hen.name, rooster: roo.name }, ...saved.filter(p => !(p.hen===hen.name && p.rooster===roo.name))].slice(0,10); setSaved(next); try { localStorage.setItem("sim_pairs", JSON.stringify(next)); } catch {} };
	const removeSaved = (idx) => { const next = saved.filter((_,i)=>i!==idx); setSaved(next); try { localStorage.setItem("sim_pairs", JSON.stringify(next)); } catch {} };
	const loadPair = (pair) => { const h = breeds.find(b=>b.name===pair.hen); const r = breeds.find(b=>b.name===pair.rooster); if (h&&r){ const hc=cloneBreed(h); const rc=cloneBreed(r); setHen(hc); setHenBase(cloneBreed(h)); setRoo(rc); setRooBase(cloneBreed(r)); setOffspring(null); setMulti(null); setGallery([]);} };
	const share = async () => { if(!hen||!roo) return; const url = new URL(window.location.href); url.searchParams.set('hen', hen.name); url.searchParams.set('rooster', roo.name); try { await navigator.clipboard.writeText(url.toString()); } catch {} };
	useEffect(() => { const p = new URLSearchParams(window.location.search); const h = breeds.find(b=>b.name===p.get('hen')); const r = breeds.find(b=>b.name===p.get('rooster')); if (h){ const hc=cloneBreed(h); setHen(hc); setHenBase(cloneBreed(h)); } if (r){ const rc=cloneBreed(r); setRoo(rc); setRooBase(cloneBreed(r)); } }, []);

	const simulateMany = () => {
		if (!hen || !roo) return;
		const counts = { egg:{}, comb:{}, feather:{}, size:{} };
		for (let i=0;i<Math.max(1, Number(runs)||0);i++){
			const o = makeOffspring(hen, roo);
			counts.egg[o.eggColor]=(counts.egg[o.eggColor]||0)+1;
			counts.comb[o.combType]=(counts.comb[o.combType]||0)+1;
			counts.feather[o.pattern]=(counts.feather[o.pattern]||0)+1;
			counts.size[o.size]=(counts.size[o.size]||0)+1;
		}
		setMulti(counts);
	};

	const copySummary = async () => {
		if (!probs) return;
		const lines = [
			`Comb: ${probs.comb.map(x=>`${x.label} ${Math.round(x.p*100)}%`).join(', ')}`,
			`Egg color: ${probs.egg.map(x=>`${x.label} ${Math.round(x.p*100)}%`).join(', ')}`,
			`Feather: ${probs.feather.map(x=>`${x.label} ${Math.round(x.p*100)}%`).join(', ')}`,
			`Size: ${probs.size.map(x=>`${x.label} ${Math.round(x.p*100)}%`).join(', ')}`,
		].join("\n");
		try { await navigator.clipboard.writeText(lines); } catch {}
	};

	const ParentCard = ({ who, bird, setBird, base }) => (
		<div className={`border-2 rounded-lg p-4 ${who==='hen'? 'from-pink-50 to-pink-100 border-pink-200' : 'from-blue-50 to-blue-100 border-blue-200'} bg-gradient-to-br`}>
			<div className="w-16 h-16 bg-white rounded-full mx-auto mb-2 flex items-center justify-center text-2xl">{bird?bird.icon: who==='hen'? 'H' : 'R'}</div>
			<div className="font-bold text-sm text-center mb-1">{bird?bird.name:(who==='hen'?'Select Hen':'Select Rooster')}</div>
			<div className={`text-xs ${who==='hen'?'text-pink-600':'text-blue-600'} text-center mb-3`}>{who==='hen'?'♀ Female':'♂ Male'}</div>
			{bird && showAdvanced && (
				<div className="space-y-2">
					<div className="text-xs font-semibold text-gray-700">Comb</div>
					<div className="grid grid-cols-2 gap-2">
						<GeneSelect label="R (rose)" letter="R" pair={bird.combR} onChange={(v)=>setBird({...bird, combR: v})} />
						<GeneSelect label="P (pea)" letter="P" pair={bird.combP} onChange={(v)=>setBird({...bird, combP: v})} />
					</div>
					<div className="text-xs font-semibold text-gray-700">Egg shell</div>
					<div className="grid grid-cols-2 gap-2">
						<GeneSelect label="O (blue)" letter="O" pair={bird.shellBlue} onChange={(v)=>setBird({...bird, shellBlue: v})} />
						<GeneSelect label="B (brown)" letter="B" pair={bird.shellBrown} onChange={(v)=>setBird({...bird, shellBrown: v})} />
					</div>
					<div className="text-xs font-semibold text-gray-700">Feather pattern</div>
					<GeneSelect label="K (barred)" letter="K" pair={bird.patternK} onChange={(v)=>setBird({...bird, patternK: v})} />
					<label className="flex items-center justify-between gap-2 text-xs border rounded-md px-2 py-1 bg-white">
						<span className="text-gray-600">Body size</span>
						<input type="range" min={1} max={3} step={1} value={bird.size} onChange={(e)=>setBird({...bird, size:Number(e.target.value)})} />
					</label>
					<button className="w-full text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200" onClick={()=> base && setBird(cloneBreed(base))}>Reset to breed defaults</button>
				</div>
			)}
		</div>
	);

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#fff5e9] to-[#fffaf2]">
					<section className="bg-gradient-to-r from-[#fff0dd] to-[#fff5e9] py-4 md:py-5 sticky top-0 z-10 border-b border-[#ffe8cf]">
				<div className="max-w-6xl mx-auto px-4">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
						<div>
							<div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/80 text-[#cd8539] text-xs font-medium mb-2">
								<Beaker className="h-3.5 w-3.5 mr-2" /> Genetics Lab
							</div>
							<h1 className="text-2xl md:text-3xl font-bold text-gray-900">Breeding Simulator</h1>
							<p className="text-gray-600 mt-1 text-sm">Pick parents, tune genes, preview probabilities, and hatch virtual chicks.</p>
						</div>
								<div className="w-full md:w-auto">
									<div className="flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-2.5 justify-start md:justify-end bg-white/70 backdrop-blur rounded-xl border border-[#ffe2c3] p-2 shadow-sm">
										<button onClick={start} disabled={!hen||!roo||isSim} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#fcba6d] text-white hover:bg-[#eead5f] disabled:bg-gray-300 shrink-0">{isSim?"Breeding…":"Start Breeding"}</button>
										<button onClick={randomize} className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-[#4a7aaf] text-white hover:bg-[#3a6894] shrink-0"><Shuffle className="h-4 w-4"/>Random</button>
										<button onClick={swap} disabled={!hen||!roo} className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-[#5c9d6f] text-white hover:bg-[#4a865c] disabled:bg-gray-300 shrink-0"><ArrowLeftRight className="h-4 w-4"/>Swap</button>
										<button onClick={()=>setShowAdvanced(v=>!v)} className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-white text-gray-800 border hover:bg-gray-50 shrink-0">{showAdvanced?"Hide Advanced":"Advanced"}</button>
										<button onClick={reset} className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-gray-600 text-white hover:bg-gray-700 shrink-0"><RefreshCcw className="h-4 w-4"/>Reset</button>
									</div>
								</div>
					</div>
				</div>
			</section>

			<div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
				{/* Parent Selection Row */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
					<ParentCard who="hen" bird={hen} setBird={setHen} base={henBase} />
					<ParentCard who="roo" bird={roo} setBird={setRoo} base={rooBase} />
				</div>

				{/* Offspring Display */}
				<div className="bg-white rounded-xl shadow-lg p-6 mb-6">
					<div className="mb-6">
						<h3 className="text-xl font-bold text-gray-900">Breeding Results</h3>
					</div>
					
					{/* Offspring Result */}
					<div className="bg-gradient-to-br from-[#fff8ef] to-[#fff0dd] border-2 border-[#ffecd4] rounded-xl p-8 text-center mb-6">
						{isSim ? (
							<>
								<div className="w-20 h-20 bg-[#ffecd4] rounded-full mx-auto mb-4 flex items-center justify-center text-3xl animate-pulse"><Egg className="h-8 w-8 text-[#cd8539]"/></div>
								<div className="text-lg font-semibold text-gray-800">Incubating…</div>
								<div className="text-sm text-gray-600 mt-1">Creating your new chick</div>
							</>
						) : offspring ? (
							<>
								<div className="w-20 h-20 bg-[#ffecd4] rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">🐣</div>
								<div className="text-xl font-bold mb-3 text-gray-800">{hen.name.split(" ")[0]}–{roo.name.split(" ")[0]} chick</div>
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
									<Stat title="Egg Color" value={offspring.eggColor} color="#8a5a9d"/>
									<Stat title="Feather" value={offspring.pattern} color="#5c9d6f"/>
									<Stat title="Comb" value={offspring.combType} color="#4a7aaf"/>
									<Stat title="Size" value={offspring.size} color="#cd8539"/>
								</div>
								<div className="mt-4 max-w-xs mx-auto"><Stat title="Production" value={`${offspring.eggs}/yr`} hint={purposeLabel(offspring.purpose)} /></div>
							</>
						) : (
							<>
								<div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">🥚</div>
								<div className="text-lg text-gray-600">Select parents to breed</div>
								<div className="text-sm text-gray-500 mt-1">Choose a hen and rooster to see breeding results</div>
							</>
						)}
					</div>
				</div>

				{/* Genetics Information */}
				{(hen || roo) && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
						{/* Parent Genotypes */}
						<div className="bg-white rounded-xl shadow-lg p-6">
							<h4 className="text-lg font-semibold mb-4 text-gray-900">Parent Genotypes</h4>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="rounded-lg p-4 bg-pink-50 border border-pink-100">
									<div className="font-semibold mb-2 text-pink-800 flex items-center">
										<span className="text-lg mr-2">♀</span> Hen
									</div>
									{hen ? (
										<div className="space-y-1 text-sm">
											<div className="text-gray-700">R: <span className="font-mono">{genoStr(hen.combR,'R')}</span> • P: <span className="font-mono">{genoStr(hen.combP,'P')}</span></div>
											<div className="text-gray-700">O: <span className="font-mono">{genoStr(hen.shellBlue,'O')}</span> • B: <span className="font-mono">{genoStr(hen.shellBrown,'B')}</span></div>
											<div className="text-gray-700">K: <span className="font-mono">{genoStr(hen.patternK,'K')}</span> • Size: <span className="font-mono">{hen.size}</span></div>
										</div>
									) : <div className="text-gray-500 text-sm">Not selected</div>}
								</div>
								<div className="rounded-lg p-4 bg-blue-50 border border-blue-100">
									<div className="font-semibold mb-2 text-blue-800 flex items-center">
										<span className="text-lg mr-2">♂</span> Rooster
									</div>
									{roo ? (
										<div className="space-y-1 text-sm">
											<div className="text-gray-700">R: <span className="font-mono">{genoStr(roo.combR,'R')}</span> • P: <span className="font-mono">{genoStr(roo.combP,'P')}</span></div>
											<div className="text-gray-700">O: <span className="font-mono">{genoStr(roo.shellBlue,'O')}</span> • B: <span className="font-mono">{genoStr(roo.shellBrown,'B')}</span></div>
											<div className="text-gray-700">K: <span className="font-mono">{genoStr(roo.patternK,'K')}</span> • Size: <span className="font-mono">{roo.size}</span></div>
										</div>
									) : <div className="text-gray-500 text-sm">Not selected</div>}
								</div>
							</div>
						</div>

						{/* Breeding Probabilities */}
						{probs && offspring && (
							<div className="bg-white rounded-xl shadow-lg p-6">
								<h4 className="text-lg font-semibold mb-4 text-gray-900">Breeding Probabilities</h4>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<div className="text-sm font-medium mb-2 text-[#4a7aaf]">Comb Type</div>
										<BarList items={probs.comb} color="#4a7aaf"/>
									</div>
									<div>
										<div className="text-sm font-medium mb-2 text-[#8a5a9d]">Egg Color</div>
										<BarList items={probs.egg} color="#8a5a9d"/>
									</div>
									<div>
										<div className="text-sm font-medium mb-2 text-[#5c9d6f]">Feather Pattern</div>
										<BarList items={probs.feather} color="#5c9d6f"/>
									</div>
									<div>
										<div className="text-sm font-medium mb-2 text-[#cd8539]">Body Size</div>
										<BarList items={probs.size} color="#cd8539"/>
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Breed Library */}
				<div className="bg-white rounded-xl shadow-lg p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-bold text-gray-900">Available Breeds</h3>
						<div className="flex items-center gap-2">
							<input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search breeds..." className="border rounded-md px-3 py-1.5 text-sm" />
							{saved.length>0 && (
								<select onChange={(e)=>{ const idx=Number(e.target.value); if(!Number.isNaN(idx)) loadPair(saved[idx]); e.currentTarget.selectedIndex=0; }} className="border rounded-md px-2 py-1 text-sm">
									<option>Saved pairs…</option>
									{saved.map((p,i)=>(<option key={`${p.hen}-${p.rooster}-${i}`} value={i}>{p.hen} × {p.rooster}</option>))}
								</select>
							)}
						</div>
					</div>
					{saved.length>0 && (
						<div className="flex flex-wrap gap-2 mb-4">
							{saved.map((p,i)=>(
								<span key={`${p.hen}-${p.rooster}-${i}`} className="text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2 py-1">
									{p.hen} × {p.rooster}
									<button className="ml-1.5 text-[10px] opacity-70 hover:opacity-100" onClick={()=>removeSaved(i)}>×</button>
								</span>
							))}
						</div>
					)}
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
						{filtered.map((b) => (
							<button key={b.name} onClick={() => {
								const bc = JSON.parse(JSON.stringify(b));
								if (!hen) { setHen(bc); setHenBase(JSON.parse(JSON.stringify(b))); }
								else if (!roo) { setRoo(bc); setRooBase(JSON.parse(JSON.stringify(b))); }
								else { setHen(bc); setHenBase(JSON.parse(JSON.stringify(b))); setRoo(null); setRooBase(null); setOffspring(null); setMulti(null); setGallery([]);} }}
								className="group bg-gray-50 hover:bg-[#fff5e9] border border-gray-200 hover:border-[#ffecd4] rounded-lg p-3 transition-all">
								<div className="w-12 h-12 bg-white rounded-full mx-auto mb-2 flex items-center justify-center text-xl border-2 border-gray-200 group-hover:border-[#ffecd4]">{b.icon}</div>
								<div className="text-center">
									<div className="font-medium text-xs text-gray-900 mb-1 leading-tight">{b.name}</div>
									<div className="text-xs text-gray-500 mb-1">{purposeLabel(b.purpose)}</div>
									<div className="text-xs text-[#cd8539] font-medium">{b.egg}/yr • {b.eggColor}</div>
								</div>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

