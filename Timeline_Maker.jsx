import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, Calendar, Save, Download, ChevronDown, ChevronUp, Settings, GripVertical, Layers, Image as ImageIcon, Upload, FileDown, FileText, GripHorizontal, Merge, Split, MousePointer, Check, Palette, UserPlus, EyeOff, X } from 'lucide-react';

// ==========================================
// SHARED COMPONENTS & UTILS
// ==========================================

const getCellKey = (yearId, rowId, memberId) => `${yearId}-${rowId}-${memberId}`;

const Card = ({ children, className = "", style = {}, id="" }) => (
  <div id={id} className={`bg-white rounded-lg shadow-sm border border-slate-200 ${className}`} style={style}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = "primary", size = "md", className = "", disabled = false, title = "" }) => {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-500",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-500",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    active: "bg-blue-100 text-blue-700 border border-blue-300 ring-2 ring-blue-500 ring-offset-1"
  };
  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-xs font-semibold",
    icon: "p-1.5"
  };
  return (
    <button onClick={onClick} disabled={disabled} title={title} className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
};

// ==========================================
// CONFIGURATION (GLOBAL)
// ==========================================

// Initial Generic Committee Data (Non-PII) - Used to initialize state
const INITIAL_COMMITTEE = [
  { 
    id: 'mentor', 
    name: 'Primary Mentor', 
    role: 'Chair', 
    color: 'bg-slate-100 text-slate-800 border-slate-200', 
    svgHeaderFill: '#f1f5f9', 
    svgHeaderStroke: '#cbd5e1'
  },
  { 
    id: 'co-mentor1', 
    name: 'Co-Mentor A', 
    role: 'Co-Mentor', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    svgHeaderFill: '#dbeafe', 
    svgHeaderStroke: '#bfdbfe'
  },
  { 
    id: 'co-mentor2', 
    name: 'Co-Mentor B', 
    role: 'Co-Mentor', 
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    svgHeaderFill: '#d1fae5', 
    svgHeaderStroke: '#a7f3d0'
  },
  { 
    id: 'advisor', 
    name: 'Advisor C', 
    role: 'Advisor', 
    color: 'bg-red-100 text-red-800 border-red-200',
    svgHeaderFill: '#fee2e2', 
    svgHeaderStroke: '#fecaca'
  },
  { 
    id: 'consultant', 
    name: 'Consultant D', 
    role: 'Consultant', 
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    svgHeaderFill: '#ffedd5', 
    svgHeaderStroke: '#fed7aa'
  },
];

const YEARS = [
  { id: 'y1', label: 'Year 1' },
  { id: 'y2', label: 'Year 2' }
];

// Special Rows for Training Timeline (Defaults)
const OBJECTIVES_ROW_DEFAULT = { id: 'training_objectives', label: 'Main Training Objectives', type: 'text_only' };
const TOPIC_ROW_1_DEFAULT = { id: 'topics_mtg1', label: 'Topics, Committee Mtg 1', type: 'text_only' };
const TOPIC_ROW_2_DEFAULT = { id: 'topics_mtg2', label: 'Topics, Committee Mtg 2', type: 'text_only' };

// Definition of standard rows per year (Defaults) - active logic moved to initialization only
const ROW_DEFINITIONS_DEFAULT = [
  { id: 'weekly', label: 'Weekly Meetings', type: 'recurring', initialActive: ['mentor'] },
  { id: 'monthly', label: 'Monthly Meetings', type: 'recurring', initialActive: ['mentor', 'co-mentor1', 'co-mentor2'] },
  { id: 'poll_q1', label: 'Availability Poll', type: 'poll', initialActive: ['advisor'] },
  { id: 'meet_q1', label: '3-Month Advisor Mtg', type: 'meeting', initialActive: ['advisor'] },
  { id: 'poll_sem1', label: 'Availability Poll', type: 'poll', initialActive: ['mentor', 'co-mentor1', 'co-mentor2', 'advisor', 'consultant'] },
  { id: 'meet_sem1', label: '6-Month Committee', type: 'meeting', initialActive: ['mentor', 'co-mentor1', 'co-mentor2', 'advisor', 'consultant'] },
];

const EXP_AVAILABLE_COLORS = [
  'bg-slate-400', 'bg-slate-600', 'bg-red-500', 'bg-red-600', 'bg-orange-500', 'bg-orange-600',
  'bg-amber-400', 'bg-amber-600', 'bg-lime-500', 'bg-lime-600', 'bg-emerald-500', 'bg-emerald-600',
  'bg-teal-400', 'bg-teal-600', 'bg-cyan-400', 'bg-cyan-600', 'bg-sky-400', 'bg-sky-600',
  'bg-blue-500', 'bg-blue-600', 'bg-indigo-500', 'bg-indigo-600', 'bg-purple-500', 'bg-purple-600',
  'bg-fuchsia-400', 'bg-fuchsia-600', 'bg-rose-400', 'bg-rose-600'
];

const EXP_HEX_MAP = {
  'bg-slate-100': '#f1f5f9', 'bg-slate-200': '#e2e8f0', 'bg-slate-300': '#cbd5e1', 'bg-slate-400': '#94a3b8', 'bg-slate-50': '#f8fafc', 'bg-slate-600': '#475569',
  'bg-red-400': '#f87171', 'bg-red-500': '#ef4444', 'bg-red-600': '#dc2626',
  'bg-orange-500': '#f97316', 'bg-orange-600': '#ea580c',
  'bg-amber-400': '#fbbf24', 'bg-amber-600': '#d97706',
  'bg-lime-500': '#84cc16', 'bg-lime-600': '#65a30d',
  'bg-emerald-500': '#10b981', 'bg-emerald-600': '#059669',
  'bg-teal-400': '#2dd4bf', 'bg-teal-600': '#0d9488',
  'bg-cyan-400': '#22d3ee', 'bg-cyan-600': '#0891b2',
  'bg-sky-400': '#38bdf8', 'bg-sky-500': '#0ea5e9', 'bg-sky-600': '#0284c7',
  'bg-blue-100': '#dbeafe', 'bg-blue-500': '#3b82f6', 'bg-blue-600': '#2563eb', 'bg-blue-700': '#1d4ed8',
  'bg-indigo-500': '#6366f1', 'bg-indigo-600': '#4f46e5',
  'bg-purple-500': '#a855f7', 'bg-purple-600': '#9333ea',
  'bg-fuchsia-400': '#e879f9', 'bg-fuchsia-600': '#c026d3',
  'bg-rose-400': '#fb7185', 'bg-rose-600': '#e11d48',
  'bg-white': '#ffffff'
};

const EXP_PHASE_CONFIG = {
  bench: { 
    label: "Bench", 
    defaultColor: "bg-lime-500", 
    emoji: "✏️", 
    svgPaths: [
        { d: "M19.07 2.93L21.07 4.93C21.46 5.32 21.46 5.95 21.07 6.34L19.5 7.91L16.09 4.5L17.66 2.93C18.05 2.54 18.68 2.54 19.07 2.93Z", fill: "#F87171" }, // Eraser
        { d: "M16.09 4.5L19.5 7.91L8.5 18.91L5.09 15.5L16.09 4.5Z", fill: "#FBBF24" }, // Body
        { d: "M5.09 15.5L8.5 18.91L3 21L5.09 15.5Z", fill: "#1E293B" } // Tip
    ],
    offsetPercent: 0.15, 
    offset: "top-[15%]" 
  },
  external: { 
    label: "External", 
    defaultColor: "bg-orange-500", 
    emoji: "🧬", 
    svgPaths: [
        { d: "M7 6 L17 6 M7 10 L17 10 M7 14 L17 14 M7 18 L17 18", fill: "none", stroke: "#CBD5E1", strokeWidth: 2 },
        { d: "M7 4 C 7 4, 11 8, 11 12 C 11 16, 7 20, 7 20", fill: "none", stroke: "#3B82F6", strokeWidth: 3 },
        { d: "M17 4 C 17 4, 13 8, 13 12 C 13 16, 17 20, 17 20", fill: "none", stroke: "#F97316", strokeWidth: 3 }
    ],
    offsetPercent: 0.50, 
    offset: "top-[50%]" 
  },
  analysis: { 
    label: "Analysis", 
    defaultColor: "bg-sky-500", 
    emoji: "💻", 
    svgPaths: [
        { d: "M2 4 H22 V17 H2 Z", fill: "#475569" }, // Bezel
        { d: "M4 6 H20 V15 H4 Z", fill: "#38BDF8" }, // Screen
        { d: "M0 17 H24 V19 H0 Z", fill: "#94A3B8" } // Base
    ],
    offsetPercent: 0.85, 
    offset: "top-[85%]" 
  }
};

const HEADER_BG_COLORS = {
  'bg-blue-50': '#eff6ff',
  'bg-orange-50': '#fff7ed',
  'bg-emerald-50': '#ecfdf5',
  'bg-purple-50': '#faf5ff',
  'bg-red-50': '#fef2f2',
  'bg-yellow-50': '#fefce8',
  'bg-slate-50': '#f8fafc',
};
const HEADER_BG_KEYS = Object.keys(HEADER_BG_COLORS);

// Generic Initial Data for Public Release
const expInitialData = [
  { id: 1, label: "Phase 1: Mentored Training", type: "section", start: 0, duration: 24, color: "bg-slate-100" },
  { id: 2, label: "Aim 1: Primary Research Goal", type: "task", start: 0, duration: 12, color: "bg-red-500" },
  { id: 3, label: "Aim 1.1: Initial Experiments & Validation", type: "task", start: 0, duration: 12, color: "bg-red-400", usePhases: true, phases: { bench: { start: 0, duration: 3, color: "bg-lime-500" }, external: { start: 3, duration: 4, color: "bg-orange-500" }, analysis: { start: 7, duration: 2, color: "bg-sky-500" } } },
  { id: 4, label: "Aim 1.2: Advanced Characterization", type: "task", start: 2, duration: 9, color: "bg-red-400", usePhases: true, phases: { bench: { start: 2, duration: 3, color: "bg-lime-500" }, external: { start: 5, duration: 3, color: "bg-orange-500" }, analysis: { start: 8, duration: 2, color: "bg-sky-500" } } },
  { id: 6, label: "Aim 2: Secondary Research Goal", type: "task", start: 12, duration: 12, color: "bg-emerald-600" },
  { id: 7, label: "Aim 2.1: Mechanism Study", type: "task", start: 12, duration: 8, color: "bg-emerald-500", usePhases: true, phases: { bench: { start: 12, duration: 4, color: "bg-lime-500" }, external: { start: 16, duration: 2, color: "bg-orange-500" }, analysis: { start: 18, duration: 2, color: "bg-sky-500" } } },
  { id: 10, label: "Manuscript 1 Submission", type: "task", start: 12, duration: 3, color: "bg-emerald-600" },
  { id: 12, label: "Phase 2: Independent Research", type: "section", start: 24, duration: 36, color: "bg-slate-200" },
  { id: 13, label: "Aim 3: Independent Project Launch", type: "task", start: 24, duration: 36, color: "bg-blue-600" },
  { id: 14, label: "Aim 3.1: Tool Development", type: "task", start: 24, duration: 18, color: "bg-blue-500", usePhases: true, phases: { bench: { start: 24, duration: 6, color: "bg-lime-500" }, external: { start: 30, duration: 6, color: "bg-orange-500" }, analysis: { start: 24, duration: 0, color: "bg-sky-500" } } },
  { id: 17, label: "Major Grant Submission", type: "task", start: 54, duration: 6, color: "bg-blue-600" },
];

// ==========================================
// EXPERIMENTAL TIMELINE COMPONENT
// ==========================================

function ExperimentalTimeline() {
  const [items, setItems] = useState(expInitialData);
  
  // App Config State
  const [projectTitle, setProjectTitle] = useState("Research Project Timeline");
  const [projectSubtitle, setProjectSubtitle] = useState("Proposal: Innovation and Strategy");
  const [durationYears, setDurationYears] = useState(5);
  
  // Header State with Background Colors
  const [columnHeaders, setColumnHeaders] = useState(Array.from({length: 7}, (_, i) => ({
      phase: i < 2 ? 'Mentored' : 'Independent',
      year: `Year ${i+1}`,
      bgColor: i < 2 ? 'bg-blue-50' : 'bg-orange-50'
  })));

  const [editingId, setEditingId] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [leftColPercent, setLeftColPercent] = useState(28);
  
  const containerRef = useRef(null);
  const fileInputRef = useRef(null); 
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  // Derived Values
  const totalMonths = durationYears * 12;

  const handleHeaderChange = (index, field, value) => {
    const newHeaders = [...columnHeaders];
    if (!newHeaders[index]) newHeaders[index] = { phase: '', year: '', bgColor: 'bg-slate-50' };
    newHeaders[index][field] = value;
    setColumnHeaders(newHeaders);
  };

  const cycleHeaderColor = (index) => {
    const newHeaders = [...columnHeaders];
    if (!newHeaders[index]) newHeaders[index] = { phase: '', year: '', bgColor: 'bg-slate-50' };
    
    const currentBg = newHeaders[index].bgColor || 'bg-slate-50';
    const currentIndex = HEADER_BG_KEYS.indexOf(currentBg);
    const nextIndex = (currentIndex + 1) % HEADER_BG_KEYS.length;
    
    newHeaders[index].bgColor = HEADER_BG_KEYS[nextIndex];
    setColumnHeaders(newHeaders);
  };

  const handleSaveSVG = () => {
    // 1. Setup dimensions
    const svgWidth = 1200;
    const baseRowHeight = 36;
    const headerHeight = 50;
    const padding = 20;
    const leftColWidth = (leftColPercent / 100) * svgWidth;
    const rightColWidth = svgWidth - leftColWidth;
    
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const getColor = (cls) => EXP_HEX_MAP[cls] || '#cbd5e1';
    const getHeaderBg = (cls) => HEADER_BG_COLORS[cls] || '#f8fafc';

    const wrapText = (text, maxWidth, fontSize = 12) => {
        const avgCharWidth = fontSize * 0.6;
        const maxChars = Math.floor(maxWidth / avgCharWidth);
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
            if (currentLine.length + 1 + words[i].length <= maxChars) {
                currentLine += " " + words[i];
            } else {
                lines.push(currentLine);
                currentLine = words[i];
            }
        }
        lines.push(currentLine);
        return lines;
    };

    const rowHeights = items.map(item => {
        const lines = wrapText(item.label, leftColWidth - (padding * 2));
        return Math.max(baseRowHeight, (lines.length * 14) + 16); 
    });

    const headerY = padding + 60; 
    const totalHeight = headerY + headerHeight + rowHeights.reduce((a, b) => a + b, 0) + (padding * 2);
    const monthsPerYear = 12;
    const pxPerMonth = rightColWidth / totalMonths;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${totalHeight}" viewBox="0 0 ${svgWidth} ${totalHeight}" style="font-family: Arial, sans-serif;">`;
    svg += `<rect width="100%" height="100%" fill="white" />`;
    svg += `<text x="${padding}" y="${padding + 14}" font-size="18" font-weight="bold" fill="#0f172a">${esc(projectTitle)}</text>`;
    svg += `<text x="${padding}" y="${padding + 34}" font-size="12" fill="#64748b">${esc(projectSubtitle)}</text>`;

    // Key/Legend
    const keyY = padding + 40;
    let currentKeyX = svgWidth - 300; // Right align key roughly
    const keyItems = [
        { phaseKey: 'bench' },
        { phaseKey: 'external' },
        { phaseKey: 'analysis' }
    ];

    keyItems.forEach(k => {
        if (k.phaseKey) {
            const config = EXP_PHASE_CONFIG[k.phaseKey];
            const iconSize = 24;
            const scale = 0.4;
            const yOffset = keyY - (iconSize * scale / 2) + 1;
            svg += `<g transform="translate(${currentKeyX}, ${yOffset}) scale(${scale})">`;
            config.svgPaths.forEach(p => {
                svg += `<path d="${p.d}" fill="${p.fill || 'none'}" stroke="${p.stroke || 'none'}" stroke-width="${p.strokeWidth || 0}" />`;
            });
            svg += `</g>`;
            svg += `<text x="${currentKeyX + 14}" y="${keyY + 4}" font-size="10" fill="#475569">${esc(config.label)}</text>`;
            currentKeyX += (config.label.length * 6) + 30;
        }
    });

    // Header (Years)
    svg += `<line x1="0" y1="${headerY + headerHeight}" x2="${svgWidth}" y2="${headerY + headerHeight}" stroke="#e2e8f0" stroke-width="1" />`;
    svg += `<text x="${leftColWidth / 2}" y="${headerY + 30}" text-anchor="middle" font-size="14" font-weight="bold" fill="#334155">Aims &amp; Milestones</text>`;

    // Render Dynamic Columns
    for (let i = 0; i < durationYears; i++) {
        const x = leftColWidth + (i * monthsPerYear * pxPerMonth);
        const w = monthsPerYear * pxPerMonth;
        
        // Use custom headers & colors
        const header = columnHeaders[i] || { phase: '', year: '', bgColor: 'bg-slate-50' };
        const bgHex = getHeaderBg(header.bgColor);

        svg += `<rect x="${x}" y="${headerY}" width="${w}" height="${headerHeight}" fill="${bgHex}" opacity="0.5"/>`;
        if (i < durationYears - 1) {
            svg += `<line x1="${x + w}" y1="${headerY}" x2="${x + w}" y2="${headerY + headerHeight}" stroke="#e2e8f0" stroke-width="1" />`;
        }
        svg += `<text x="${x + w/2}" y="${headerY + 20}" text-anchor="middle" font-size="10" fill="#64748b" letter-spacing="1">${esc(header.phase)}</text>`;
        svg += `<text x="${x + w/2}" y="${headerY + 38}" text-anchor="middle" font-size="12" font-weight="bold" fill="#334155">${esc(header.year)}</text>`;
    }

    // Rows
    let currentY = headerY + headerHeight;

    items.forEach((item, index) => {
        const rowHeight = rowHeights[index];
        const y = currentY;
        currentY += rowHeight;

        const isSection = item.type === 'section';
        const rowBg = isSection ? '#f8fafc' : '#ffffff';
        
        svg += `<rect x="0" y="${y}" width="${svgWidth}" height="${rowHeight}" fill="${rowBg}" />`;
        svg += `<line x1="0" y1="${y + rowHeight}" x2="${svgWidth}" y2="${y + rowHeight}" stroke="#f1f5f9" stroke-width="1" />`;
        svg += `<line x1="${leftColWidth}" y1="${y}" x2="${leftColWidth}" y2="${y + rowHeight}" stroke="#e2e8f0" stroke-width="1" />`;
        
        const labelLines = wrapText(item.label, leftColWidth - (padding * 2));
        const txtStartY = y + (rowHeight / 2) - (labelLines.length * 14 / 2) + 10;
        
        labelLines.forEach((line, li) => {
             const lineY = txtStartY + (li * 14); 
             const weight = isSection ? 'bold' : 'normal';
             const color = isSection ? '#1e293b' : '#475569';
             svg += `<text x="${padding}" y="${lineY}" font-size="12" font-weight="${weight}" fill="${color}">${esc(line)}</text>`;
        });

        // Grid lines
        for(let i=1; i<durationYears; i++) {
             const gx = leftColWidth + (i * 12 * pxPerMonth);
             svg += `<line x1="${gx}" y1="${y}" x2="${gx}" y2="${y + rowHeight}" stroke="#f1f5f9" stroke-dasharray="4" />`;
        }

        const barX = leftColWidth + (item.start * pxPerMonth);
        const barW = item.duration * pxPerMonth;

        if (isSection) {
            svg += `<rect x="${barX}" y="${y + 4}" width="${barW}" height="${rowHeight - 8}" rx="4" fill="${getColor(item.color)}" opacity="0.4" />`;
        } else if (item.usePhases && item.phases) {
             ['bench', 'external', 'analysis'].forEach(pKey => {
                 const phase = item.phases[pKey];
                 if (phase && phase.duration > 0) {
                     const pX = leftColWidth + (phase.start * pxPerMonth);
                     const pW = phase.duration * pxPerMonth;
                     const pColor = getColor(phase.color || EXP_PHASE_CONFIG[pKey].defaultColor);
                     const offset = EXP_PHASE_CONFIG[pKey].offsetPercent;
                     const pY = y + (rowHeight * offset);
                     
                     svg += `<line x1="${pX}" y1="${pY}" x2="${pX + pW}" y2="${pY}" stroke="${pColor}" stroke-width="2" />`;
                     svg += `<line x1="${pX}" y1="${pY - 3}" x2="${pX}" y2="${pY + 3}" stroke="${pColor}" stroke-width="2" />`;
                     svg += `<line x1="${pX + pW}" y1="${pY - 3}" x2="${pX + pW}" y2="${pY + 3}" stroke="${pColor}" stroke-width="2" />`;
                     
                     const iconScale = 0.4;
                     const iconSize = 24 * iconScale; 
                     const iconX = pX + pW/2 - (iconSize/2);
                     const iconY = pY - (iconSize/2);

                     svg += `<circle cx="${pX + pW/2}" cy="${pY}" r="7" fill="white" stroke="#e2e8f0" stroke-width="1" />`;
                     svg += `<g transform="translate(${iconX}, ${iconY}) scale(${iconScale})">`;
                     EXP_PHASE_CONFIG[pKey].svgPaths.forEach(p => {
                        svg += `<path d="${p.d}" fill="${p.fill || 'none'}" stroke="${p.stroke || 'none'}" stroke-width="${p.strokeWidth || 0}" />`;
                     });
                     svg += `</g>`;
                 }
             });
        } else {
            const barColor = getColor(item.color);
            const midY = y + (rowHeight / 2);
            svg += `<line x1="${barX}" y1="${midY}" x2="${barX + barW}" y2="${midY}" stroke="${barColor}" stroke-width="2" />`;
            svg += `<line x1="${barX}" y1="${midY - 4}" x2="${barX}" y2="${midY + 4}" stroke="${barColor}" stroke-width="2" />`;
            svg += `<line x1="${barX + barW}" y1="${midY - 4}" x2="${barX + barW}" y2="${midY + 4}" stroke="${barColor}" stroke-width="2" />`;
            
            if (item.duration >= 2) {
                 svg += `<rect x="${barX + barW/2 - 12}" y="${midY - 6}" width="24" height="12" rx="2" fill="white" stroke="#e2e8f0" stroke-width="1" opacity="0.9" />`;
                 svg += `<text x="${barX + barW/2}" y="${midY + 3}" text-anchor="middle" font-size="8" font-weight="bold" fill="#64748b">${Math.floor(item.duration)}m</text>`;
            }
        }
    });

    svg += '</svg>';

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'experimental_timeline.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveDraft = () => {
    const payload = {
      items,
      projectTitle,
      projectSubtitle,
      durationYears,
      columnHeaders
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "experimental_timeline_draft.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleLoadDraft = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (Array.isArray(json)) {
            // Legacy format
            setItems(json);
        } else {
            // New format
            if (json.items) setItems(json.items);
            if (json.projectTitle) setProjectTitle(json.projectTitle);
            if (json.projectSubtitle) setProjectSubtitle(json.projectSubtitle);
            if (json.durationYears) setDurationYears(json.durationYears);
            if (json.columnHeaders) setColumnHeaders(json.columnHeaders);
        }
      } catch (error) { alert("Error loading draft."); }
    };
    reader.readAsText(file);
    event.target.value = null; 
  };

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback((e) => {
    if (isResizing && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        let newWidth = e.clientX - containerRect.left;
        let newPercent = (newWidth / containerRect.width) * 100;
        if (newPercent < 15) newPercent = 15;
        if (newPercent > 60) newPercent = 60;
        setLeftColPercent(newPercent);
    }
  }, [isResizing]);

  useEffect(() => {
      if (isResizing) {
          window.addEventListener('mousemove', resize);
          window.addEventListener('mouseup', stopResizing);
      }
      return () => {
          window.removeEventListener('mousemove', resize);
          window.removeEventListener('mouseup', stopResizing);
      };
  }, [isResizing, resize, stopResizing]);

  const handleUpdateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const togglePhases = (item) => {
    if (!item.usePhases && !item.phases) {
        const partDur = Math.max(1, Math.floor(item.duration / 3));
        const newPhases = {
            bench: { start: item.start, duration: partDur, color: "bg-lime-500" },
            external: { start: item.start + partDur, duration: partDur, color: "bg-orange-500" },
            analysis: { start: item.start + 2*partDur, duration: partDur, color: "bg-sky-500" }
        };
        setItems(items.map(i => i.id === item.id ? { ...i, usePhases: true, phases: newPhases } : i));
    } else {
        handleUpdateItem(item.id, 'usePhases', !item.usePhases);
    }
  };

  const handleUpdatePhase = (id, phaseType, field, value) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      return { ...item, phases: { ...item.phases, [phaseType]: { ...item.phases[phaseType], [field]: value } } };
    }));
  };

  const handleDeleteItem = (id) => setItems(items.filter(item => item.id !== id));
   
  const handleAddItem = () => {
    const newItem = { id: Date.now(), label: "New Task", type: "task", start: 0, duration: 12, color: "bg-blue-500", usePhases: false, phases: { bench: { start: 0, duration: 4, color: "bg-lime-500" }, external: { start: 4, duration: 4, color: "bg-orange-500" }, analysis: { start: 8, duration: 4, color: "bg-sky-500" } } };
    setItems([...items, newItem]);
    setEditingId(newItem.id);
  };
   
  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
        return;
    }
    const _items = [...items];
    const draggedItemContent = _items.splice(dragItem.current, 1)[0];
    _items.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setItems(_items);
  };

  return (
    <div className="flex flex-col items-center select-none" onMouseUp={stopResizing}>
      <input type="file" ref={fileInputRef} onChange={handleLoadDraft} accept=".json" style={{ display: 'none' }} />
      <div className="w-full max-w-6xl space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div className="flex-1">
            <input 
              type="text" 
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="text-xl font-bold text-slate-900 w-full bg-transparent border-none focus:ring-0 p-0"
              placeholder="Project Title"
            />
            <input 
              type="text" 
              value={projectSubtitle}
              onChange={(e) => setProjectSubtitle(e.target.value)}
              className="text-sm text-slate-500 w-full bg-transparent border-none focus:ring-0 p-0"
              placeholder="Subtitle"
            />
          </div>
          
          {/* Duration Selector */}
          <div className="flex items-center gap-2 bg-white rounded border border-slate-200 px-2 py-1 mr-4">
            <span className="text-xs font-semibold text-slate-500">Duration:</span>
            <select 
              value={durationYears} 
              onChange={(e) => setDurationYears(parseInt(e.target.value))}
              className="text-xs border-none bg-transparent py-0 pl-0 pr-6 font-bold text-slate-700 cursor-pointer focus:ring-0"
            >
              {[1,2,3,4,5,6,7].map(y => <option key={y} value={y}>{y} Years</option>)}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
             <Button onClick={() => window.print()} variant="secondary" size="sm"><Download className="w-3 h-3 mr-1" /> Print</Button>
             <Button onClick={handleSaveSVG} variant="secondary" size="sm"><ImageIcon className="w-3 h-3 mr-1" /> Save SVG</Button>
             <Button onClick={handleSaveDraft} variant="secondary" size="sm"><FileDown className="w-3 h-3 mr-1" /> Save Draft</Button>
             <Button onClick={() => fileInputRef.current.click()} variant="secondary" size="sm"><Upload className="w-3 h-3 mr-1" /> Load Draft</Button>
             <Button onClick={handleAddItem} variant="primary" size="sm"><Plus className="w-3 h-3 mr-1" /> Add Row</Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 bg-white p-2 rounded-md border border-slate-200 items-center shadow-sm">
            <span className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-1.5"></span> Aim 1</span>
            <span className="flex items-center"><span className="w-2 h-2 bg-emerald-600 rounded-full mr-1.5"></span> Aim 2</span>
            <span className="flex items-center"><span className="w-2 h-2 bg-blue-600 rounded-full mr-1.5"></span> Aim 3</span>
            <div className="h-4 w-px bg-slate-300 mx-2"></div>
            <span className="flex items-center gap-1"><span className="text-sm leading-none">{EXP_PHASE_CONFIG.bench.emoji}</span> Bench</span>
            <span className="flex items-center gap-1"><span className="text-sm leading-none">{EXP_PHASE_CONFIG.external.emoji}</span> External</span>
            <span className="flex items-center gap-1"><span className="text-sm leading-none">{EXP_PHASE_CONFIG.analysis.emoji}</span> Analysis</span>
            <span className="flex items-center ml-auto text-xs text-slate-400">Total Scale: {totalMonths} Months</span>
        </div>

        <Card id="timeline-card" className="overflow-hidden bg-white w-full" style={{ fontFamily: 'Arial, sans-serif' }}>
          <div className="w-full overflow-x-auto" ref={containerRef}>
            <table className="w-full border-collapse table-fixed">
              <colgroup>
                <col style={{ width: `${leftColPercent}%` }} />
                <col style={{ width: `${100 - leftColPercent}%` }} />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="relative p-0 border-r border-slate-200 align-middle">
                    <div className="px-2 py-2 font-bold text-sm text-slate-700 text-left h-full flex items-center">Aims & Milestones</div>
                    <div className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-50 flex items-center justify-center group" onMouseDown={startResizing} data-html2canvas-ignore="true">
                        <div className="h-4 w-0.5 bg-slate-300 group-hover:bg-white rounded-full"></div>
                    </div>
                  </th>
                  <th className="p-0 align-top h-full">
                    <div className="flex h-full min-h-[3rem]">
                      {Array.from({ length: durationYears }).map((_, idx) => {
                        const header = columnHeaders[idx] || { phase: '', year: '', bgColor: 'bg-slate-50' };
                        // Slight opacity on the bg class to match the lighter SVG look
                        const bgClass = header.bgColor.replace('bg-', 'bg-opacity-30 bg-'); 

                        return (
                          <div key={idx} className={`flex-1 text-center py-1 text-xs font-semibold border-r border-slate-200 last:border-r-0 flex flex-col justify-center relative group ${header.bgColor} bg-opacity-30`}>
                             {/* Color Palette Trigger */}
                             <button 
                                onClick={() => cycleHeaderColor(idx)}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 bg-white rounded-full shadow-sm hover:scale-110"
                                title="Cycle Color"
                             >
                                <Palette className="w-3 h-3 text-slate-400" />
                             </button>
                             
                             {/* Input for Phase */}
                             <input 
                               className="w-full text-center bg-transparent border-none p-0 text-[10px] uppercase tracking-wider text-slate-500 leading-none mb-0.5 focus:ring-0"
                               value={header.phase}
                               onChange={(e) => handleHeaderChange(idx, 'phase', e.target.value)}
                             />
                             {/* Input for Year */}
                             <input 
                               className="w-full text-center bg-transparent border-none p-0 text-xs font-bold text-slate-700 focus:ring-0"
                               value={header.year}
                               onChange={(e) => handleHeaderChange(idx, 'year', e.target.value)}
                             />
                          </div>
                        );
                      })}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => {
                  const isSection = item.type === 'section';
                  const isEditing = editingId === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <tr className={`group ${isSection ? 'bg-slate-50/30' : 'hover:bg-slate-50'}`} draggable={!isEditing} 
                          onDragStart={(e) => { if (!isEditing) { dragItem.current = index; e.dataTransfer.effectAllowed = "move"; } }} 
                          onDragEnter={() => { if (!isEditing) dragOverItem.current = index; }} 
                          onDragEnd={handleSort} 
                          onDragOver={(e) => { e.preventDefault(); if (!isEditing) dragOverItem.current = index; }}>
                        
                        <td className="border-r border-slate-200 p-0 align-top">
                           <div className="flex items-start px-2 py-1 min-h-[32px]">
                             <div className="mr-2 flex-shrink-0 mt-1" data-html2canvas-ignore="true">
                               <div className="cursor-move text-slate-300 hover:text-slate-500">
                                 <GripVertical className="w-3 h-3" />
                               </div>
                             </div>
                             <div className="flex-grow min-w-0">
                                {isEditing ? (
                                    <input autoFocus type="text" className="w-full text-xs border-slate-300 rounded px-1 py-0 my-0.5" value={item.label} onChange={(e) => handleUpdateItem(item.id, 'label', e.target.value)} onMouseDown={(e) => e.stopPropagation()} />
                                ) : (
                                    <div className="flex items-start justify-between w-full pt-0.5">
                                        <span className={`text-[10pt] leading-tight pr-1 whitespace-normal break-words ${isSection ? 'text-slate-800 font-bold' : 'text-slate-600'}`}>{item.label}</span>
                                        <button onClick={() => setEditingId(isEditing ? null : item.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-blue-600 transition-opacity flex-shrink-0 mt-0.5" data-html2canvas-ignore="true"><Settings className="w-3 h-3" /></button>
                                    </div>
                                )}
                             </div>
                           </div>
                        </td>
                        
                        <td className="p-0 align-middle h-px">
                           <div className="relative w-full h-full min-h-[32px] flex items-center">
                               <div className="absolute inset-0 w-full h-full flex pointer-events-none">
                                    {[...Array(durationYears)].map((_, i) => <div key={i} className="flex-1 border-r border-slate-100 border-dashed h-full"></div>)}
                               </div>
                               <div className="relative w-full h-6">
                                   {isSection ? (
                                       <div className={`absolute top-1 bottom-1 rounded border border-slate-300/50 ${item.color} opacity-40`} style={{ left: `${(item.start / totalMonths) * 100}%`, width: `${(item.duration / totalMonths) * 100}%` }}></div>
                                   ) : item.usePhases ? (
                                       Object.entries(item.phases || {}).map(([key, phase]) => {
                                            if (!phase || !phase.duration) return null;
                                            const config = EXP_PHASE_CONFIG[key];
                                            const phaseColor = phase.color || config.defaultColor;
                                            return (
                                              <div key={key} className="absolute top-0 bottom-0" style={{ left: `${(phase.start / totalMonths) * 100}%`, width: `${(phase.duration / totalMonths) * 100}%` }}>
                                                <div className={`absolute left-0 right-0 h-[2px] -mt-[1px] ${phaseColor} shadow-sm ${config.offset}`}></div>
                                                <div className={`absolute left-0 h-1.5 w-[2px] -mt-[3px] ${phaseColor} ${config.offset}`}></div>
                                                <div className={`absolute right-0 h-1.5 w-[2px] -mt-[3px] ${phaseColor} ${config.offset}`}></div>
                                                <div className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 ${config.offset} z-10 flex items-center justify-center`}>
                                                    <div className="bg-white/95 rounded-full px-0.5 py-[1px] shadow-sm border border-slate-100 hover:scale-125 transition-transform cursor-help" title={`${config.label}: ${phase.duration}mo`}>
                                                       <span className="text-[10px] leading-none block filter drop-shadow-sm">{config.emoji}</span>
                                                    </div>
                                                </div>
                                              </div>
                                            );
                                       })
                                   ) : (
                                       <div className="absolute top-0 bottom-0" style={{ left: `${(item.start / totalMonths) * 100}%`, width: `${(item.duration / totalMonths) * 100}%` }}>
                                            <div className={`absolute top-1/2 left-0 right-0 h-[2px] -mt-[1px] ${item.color} shadow-sm`}></div>
                                            <div className={`absolute top-1/2 left-0 h-2 w-[2px] -mt-[4px] ${item.color}`}></div>
                                            <div className={`absolute top-1/2 right-0 h-2 w-[2px] -mt-[4px] ${item.color}`}></div>
                                            {item.duration >= 2 && <div className="relative z-10 w-full h-full flex items-center justify-center"><span className="px-1 text-[9px] font-semibold text-slate-600 bg-white/90 rounded border border-slate-100 shadow-sm leading-none py-[1px] whitespace-nowrap">{Math.floor(item.duration)} mo</span></div>}
                                       </div>
                                   )}
                               </div>
                           </div>
                        </td>
                      </tr>
                      {isEditing && (
                        <tr><td colSpan={2} className="p-0 border-b border-slate-200 bg-slate-50">
                            <div className="p-3 shadow-inner flex flex-col gap-4 animate-in slide-in-from-top-2 relative cursor-default" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                {!isSection && <div className="flex items-center gap-2 border-b border-slate-200 pb-2"><button onClick={() => togglePhases(item)} className={`flex items-center text-xs font-semibold px-2 py-1 rounded transition-colors ${item.usePhases ? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-600 border border-slate-300'}`}><Layers className="w-3 h-3 mr-2" />{item.usePhases ? 'Detailed Phases Enabled' : 'Enable Detailed Phases (Bench/Ext/Analysis)'}</button></div>}
                                {item.usePhases && item.phases && !isSection ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {['bench', 'external', 'analysis'].map(pKey => (
                                            <div key={pKey} className="space-y-2 p-2 bg-white rounded border border-slate-200 shadow-sm">
                                                <div className="text-[10px] font-bold text-slate-700 uppercase flex justify-between items-center"><span>{EXP_PHASE_CONFIG[pKey].emoji} {EXP_PHASE_CONFIG[pKey].label}</span><span className={`w-3 h-3 rounded-full ${item.phases[pKey]?.color || EXP_PHASE_CONFIG[pKey].defaultColor}`}></span></div>
                                                <div className="flex items-center gap-2"><span className="text-[10px] w-8 font-medium">Start</span><input type="range" min="0" max={totalMonths-1} value={item.phases[pKey]?.start || 0} onChange={(e) => handleUpdatePhase(item.id, pKey, 'start', parseInt(e.target.value))} className="flex-grow h-1 accent-slate-500" /><input type="number" min="0" max={totalMonths-1} value={item.phases[pKey]?.start || 0} onChange={(e) => handleUpdatePhase(item.id, pKey, 'start', parseInt(e.target.value) || 0)} className="w-10 text-[10px] border border-slate-300 rounded px-1 py-0.5 text-right" onMouseDown={(e) => e.stopPropagation()} /></div>
                                                <div className="flex items-center gap-2"><span className="text-[10px] w-8 font-medium">Dur</span><input type="range" min="0" max={totalMonths} value={item.phases[pKey]?.duration || 0} onChange={(e) => handleUpdatePhase(item.id, pKey, 'duration', parseInt(e.target.value))} className="flex-grow h-1 accent-slate-500" /><input type="number" min="0" max={totalMonths} value={item.phases[pKey]?.duration || 0} onChange={(e) => handleUpdatePhase(item.id, pKey, 'duration', parseInt(e.target.value) || 0)} className="w-10 text-[10px] border border-slate-300 rounded px-1 py-0.5 text-right" onMouseDown={(e) => e.stopPropagation()} /></div>
                                                <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100 mt-2">{EXP_AVAILABLE_COLORS.map(c => (<button key={c} onClick={() => handleUpdatePhase(item.id, pKey, 'color', c)} className={`w-3 h-3 rounded-full ${c} ${(item.phases[pKey]?.color || EXP_PHASE_CONFIG[pKey].defaultColor) === c ? 'ring-1 ring-offset-1 ring-slate-500 scale-125' : 'hover:scale-110'}`} />))}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-6 items-end bg-white p-3 rounded border border-slate-200">
                                        <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Start</label><div className="flex items-center gap-2"><input type="range" min="0" max={totalMonths-1} value={item.start} onChange={(e) => handleUpdateItem(item.id, 'start', parseInt(e.target.value))} className="w-32 h-1 accent-blue-600" /><input type="number" min="0" max={totalMonths-1} value={item.start} onChange={(e) => handleUpdateItem(item.id, 'start', parseInt(e.target.value) || 0)} className="w-12 text-xs border border-slate-300 rounded px-1 py-0.5 text-right" onMouseDown={(e) => e.stopPropagation()} /></div></div>
                                        <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Duration</label><div className="flex items-center gap-2"><input type="range" min="1" max={totalMonths} value={item.duration} onChange={(e) => handleUpdateItem(item.id, 'duration', parseInt(e.target.value))} className="w-32 h-1 accent-blue-600" /><input type="number" min="1" max={totalMonths} value={item.duration} onChange={(e) => handleUpdateItem(item.id, 'duration', parseInt(e.target.value) || 0)} className="w-12 text-xs border border-slate-300 rounded px-1 py-0.5 text-right" onMouseDown={(e) => e.stopPropagation()} /></div></div>
                                        <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Color</label><div className="flex gap-1">{EXP_AVAILABLE_COLORS.map(c => (<button key={c} onClick={() => handleUpdateItem(item.id, 'color', c)} className={`w-4 h-4 rounded-full ${c} ${item.color === c ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : 'hover:scale-110'}`} />))}</div></div>
                                    </div>
                                )}
                                <div className="flex justify-end gap-2 pt-2"><Button size="sm" variant="danger" onClick={() => handleDeleteItem(item.id)}><Trash2 className="w-3 h-3 mr-1" /> Delete</Button><Button size="sm" variant="primary" onClick={() => setEditingId(null)}>Done</Button></div>
                            </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="text-slate-400 text-[10pt] p-2 bg-slate-50 rounded border border-slate-100 flex justify-between items-center print:hidden"><span>Standard K99/R00 duration is 5 years total (max 2 years K99, 3 years R00).</span><span>Click <Settings className="w-3 h-3 inline" /> to adjust.</span></div>
      </div>
    </div>
  );
}

// ==========================================
// TRAINING TIMELINE LOGIC
// ==========================================

function TrainingTimeline() {
  const [data, setData] = useState({});
  const [merges, setMerges] = useState({});
  const [committee, setCommittee] = useState(INITIAL_COMMITTEE);
  const [rows, setRows] = useState(ROW_DEFINITIONS_DEFAULT);
  const [specialRows, setSpecialRows] = useState({
    objectives: OBJECTIVES_ROW_DEFAULT,
    topic1: TOPIC_ROW_1_DEFAULT,
    topic2: TOPIC_ROW_2_DEFAULT
  });
  
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isNaMode, setIsNaMode] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null); 
  const [inactiveCells, setInactiveCells] = useState({}); // { cellKey: true }
  
  // App Config State
  const [trainingTitle, setTrainingTitle] = useState("K99/R00 Training Committee Timeline");
  const [trainingSubtitle, setTrainingSubtitle] = useState("Mentorship, Advisory Meetings, and Career Milestones");

  const fileInputRef = useRef(null);

  // Initialize Inactive Cells (Once)
  useEffect(() => {
     const initialInactive = {};
     YEARS.forEach(year => {
        ROW_DEFINITIONS_DEFAULT.forEach(row => {
            INITIAL_COMMITTEE.forEach(member => {
                if (row.initialActive && !row.initialActive.includes(member.id)) {
                    initialInactive[getCellKey(year.id, row.id, member.id)] = true;
                }
            });
        });
     });
     setInactiveCells(initialInactive);
  }, []);

  const updateCell = (yearId, rowId, memberId, newValue) => {
    const key = getCellKey(yearId, rowId, memberId);
    setData(prev => {
      const newData = { ...prev };
      if (newValue === null) {
        delete newData[key];
      } else {
        newData[key] = newValue;
      }
      return newData;
    });
  };

  const getMergeKey = (yearId, rowId, memberIdx) => `${yearId}-${rowId}-${memberIdx}`;

  const isCellHidden = (yearId, rowId, memberIdx) => {
    for (let i = 0; i < memberIdx; i++) {
        const key = getMergeKey(yearId, rowId, i);
        if (merges[key]) {
            const span = merges[key];
            if (i + span > memberIdx) return true; 
        }
    }
    return false;
  };

  const getCellMergeSpan = (yearId, rowId, memberIdx) => {
      return merges[getMergeKey(yearId, rowId, memberIdx)] || 1;
  };

  const handleCellClick = (yearId, rowId, memberIdx, rowType) => {
    const memberId = committee[memberIdx].id;
    const key = getCellKey(yearId, rowId, memberId);
    const mergeSpan = getCellMergeSpan(yearId, rowId, memberIdx);

    if (isNaMode) {
        setInactiveCells(prev => ({ ...prev, [key]: !prev[key] }));
        return;
    }

    if (isSelectionMode) {
        if (!selectedRange || selectedRange.yearId !== yearId || selectedRange.rowId !== rowId) {
            setSelectedRange({ yearId, rowId, startIdx: memberIdx, endIdx: memberIdx + mergeSpan - 1 });
        } else {
            const currentStart = selectedRange.startIdx;
            const clickedStart = memberIdx;
            const clickedEnd = memberIdx + mergeSpan - 1;
            const newStart = Math.min(currentStart, clickedStart);
            const newEnd = Math.max(selectedRange.endIdx, clickedEnd);
            setSelectedRange({ ...selectedRange, startIdx: newStart, endIdx: newEnd });
        }
        return;
    }

    if (isCellHidden(yearId, rowId, memberIdx)) return;

    const current = data[key];

    if (mergeSpan > 1 || rowType === 'text_only') {
        if (!current) {
            updateCell(yearId, rowId, memberId, { type: 'text', value: '' });
        }
        return;
    }

    // Cycle logic
    if (rowType === 'poll') {
      if (!current) updateCell(yearId, rowId, memberId, { type: 'text', value: '' });
      else if (current.type === 'text') updateCell(yearId, rowId, memberId, { type: 'check', value: true });
      else updateCell(yearId, rowId, memberId, null);
    } else {
      if (!current) {
        if (rowType === 'recurring') updateCell(yearId, rowId, memberId, { type: 'check', value: true });
        else updateCell(yearId, rowId, memberId, { type: 'text', value: '' });
      } else if (current.type === 'text') {
        updateCell(yearId, rowId, memberId, { type: 'check', value: true });
      } else if (current.type === 'check') {
        updateCell(yearId, rowId, memberId, null);
      }
    }
  };

  const handleMergeSelection = () => {
      if (!selectedRange || selectedRange.startIdx === selectedRange.endIdx) return;
      
      const { yearId, rowId, startIdx, endIdx } = selectedRange;
      const span = endIdx - startIdx + 1;
      
      let preservedText = '';
      for (let i = startIdx; i <= endIdx; i++) {
          const mId = committee[i].id;
          const k = getCellKey(yearId, rowId, mId);
          if (data[k] && data[k].type === 'text' && data[k].value) {
              preservedText = data[k].value;
              break; 
          }
      }

      const newMerges = { ...merges };
      const mergeKey = getMergeKey(yearId, rowId, startIdx);
      newMerges[mergeKey] = span;

      for (let i = startIdx + 1; i <= endIdx; i++) {
          const subKey = getMergeKey(yearId, rowId, i);
          if (newMerges[subKey]) delete newMerges[subKey];
      }

      setMerges(newMerges);
      setSelectedRange(null);
      
      const startMemberId = committee[startIdx].id;
      updateCell(yearId, rowId, startMemberId, { type: 'text', value: preservedText });
  };

  const handleUnmerge = () => {
      if (!selectedRange) return;
      const { yearId, rowId, startIdx } = selectedRange;
      const key = getMergeKey(yearId, rowId, startIdx);
      if (merges[key]) {
          const newMerges = { ...merges };
          delete newMerges[key];
          setMerges(newMerges);
          setSelectedRange(null);
      }
  };

  const handleTextChange = (e, yearId, rowId, memberId) => {
    e.stopPropagation();
    updateCell(yearId, rowId, memberId, { type: 'text', value: e.target.value });
  };

  const handleHeaderUpdate = (memberId, field, newValue) => {
    setCommittee(prev => prev.map(m => 
      m.id === memberId ? { ...m, [field]: newValue } : m
    ));
  };

  const handleAddMember = () => {
      const newId = `member_${Date.now()}`;
      setCommittee(prev => [...prev, {
          id: newId,
          name: 'New Member',
          role: 'Role',
          color: 'bg-slate-100 text-slate-800 border-slate-200',
          svgHeaderFill: '#f1f5f9',
          svgHeaderStroke: '#cbd5e1'
      }]);
  };

  const handleRemoveMember = (memberId) => {
      if (committee.length <= 1) return;
      setCommittee(prev => prev.filter(m => m.id !== memberId));
  };

  // --- Row Management ---
  const handleAddRow = () => {
    const newId = `custom_row_${Date.now()}`;
    setRows(prev => [...prev, { id: newId, label: 'New Activity', type: 'recurring', initialActive: [] }]);
  };

  const handleDeleteRow = (rowId) => {
    setRows(prev => prev.filter(r => r.id !== rowId));
  };

  const handleRowLabelChange = (rowId, newLabel) => {
      setRows(prev => prev.map(r => r.id === rowId ? { ...r, label: newLabel } : r));
  };
  
  const handleSpecialRowLabelChange = (key, newLabel) => {
      setSpecialRows(prev => ({ ...prev, [key]: { ...prev[key], label: newLabel } }));
  };

  const handleMoveRow = (index, direction) => {
      if ((direction === -1 && index === 0) || (direction === 1 && index === rows.length - 1)) return;
      const newRows = [...rows];
      const temp = newRows[index];
      newRows[index] = newRows[index + direction];
      newRows[index + direction] = temp;
      setRows(newRows);
  };

  const handleSaveSVG = () => {
    const minColWidth = 100; 
    const labelColWidth = 250;
    const charWidth = 5.5; 
    const cellPadding = 12; 

    const colWidths = committee.map(m => {
        const nameWidth = (m.name.length * 6) + cellPadding; 
        return Math.max(minColWidth, nameWidth);
    });

    Object.keys(data).forEach(key => {
        const parts = key.split('-');
        if (parts.length < 3) return;
        const mId = parts[2]; 
        const memberIdx = committee.findIndex(m => m.id === mId);
        if (memberIdx === -1) return;
        const rowId = parts[1];
        const yearId = parts[0];
        if (isCellHidden(yearId, rowId, memberIdx)) return;
        const cellData = data[key];
        if (cellData && cellData.type === 'text' && cellData.value) {
            const mergeKey = getMergeKey(yearId, rowId, memberIdx);
            if (!merges[mergeKey]) {
                const requiredWidth = (cellData.value.length * charWidth) + cellPadding;
                if (requiredWidth > colWidths[memberIdx]) {
                    colWidths[memberIdx] = requiredWidth;
                }
            }
        }
    });

    const totalColsWidth = colWidths.reduce((a, b) => a + b, 0);
    const svgWidth = labelColWidth + totalColsWidth + 40; 
    const headerHeight = 70;
    const rowHeight = 22; 
    const yearHeaderHeight = 20; 
    const padding = 20;
    
    // Calculate Rows
    const rowsPerYear = rows.length + 2; 
    const totalYearContentHeight = (rowsPerYear * rowHeight * YEARS.length) + (YEARS.length * yearHeaderHeight);
    const totalHeight = headerHeight + rowHeight + totalYearContentHeight + (padding * 2);

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${totalHeight}" viewBox="0 0 ${svgWidth} ${totalHeight}" style="font-family: Arial, sans-serif;">`;
    svg += `<rect width="100%" height="100%" fill="white" />`;

    svg += `<defs>
        <pattern id="diagonalHatch" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="#e2e8f0" stroke-width="1"/>
        </pattern>
        <marker id="arrow-start" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto">
            <path d="M6,0 L0,3 L6,6" fill="none" stroke="#64748b" stroke-width="1" />
        </marker>
        <marker id="arrow-end" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6" fill="none" stroke="#64748b" stroke-width="1" />
        </marker>
    </defs>`;

    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    svg += `<text x="${padding}" y="${padding + 15}" font-size="18" font-weight="bold" fill="#1e293b">${esc(trainingTitle)}</text>`;
    svg += `<text x="${padding}" y="${padding + 34}" font-size="12" fill="#64748b">${esc(trainingSubtitle)}</text>`;

    const startY = padding + 40;
    const startX = padding + labelColWidth;

    svg += `<rect x="${padding}" y="${startY}" width="${labelColWidth + totalColsWidth}" height="${headerHeight - 20}" fill="#f8fafc" stroke="#cbd5e1" />`;
    svg += `<text x="${padding + 10}" y="${startY + 30}" font-size="11" font-weight="bold" fill="#64748b">Activity / Milestone</text>`;

    let currentX = startX;
    committee.forEach((member, i) => {
        const w = colWidths[i];
        const cx = currentX + (w / 2);
        svg += `<rect x="${currentX}" y="${startY}" width="${w}" height="${headerHeight - 20}" fill="${member.svgHeaderFill}" stroke="#cbd5e1" />`;
        svg += `<text x="${cx}" y="${startY + 18}" text-anchor="middle" font-size="11" font-weight="bold" fill="#334155">${esc(member.name)}</text>`;
        svg += `<text x="${cx}" y="${startY + 34}" text-anchor="middle" font-size="9" fill="#64748b">${esc(member.role)}</text>`;
        currentX += w;
    });

    let currentY = startY + headerHeight - 20;

    const drawRow = (yearId, row, bgOverride = null) => {
        const isPoll = row.type === 'poll';
        const isTopic = row.type === 'text_only';
        
        let rowBg = '#ffffff';
        if (bgOverride) rowBg = bgOverride;
        else if (isPoll) rowBg = '#fdf4ff';
        else if (isTopic) rowBg = '#fff7ed';
        
        svg += `<rect x="${padding}" y="${currentY}" width="${labelColWidth + totalColsWidth}" height="${rowHeight}" fill="${rowBg}" />`;
        // Darkened grid line
        svg += `<line x1="${padding}" y1="${currentY + rowHeight}" x2="${padding + labelColWidth + totalColsWidth}" y2="${currentY + rowHeight}" stroke="#cbd5e1" />`;

        let labelStyle = 'normal';
        let labelWeight = 'normal';

        if (isPoll) { labelStyle = 'italic'; } 
        else if (isTopic) { labelWeight = 'bold'; }

        svg += `<text x="${padding + 10}" y="${currentY + 15}" font-size="10" font-weight="${labelWeight}" font-style="${labelStyle}" fill="#000000">${esc(row.label)}</text>`;

        let rowX = startX;
        for (let mIdx = 0; mIdx < committee.length; mIdx++) {
            const member = committee[mIdx];
            const w = colWidths[mIdx];
            
            const cellKey = getCellKey(yearId, row.id, member.id);
            const isInactive = inactiveCells[cellKey];
            const mergeKey = getMergeKey(yearId, row.id, mIdx);
            const mergeSpan = merges[mergeKey];

            if (isCellHidden(yearId, row.id, mIdx)) {
                rowX += w;
                continue;
            }

            if (isInactive && !mergeSpan) {
                svg += `<rect x="${rowX}" y="${currentY}" width="${w}" height="${rowHeight}" fill="url(#diagonalHatch)" />`;
                svg += `<line x1="${rowX + w}" y1="${currentY}" x2="${rowX + w}" y2="${currentY + rowHeight}" stroke="#cbd5e1" stroke-width="1" />`;
            } else {
                let cellWidth = w;
                if (mergeSpan > 1) {
                    cellWidth = 0;
                    for (let s = 0; s < mergeSpan; s++) {
                        cellWidth += colWidths[mIdx + s];
                    }
                }

                const key = getCellKey(yearId, row.id, member.id);
                const cellData = data[key];
                const cx = rowX + (cellWidth / 2);
                const cy = currentY + (rowHeight / 2);

                if (mergeSpan > 1) {
                    svg += `<rect x="${rowX}" y="${currentY}" width="${cellWidth}" height="${rowHeight}" fill="${rowBg}" stroke="none" />`;
                }
                
                if (!mergeSpan || mergeSpan === 1) {
                     svg += `<line x1="${rowX + w}" y1="${currentY}" x2="${rowX + w}" y2="${currentY + rowHeight}" stroke="#cbd5e1" stroke-width="1" />`;
                } else {
                     svg += `<line x1="${rowX + cellWidth}" y1="${currentY}" x2="${rowX + cellWidth}" y2="${currentY + rowHeight}" stroke="#cbd5e1" stroke-width="1" />`;
                }

                if (cellData) {
                    if (cellData.type === 'check') {
                        svg += `<path d="M${cx-4} ${cy} L${cx-1} ${cy+3} L${cx+4} ${cy-3}" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`;
                    } else if (cellData.type === 'text') {
                        const textVal = cellData.value || (isTopic ? '' : 'M');
                        const fontSize = isTopic ? '9' : '10'; 
                        
                        svg += `<text x="${cx}" y="${cy + 3}" text-anchor="middle" font-size="${fontSize}" fill="#0f172a">${esc(textVal)}</text>`;

                        if (mergeSpan > 1 && textVal.length > 0) {
                            const textApproxWidth = textVal.length * (fontSize === '9' ? 5 : 6); 
                            const arrowPad = 10;
                            const leftArrowEnd = cx - (textApproxWidth/2) - arrowPad;
                            const rightArrowStart = cx + (textApproxWidth/2) + arrowPad;
                            const boxLeft = rowX + arrowPad;
                            const boxRight = rowX + cellWidth - arrowPad;

                            if (leftArrowEnd > boxLeft) {
                                svg += `<line x1="${leftArrowEnd}" y1="${cy}" x2="${boxLeft}" y2="${cy}" stroke="#64748b" stroke-width="1" />`;
                                svg += `<polygon points="${boxLeft},${cy} ${boxLeft+4},${cy-2} ${boxLeft+4},${cy+2}" fill="#64748b" />`;
                            }
                            if (rightArrowStart < boxRight) {
                                svg += `<line x1="${rightArrowStart}" y1="${cy}" x2="${boxRight}" y2="${cy}" stroke="#64748b" stroke-width="1" />`;
                                svg += `<polygon points="${boxRight},${cy} ${boxRight-4},${cy-2} ${boxRight-4},${cy+2}" fill="#64748b" />`;
                            }
                        }
                    }
                }
            }
            rowX += w;
        }
        currentY += rowHeight;
    };

    // 1. Objectives
    drawRow('y1', specialRows.objectives, '#fff7ed');

    YEARS.forEach(year => {
        svg += `<rect x="${padding}" y="${currentY}" width="${labelColWidth + totalColsWidth}" height="${yearHeaderHeight}" fill="#e2e8f0" />`;
        svg += `<text x="${padding + 10}" y="${currentY + 14}" font-size="10" font-weight="bold" fill="#475569" text-transform="uppercase" letter-spacing="1">${year.label}</text>`;
        currentY += yearHeaderHeight;

        rows.forEach((row, idx) => {
            const bg = idx % 2 !== 0 ? '#fcfcfc' : '#ffffff';
            drawRow(year.id, row, row.type === 'poll' ? '#fdf4ff' : bg);
        });
        
        drawRow(year.id, specialRows.topic1);
        drawRow(year.id, specialRows.topic2);
    });

    svg += `<rect x="${padding}" y="${startY}" width="${labelColWidth + totalColsWidth}" height="${currentY - startY}" fill="none" stroke="#cbd5e1" stroke-width="1" />`;
    svg += '</svg>';

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'training_timeline.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveJson = () => {
    const payload = { 
        data, merges, committee, inactiveCells, trainingTitle, trainingSubtitle, rows, specialRows
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "training_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleLoadJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target.result);
            if (json.data) {
                setData(json.data);
                setMerges(json.merges || {});
                if (json.committee) setCommittee(json.committee);
                if (json.inactiveCells) setInactiveCells(json.inactiveCells);
                if (json.trainingTitle) setTrainingTitle(json.trainingTitle);
                if (json.trainingSubtitle) setTrainingSubtitle(json.trainingSubtitle);
                if (json.rows) setRows(json.rows);
                if (json.specialRows) setSpecialRows(json.specialRows);
            } else {
                setData(json); 
            }
        } catch (error) {
            alert('Error parsing JSON');
        }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const renderRow = (year, row) => {
    const isPoll = row.type === 'poll';
    const isTopic = row.type === 'text_only';
    
    return (
      <tr key={`${year.id}-${row.id}`} className={`border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors ${isPoll ? 'bg-fuchsia-50/50' : isTopic ? 'bg-orange-50/50' : ''}`}>
        <td className={`px-2 py-0.5 text-slate-700 font-medium border-r border-slate-200 sticky left-0 text-[10px] ${isPoll ? 'bg-fuchsia-50/90 text-fuchsia-800' : isTopic ? 'bg-orange-50/90 text-orange-800' : 'bg-white'} group/label`}>
          <div className="flex items-center gap-1.5 h-full relative">
              {/* Row Management (Standard Rows Only) */}
              {!isTopic && row.id !== OBJECTIVES_ROW_DEFAULT.id && (
                  <div className="absolute -left-2 top-0 bottom-0 flex items-center gap-0.5 opacity-0 group-hover/label:opacity-100 bg-white shadow-sm border border-slate-200 px-0.5 z-20">
                      <button onClick={() => { 
                          const idx = rows.findIndex(r => r.id === row.id);
                          handleMoveRow(idx, -1);
                      }} className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"><ChevronUp className="w-2.5 h-2.5" /></button>
                      <button onClick={() => {
                          const idx = rows.findIndex(r => r.id === row.id);
                          handleMoveRow(idx, 1);
                      }} className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"><ChevronDown className="w-2.5 h-2.5" /></button>
                      <button onClick={() => handleDeleteRow(row.id)} className="p-0.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600"><Trash2 className="w-2.5 h-2.5" /></button>
                  </div>
              )}

              {isPoll && <span className="text-[9px] bg-fuchsia-100 text-fuchsia-700 px-1 rounded border border-fuchsia-200 leading-none">Poll</span>}
              <input 
                  className="bg-transparent border-none p-0 w-full text-[10px] font-medium text-slate-700 focus:ring-0"
                  value={row.label}
                  onChange={(e) => {
                      if (isTopic) {
                          // Find which topic this is
                          if (row.id === 'training_objectives') handleSpecialRowLabelChange('objectives', e.target.value);
                          else if (row.id === 'topics_mtg1') handleSpecialRowLabelChange('topic1', e.target.value);
                          else if (row.id === 'topics_mtg2') handleSpecialRowLabelChange('topic2', e.target.value);
                      } else {
                          handleRowLabelChange(row.id, e.target.value);
                      }
                  }}
              />
          </div>
        </td>
        {committee.map((member, mIdx) => {
          const key = getCellKey(year.id, row.id, member.id);
          const cellData = data[key];
          const isInactive = inactiveCells[key]; // Dynamic inactive state
          
          if (isCellHidden(year.id, row.id, mIdx)) return null; 
          const span = getCellMergeSpan(year.id, row.id, mIdx);

          let isSelected = false;
          if (selectedRange && selectedRange.yearId === year.id && selectedRange.rowId === row.id) {
              const cellStart = mIdx;
              const cellEnd = mIdx + span - 1;
              if (selectedRange.startIdx <= cellEnd && selectedRange.endIdx >= cellStart) {
                  isSelected = true;
              }
          }

          const bgClass = isInactive && span === 1 
            ? "bg-slate-50 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:6px_6px]" 
            : "";

          return (
            <td 
              key={member.id} 
              colSpan={span}
              className={`border-r border-slate-100 text-center cursor-pointer relative group p-0 align-middle h-px ${bgClass} ${isSelected ? 'bg-blue-100 ring-2 ring-inset ring-blue-400' : ''}`}
              onClick={() => handleCellClick(year.id, row.id, mIdx, row.type)}
            >
              <div className="min-h-[22px] h-full flex items-center justify-center relative">
                  {cellData?.type === 'check' && (
                      <div className="animate-in zoom-in duration-200">
                          <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200">
                              <Check className="w-2.5 h-2.5" strokeWidth={3} />
                          </div>
                      </div>
                  )}
                  {cellData?.type === 'text' && (
                      <input 
                          type="text" 
                          autoFocus={!isSelectionMode && !isNaMode}
                          className={`border-0 bg-transparent text-center font-medium text-slate-700 cursor-text focus:ring-0 w-full p-0 h-full leading-none ${isTopic ? 'text-[9px]' : 'text-[10px]'} ${(isSelectionMode || isNaMode) ? 'pointer-events-none' : ''}`}
                          placeholder={isTopic ? "Topic..." : "Mo"}
                          value={cellData.value || ''} 
                          onChange={(e) => handleTextChange(e, year.id, row.id, member.id)}
                          onClick={(e) => !isSelectionMode && !isNaMode && e.stopPropagation()} 
                      />
                  )}
                  {!cellData && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {isTopic ? (
                              <span className="text-[9px] text-slate-300 italic">Type</span>
                          ) : row.type === 'poll' ? (
                              <Calendar className="w-2.5 h-2.5 text-slate-300" />
                          ) : (
                              <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                          )}
                      </div>
                  )}
                  
                  {span > 1 && (
                      <div className="absolute inset-x-1 bottom-0.5 h-0.5 bg-slate-300 rounded-full opacity-50"></div>
                  )}
              </div>
            </td>
          );
        })}
      </tr>
    );
  };

  const hasMergeSelection = selectedRange && (selectedRange.endIdx > selectedRange.startIdx);
  const hasUnmergeSelection = selectedRange && getCellMergeSpan(selectedRange.yearId, selectedRange.rowId, selectedRange.startIdx) > 1;

  return (
    <div className="flex flex-col items-center select-none w-full">
      <input type="file" ref={fileInputRef} onChange={handleLoadJson} style={{display: 'none'}} accept=".json" />
      
      <div className="max-w-7xl mx-auto space-y-6 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">K99/R00 Training Committee Timeline</h1>
            <p className="text-slate-500">Mentorship, Advisory Meetings, and Career Milestones</p>
          </div>
          <div className="flex gap-2 items-center">
            {/* Selection/Merge Tools */}
            <div className="flex items-center gap-1 bg-white p-1 rounded border border-slate-300 mr-4">
                <Button 
                    variant={isSelectionMode ? "active" : "ghost"} 
                    size="icon" 
                    title="Toggle Selection Mode" 
                    onClick={() => { setIsSelectionMode(!isSelectionMode); setIsNaMode(false); setSelectedRange(null); }}
                >
                    <MousePointer className="w-4 h-4" />
                </Button>
                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    title="Merge Selected Cells" 
                    disabled={!hasMergeSelection}
                    onClick={handleMergeSelection}
                    className={hasMergeSelection ? "text-blue-600" : "text-slate-300"}
                >
                    <Merge className="w-4 h-4" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    title="Unmerge Selected Cell" 
                    disabled={!hasUnmergeSelection}
                    onClick={handleUnmerge}
                    className={hasUnmergeSelection ? "text-red-600" : "text-slate-300"}
                >
                    <Split className="w-4 h-4" />
                </Button>
                 <div className="w-px h-4 bg-slate-200 mx-1"></div>
                 <Button 
                    variant={isNaMode ? "active" : "ghost"} 
                    size="icon" 
                    title="Toggle N/A Mode (Grey out cells)" 
                    onClick={() => { setIsNaMode(!isNaMode); setIsSelectionMode(false); setSelectedRange(null); }}
                    className={isNaMode ? "text-slate-800" : "text-slate-500"}
                >
                    <EyeOff className="w-4 h-4" />
                </Button>
            </div>

            <Button variant="secondary" onClick={() => fileInputRef.current.click()}><Upload className="w-3 h-3 mr-1"/> Load Data</Button>
            <Button variant="secondary" onClick={handleSaveJson}><Save className="w-3 h-3 mr-1"/> Save Data</Button>
            <Button onClick={handleSaveSVG}><Download className="w-3 h-3 mr-1"/> Export SVG</Button>
          </div>
        </div>

        <div className="flex gap-4 text-xs bg-white p-3 rounded border border-slate-200 shadow-sm text-slate-600 w-full">
            <div className="flex items-center"><div className="w-4 h-4 bg-white border border-slate-300 rounded mr-2"></div> Click to Type Month/Topic</div>
            <div className="flex items-center"><div className="w-4 h-4 bg-white border border-slate-300 rounded mr-2 flex items-center justify-center"><Check className="w-3 h-3 text-emerald-600"/></div> Click check to clear</div>
            <div className="flex items-center"><div className="w-4 h-4 bg-orange-50 border border-orange-200 rounded mr-2"></div> Topics (Text Only)</div>
            <div className="flex items-center ml-auto font-medium text-slate-500">
                {isSelectionMode ? "Selection Mode Active: Click Start then End cell" : isNaMode ? "N/A Mode Active: Click to toggle grey cells" : "Edit Mode Active (Hover row labels to reorder/delete)"}
            </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden select-none w-full">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-2 py-1 text-left font-bold text-slate-700 min-w-[200px] sticky left-0 bg-slate-50 z-10 border-r border-slate-200 text-xs">
                    Activity / Milestone
                  </th>
                  {committee.map((member, i) => (
                    <th key={member.id} className="px-1 py-1 min-w-[120px] border-r border-slate-100 last:border-r-0 relative group">
                      <button 
                        onClick={() => handleRemoveMember(member.id)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 bg-white rounded-full shadow hover:text-red-600 transition-opacity z-20"
                        title="Remove Member"
                      >
                         <X className="w-3 h-3" />
                      </button>
                      <div className={`flex flex-col items-center justify-center p-1 rounded ${member.color} bg-opacity-30`}>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => handleHeaderUpdate(member.id, 'name', e.target.value)}
                          className="font-bold text-center leading-none text-[11px] bg-transparent border-none focus:ring-0 w-full p-0"
                        />
                        <input
                          type="text"
                          value={member.role}
                          onChange={(e) => handleHeaderUpdate(member.id, 'role', e.target.value)}
                          className="text-[9px] uppercase tracking-wider opacity-75 bg-transparent border-none focus:ring-0 w-full p-0 text-center mt-0.5"
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {renderRow({id: 'y1'}, specialRows.objectives)}

                {YEARS.map(year => (
                  <React.Fragment key={year.id}>
                    <tr className="bg-slate-100 border-y border-slate-200">
                      <td colSpan={committee.length + 1} className="px-2 py-0.5 font-bold text-slate-600 uppercase tracking-widest text-[10px] sticky left-0">
                        {year.label}
                      </td>
                    </tr>
                    
                    {rows.map(row => renderRow(year, row))}
                    {renderRow(year, specialRows.topic1)}
                    {renderRow(year, specialRows.topic2)}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN APP SHELL
// ==========================================

export default function App() {
  const [activeTab, setActiveTab] = useState('training'); // 'training' or 'experimental'

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200 px-8 pt-4">
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('experimental')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'experimental' 
                ? 'border-slate-800 text-slate-800' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Research Timeline
          </button>
          <button 
            onClick={() => setActiveTab('training')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'training' 
                ? 'border-slate-800 text-slate-800' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Training Timeline
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {activeTab === 'experimental' ? <ExperimentalTimeline /> : <TrainingTimeline />}
      </div>
    </div>
  );
}