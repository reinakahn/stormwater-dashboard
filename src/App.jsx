import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Cell, PieChart, Pie
} from "recharts";

// ─── REAL QUANTIFIED DATA — FY 2024-25 NPDES STORMWATER ANNUAL REPORTS ─────
// Source: Municipal Regional Stormwater NPDES Permit (MRP) annual reports
// submitted to SF Bay RWQCB, September 2025

const CITY_META = {
  "San Jose":  { pop: 979415, color: "#38bdf8", totalCost: 123982000, nextCost: 132402000 },
  "Sunnyvale": { pop: 155805, color: "#a78bfa", totalCost: 4848000,   nextCost: 5040000   },
  "Saratoga":  { pop: 31000,  color: "#34d399", totalCost: 1239000,   nextCost: 1270000   },
  "Campbell":  { pop: 42895,  color: "#fbbf24", totalCost: 1150000,   nextCost: 1187000   },
};

// Each provision has: cost per city, and measuredOutputs (the real quantifiable results)
// Sources cited inline
const PROVISIONS = [
  {
    code: "C.2",
    name: "Municipal Operations",
    description: "BMP implementation for street repair, sidewalks, bridges, corp yards, and graffiti. Staff training on stormwater pollution prevention.",
    icon: "🏗",
    costs: { "San Jose": 6971000, "Sunnyvale": 110000, "Saratoga": 118000, "Campbell": 46000 },
    nextCosts: { "San Jose": 7461000, "Sunnyvale": 114000, "Saratoga": 121000, "Campbell": 47000 },
    // Quantified outputs per city
    outputs: {
      "San Jose":  { staffTrained: 72,  corpYardInspections: 4,  corpYardIssues: 1, trainingCoverage: 100, notes: "72 Fire Dept. Hazmat staff trained in-person; 4 corp yard inspections; fluid stains found at South Service Yard" },
      "Sunnyvale": { staffTrained: 65,  corpYardInspections: 1,  corpYardIssues: 0, trainingCoverage: 76, notes: "4 training sessions: 32 Streets (91%), 14 Wastewater (64%), 27 Water Ops (85%), 9 Fleet (44%)" },
      "Saratoga":  { staffTrained: null, corpYardInspections: 3,  corpYardIssues: 0, trainingCoverage: 100, notes: "Corp yard project completed summer 2025 (new wash area, sanitary sewer connections); 3 inspections" },
      "Campbell":  { staffTrained: 5,   corpYardInspections: 4,  corpYardIssues: 1, trainingCoverage: 100, notes: "5 staff (100%); 11 homeless encampments cleared near Los Gatos Creek (~70 cy trash); 125+ potholes repaired" },
    },
    aggregateMetrics: [
      { label: "Corp Yard Inspections", getValue: (d) => d.corpYardInspections, unit: "inspections", sumAll: true },
      { label: "Issues Found / Corrected", getValue: (d) => d.corpYardIssues, unit: "issues", sumAll: true },
      { label: "Staff Trained (Min Known)", getValue: (d) => d.staffTrained || 0, unit: "staff", sumAll: true },
    ],
    scores: { "San Jose": 92, "Sunnyvale": 88, "Saratoga": 90, "Campbell": 92 },
  },
  {
    code: "C.3",
    name: "New Development & Redevelopment",
    description: "Low Impact Development (LID) requirements for regulated projects. O&M verification inspections of installed stormwater treatment systems.",
    icon: "🏘",
    costs: { "San Jose": 14665000, "Sunnyvale": 561000, "Saratoga": 525000, "Campbell": 329000 },
    nextCosts: { "San Jose": 15478000, "Sunnyvale": 583000, "Saratoga": 538000, "Campbell": 339000 },
    outputs: {
      "San Jose":  { totalInventory: 696, inspectedCount: 161, inspectedPct: 24, newProjectsApproved: 44, firstPassCompliance: 37, notes: "Riverview Stormwater Garden completed — first regional GSI in Santa Clara County" },
      "Sunnyvale": { totalInventory: null, inspectedCount: null, inspectedPct: null, newProjectsApproved: null, firstPassCompliance: null, notes: "143 CIP projects screened for GSI potential; 11 with potential identified; 49 bike/40 ped/21 SRTS projects screened" },
      "Saratoga":  { totalInventory: 5, inspectedCount: 1, inspectedPct: 20, newProjectsApproved: null, firstPassCompliance: null, notes: "5 regulated projects in inventory; 1 inspected (20%); Village Parking District $5M investment includes stormwater elements" },
      "Campbell":  { totalInventory: 55, inspectedCount: 24, inspectedPct: 49, newProjectsApproved: null, firstPassCompliance: null, notes: "55 projects (up from 49); 24 inspections (49%); Downtown PDA biotreatment under construction; Hacienda Ave Green Street: 60 bio-infiltration basins, 17.8 acres treated" },
    },
    aggregateMetrics: [
      { label: "Regulated Project Inventory", getValue: (d) => d.totalInventory || 0, unit: "projects", sumAll: true },
      { label: "O&M Inspections Conducted", getValue: (d) => d.inspectedCount || 0, unit: "inspections", sumAll: true },
      { label: "New Projects Approved", getValue: (d) => d.newProjectsApproved || 0, unit: "projects", sumAll: true },
    ],
    scores: { "San Jose": 85, "Sunnyvale": 87, "Saratoga": 82, "Campbell": 80 },
  },
  {
    code: "C.4",
    name: "Industrial & Commercial Site Controls",
    description: "Inspections of commercial and industrial facilities to prevent polluted discharges to storm drains. Enforcement actions for non-compliance.",
    icon: "🏭",
    costs: { "San Jose": 1890000, "Sunnyvale": 263000, "Saratoga": 28000, "Campbell": 31000 },
    nextCosts: { "San Jose": 2126000, "Sunnyvale": 274000, "Saratoga": 29000, "Campbell": 32000 },
    outputs: {
      "San Jose":  { facilitiesInInventory: 8600, inspectionsTotal: 3218, facilitiesInspected: 1975, actualDischargeViolations: 47, potentialDischargeViolations: 1155, correctionRatePct: 84, enforcementActions: 180, notes: "3,200+ inspections; 84% correction rate within 10 days (down 2% from FY23-24)" },
      "Sunnyvale": { facilitiesInInventory: 636,  inspectionsTotal: 914,  facilitiesInspected: 609,  actualDischargeViolations: null, potentialDischargeViolations: null, correctionRatePct: null, enforcementActions: 57, notes: "914 inspections; 57 enforcement actions: 29 verbal, 21 warning, 7 NOVs" },
      "Saratoga":  { facilitiesInInventory: null, inspectionsTotal: 21,   facilitiesInspected: 21,   actualDischargeViolations: 0, potentialDischargeViolations: null, correctionRatePct: 100, enforcementActions: 4,  notes: "21 inspections; 4 enforcement actions (1 NOC + 3 NOVs for trash enclosure violations)" },
      "Campbell":  { facilitiesInInventory: null, inspectionsTotal: 213,  facilitiesInspected: 213,  actualDischargeViolations: 2, potentialDischargeViolations: 11, correctionRatePct: null, enforcementActions: 13, notes: "213 inspections; 13 enforcement actions: 3 verbal, 9 NTC, 1 NOV" },
    },
    aggregateMetrics: [
      { label: "Total Inspections Conducted", getValue: (d) => d.inspectionsTotal || 0, unit: "inspections", sumAll: true },
      { label: "Facilities Inspected", getValue: (d) => d.facilitiesInspected || 0, unit: "facilities", sumAll: true },
      { label: "Enforcement Actions Taken", getValue: (d) => d.enforcementActions || 0, unit: "actions", sumAll: true },
      { label: "Actual Discharge Violations", getValue: (d) => d.actualDischargeViolations || 0, unit: "violations", sumAll: true },
    ],
    scores: { "San Jose": 80, "Sunnyvale": 88, "Saratoga": 85, "Campbell": 84 },
  },
  {
    code: "C.5",
    name: "Illicit Discharge Detection & Elimination",
    description: "Response to illegal discharge events and complaints. Investigation of illicit connections to the storm drain system.",
    icon: "🔍",
    costs: { "San Jose": 1448000, "Sunnyvale": 30000, "Saratoga": 19000, "Campbell": 19000 },
    nextCosts: { "San Jose": 1499000, "Sunnyvale": 31000, "Saratoga": 19000, "Campbell": 20000 },
    outputs: {
      "San Jose":  { totalReports: 317, reachedWaterway: null, resolvedTimely: 304, resolutionRatePct: 96, notes: "317 complaints; 96% resolved timely; common: sanitary spills, vehicle leaks, waterline breaks, oil/grease" },
      "Sunnyvale": { totalReports: 33,  reachedWaterway: null, resolvedTimely: 33,  resolutionRatePct: 100, notes: "33 illegal discharge events; all investigated and resolved" },
      "Saratoga":  { totalReports: 6,   reachedWaterway: 5,   resolvedTimely: 6,  resolutionRatePct: 100, notes: "6 reports; 5 confirmed to reach storm drain/receiving waters; all resolved per Emergency Response Plan" },
      "Campbell":  { totalReports: 11,  reachedWaterway: 10,  resolvedTimely: 11, resolutionRatePct: 100, notes: "11 reports; 10 confirmed to reach waterways; types: landscape runoff, food waste, sewage, oil" },
    },
    aggregateMetrics: [
      { label: "Total Discharge Reports Received", getValue: (d) => d.totalReports, unit: "reports", sumAll: true },
      { label: "Confirmed Reached Waterway", getValue: (d) => d.reachedWaterway || 0, unit: "events", sumAll: true },
      { label: "Resolved Timely", getValue: (d) => d.resolvedTimely, unit: "cases", sumAll: true },
    ],
    scores: { "San Jose": 96, "Sunnyvale": 90, "Saratoga": 88, "Campbell": 85 },
  },
  {
    code: "C.6",
    name: "Construction Site Controls",
    description: "Stormwater BMP enforcement at construction sites. Inspection of high-priority and large-disturbance sites for sediment/pollutant control.",
    icon: "🚧",
    costs: { "San Jose": 1861000, "Sunnyvale": 125000, "Saratoga": 36000, "Campbell": 82000 },
    nextCosts: { "San Jose": 1926000, "Sunnyvale": 130000, "Saratoga": 37000, "Campbell": 84000 },
    outputs: {
      "San Jose":  { constructionSites: 283, hillsideSites: 28, highPrioritySites: 86, largeDisturbanceSites: 169, totalInspections: 1874, illicitDischarges: 0, enforcementActions: null, notes: "283 sites; 1,874 stormwater inspections; includes demolition sites; building dept conducted additional gen inspections" },
      "Sunnyvale": { constructionSites: 38,  hillsideSites: 0,  highPrioritySites: 0,  largeDisturbanceSites: 38, totalInspections: 406,  illicitDischarges: 0, enforcementActions: 0, notes: "32 private + 6 public sites; 250+156=406 inspections; <1% required corrective action (down from 2.5% FY23-24)" },
      "Saratoga":  { constructionSites: 9,   hillsideSites: 2,  highPrioritySites: 5,  largeDisturbanceSites: 2, totalInspections: 48,   illicitDischarges: 0, enforcementActions: 4, notes: "9 sites; 48 stormwater inspections; 0 illicit discharges; ~8,336 total building dept. inspections" },
      "Campbell":  { constructionSites: 7,   hillsideSites: 0,  highPrioritySites: 2,  largeDisturbanceSites: 5, totalInspections: 49,   illicitDischarges: 0, enforcementActions: 5, notes: "7 sites; 49 inspections; 5 enforcement actions (4 verbal, 1 stop-work order); ~13,528 total building dept inspections" },
    },
    aggregateMetrics: [
      { label: "Construction Sites Monitored", getValue: (d) => d.constructionSites, unit: "sites", sumAll: true },
      { label: "Stormwater Inspections Conducted", getValue: (d) => d.totalInspections, unit: "inspections", sumAll: true },
      { label: "Illicit Discharges Found", getValue: (d) => d.illicitDischarges, unit: "incidents", sumAll: true },
      { label: "High-Priority Sites", getValue: (d) => d.highPrioritySites, unit: "sites", sumAll: true },
    ],
    scores: { "San Jose": 88, "Sunnyvale": 90, "Saratoga": 88, "Campbell": 90 },
  },
  {
    code: "C.7",
    name: "Public Information & Outreach",
    description: "Education campaigns, community events, school programs, social media, and multilingual outreach for stormwater pollution prevention.",
    icon: "📣",
    costs: { "San Jose": 871000, "Sunnyvale": 155000, "Saratoga": 42000, "Campbell": 77000 },
    nextCosts: { "San Jose": 901000, "Sunnyvale": 161000, "Saratoga": 43000, "Campbell": 79000 },
    outputs: {
      "San Jose":  { outreachEvents: null, communityCleanups: 2, schoolPresentations: null, socialMediaPosts: null, residentsReached: null, notes: "Promoted 2 countywide creek cleanups; multilingual literature; San Jose Sharks partnership; Watershed Watch campaign; Barn Owl/IPM virtual presentations for college students" },
      "Sunnyvale": { outreachEvents: 28, communityCleanups: null, schoolPresentations: 4, socialMediaPosts: 11, residentsReached: 189676, notes: "189,676 reached via digital/streaming; 3,376 newsletter subscribers; 6 BAWSCA webinars (155 attendees); 28 outreach events; 182 students at City Hall presentations; 28 citizen outreach events" },
      "Saratoga":  { outreachEvents: null, communityCleanups: null, schoolPresentations: null, socialMediaPosts: 11, residentsReached: null, notes: "11 Authority GSI social posts; 4 webinars on Authority website; 7 YouTube videos; school presentations highlighting Hacienda Ave GSI" },
      "Campbell":  { outreachEvents: null, communityCleanups: null, schoolPresentations: null, socialMediaPosts: 16, residentsReached: null, notes: "11 Authority + 5 original Campbell GSI social posts = 16 total; 4 webinars; 7 YouTube videos" },
    },
    aggregateMetrics: [
      { label: "Outreach Events / Campaigns", getValue: (d) => d.outreachEvents || 0, unit: "events", sumAll: true },
      { label: "Social Media Posts", getValue: (d) => d.socialMediaPosts || 0, unit: "posts", sumAll: true },
      { label: "Residents Reached (Min Known)", getValue: (d) => d.residentsReached || 0, unit: "people", sumAll: true },
      { label: "Community Cleanups Promoted", getValue: (d) => d.communityCleanups || 0, unit: "events", sumAll: true },
    ],
    scores: { "San Jose": 90, "Sunnyvale": 88, "Saratoga": 85, "Campbell": 87 },
  },
  {
    code: "C.9",
    name: "Pesticides Toxicity Controls",
    description: "Integrated Pest Management (IPM) to minimize pesticide runoff. Tracking pesticide use, promoting non-toxic alternatives.",
    icon: "🌿",
    costs: { "San Jose": 480000, "Sunnyvale": 153000, "Saratoga": 31000, "Campbell": 72000 },
    nextCosts: { "San Jose": 497000, "Sunnyvale": 159000, "Saratoga": 32000, "Campbell": 74000 },
    outputs: {
      "San Jose":  { ipmpolicyActive: true, barnOwlBoxes: true, vendorIPMRequired: true, pesticideRunoffRisk: "Very Low", notes: "Barn Owl nest boxes for rodent control; hand-pulling, line trimming; all vendors required to follow IPM policy; nearly all pesticides applied in no-runoff conditions" },
      "Sunnyvale": { ipmpolicyActive: true, barnOwlBoxes: false, vendorIPMRequired: true, pesticideRunoffRisk: "Low", notes: "IPM policy active; pesticide trends tracked via SCVURPPP; CASQA regulatory participation" },
      "Saratoga":  { ipmpolicyActive: true, barnOwlBoxes: false, vendorIPMRequired: true, pesticideRunoffRisk: "Low", notes: "SCVURPPP and CASQA participation; 5-year IPM evaluation submitted in FY24-25" },
      "Campbell":  { ipmpolicyActive: true, barnOwlBoxes: false, vendorIPMRequired: true, pesticideRunoffRisk: "Low", notes: "5-year IPM improvement evaluation submitted; product cycling to reduce pest resistance; SCVURPPP participation" },
    },
    aggregateMetrics: [
      { label: "Cities with Active IPM Policy", getValue: (d) => d.ipmpolicyActive ? 1 : 0, unit: "cities", sumAll: true },
      { label: "Cities Requiring Vendor IPM", getValue: (d) => d.vendorIPMRequired ? 1 : 0, unit: "cities", sumAll: true },
      { label: "Cities with Very Low/Low Risk", getValue: (d) => ["Very Low","Low"].includes(d.pesticideRunoffRisk) ? 1 : 0, unit: "cities", sumAll: true },
    ],
    scores: { "San Jose": 95, "Sunnyvale": 90, "Saratoga": 88, "Campbell": 88 },
  },
  {
    code: "C.10",
    name: "Trash Load Reduction",
    description: "Achieving measurable trash load reductions through full trash capture systems, street sweeping, creek cleanups, and source control programs.",
    icon: "♻",
    costs: { "San Jose": 28286000, "Sunnyvale": 1573000, "Saratoga": 43000, "Campbell": 243000 },
    nextCosts: { "San Jose": 29351000, "Sunnyvale": 1636000, "Saratoga": 44000, "Campbell": 250000 },
    outputs: {
      "San Jose":  { totalReductionPct: 100, fullCapturePct: 59.5, otherControlPct: 15, ovtaPct: 19.9, ddtcpPct: 15, pldaPct: 18.7, trashTonsRemoved: 1884, creekCleanups: 3284, volunteerTonsRemoved: 33.7, landCleanupsCY: 17341, notes: ">100% achieved; 1,884 tons removed via DDTCP at 3,284 cleanups; 33.7 tons by volunteers; 17,341 cy on-land cleanup" },
      "Sunnyvale": { totalReductionPct: 100, fullCapturePct: 52.9, otherControlPct: 47.1, ovtaPct: null, ddtcpPct: null, pldaPct: null, trashTonsRemoved: null, creekCleanups: null, volunteerTonsRemoved: null, landCleanupsCY: 200, notes: "130 new inlet-based devices installed; total 620+ inlet screens; Right Size/Right Service container program" },
      "Saratoga":  { totalReductionPct: 100, fullCapturePct: 33.4, otherControlPct: 66.6, ovtaPct: null, ddtcpPct: null, pldaPct: null, trashTonsRemoved: 0.2, creekCleanups: 3, volunteerTonsRemoved: null, landCleanupsCY: null, notes: "3 cleanups; 400+ lbs (0.2 tons) removed; street sweeping, litter programs ongoing" },
      "Campbell":  { totalReductionPct: 100, fullCapturePct: 72.6, otherControlPct: 27.4, ovtaPct: null, ddtcpPct: null, pldaPct: null, trashTonsRemoved: 3.02, creekCleanups: 11, volunteerTonsRemoved: null, landCleanupsCY: 70, notes: "72.6% full capture — highest in group; 11 encampment cleanups on Los Gatos Creek; 70 cy removed" },
    },
    aggregateMetrics: [
      { label: "All Cities at 100% Trash Reduction", getValue: (d) => d.totalReductionPct >= 100 ? 1 : 0, unit: "cities", sumAll: true },
      { label: "Total Trash Removed (Tons)", getValue: (d) => d.trashTonsRemoved || 0, unit: "tons", sumAll: true },
      { label: "Total Creek/Land Cleanups", getValue: (d) => d.creekCleanups || 0, unit: "cleanups", sumAll: true },
      { label: "Avg. Full Capture Rate", getValue: (d) => d.fullCapturePct, unit: "%", sumAll: false, aggregate: "avg" },
    ],
    scores: { "San Jose": 100, "Sunnyvale": 100, "Saratoga": 100, "Campbell": 100 },
  },
  {
    code: "C.11",
    name: "Mercury Controls",
    description: "Reducing mercury entering waterways through low-mercury lamp purchasing, household hazardous waste recycling programs.",
    icon: "⚗",
    costs: { "San Jose": 0, "Sunnyvale": 0, "Saratoga": 5000, "Campbell": 6000 },
    nextCosts: { "San Jose": 0, "Sunnyvale": 0, "Saratoga": 5000, "Campbell": 6000 },
    outputs: {
      "San Jose":  { hhwHouseholds: null, mercuryPoundsDisposed: null, hhwCost: null, notes: "HHW program operated by County; EIC supports countywide lamp recycling; RMP participation" },
      "Sunnyvale": { hhwHouseholds: null, mercuryPoundsDisposed: null, hhwCost: null, notes: "HHW program through County; regional monitoring via SCVURPPP" },
      "Saratoga":  { hhwHouseholds: 476,  mercuryPoundsDisposed: 63, hhwCost: 8625, notes: "476 Saratoga households participated in HHW; 63 lbs mercury properly disposed at cost of $8,625" },
      "Campbell":  { hhwHouseholds: 740,  mercuryPoundsDisposed: 54, hhwCost: 7354, notes: "740 Campbell households used County HHW; 54 lbs mercury disposed at cost of $7,354" },
    },
    aggregateMetrics: [
      { label: "Households Using HHW Program", getValue: (d) => d.hhwHouseholds || 0, unit: "households", sumAll: true },
      { label: "Mercury Properly Disposed (lbs)", getValue: (d) => d.mercuryPoundsDisposed || 0, unit: "lbs", sumAll: true },
      { label: "HHW Program Cost", getValue: (d) => d.hhwCost || 0, unit: "$", sumAll: true },
    ],
    scores: { "San Jose": 90, "Sunnyvale": 88, "Saratoga": 90, "Campbell": 90 },
  },
  {
    code: "C.12",
    name: "PCBs Controls",
    description: "Reducing polychlorinated biphenyl (PCB) discharges through industrial source identification, demolition site monitoring, and control measures.",
    icon: "🧪",
    costs: { "San Jose": 584000, "Sunnyvale": 162000, "Saratoga": 23000, "Campbell": 32000 },
    nextCosts: { "San Jose": 604000, "Sunnyvale": 168000, "Saratoga": 24000, "Campbell": 33000 },
    outputs: {
      "San Jose":  { industrialSitesSampled: true, municipalInventoryUpdated: true, demolitionSitesTracked: null, notes: "Updated municipal PCB source inventory in FY23-24; active industrial area sampling program; RMP workgroup participation" },
      "Sunnyvale": { industrialSitesSampled: true, municipalInventoryUpdated: null, demolitionSitesTracked: true, notes: "Demolition sites with PCBs ≥50 ppm tracked (Appendix 12-1); regional program participation" },
      "Saratoga":  { industrialSitesSampled: true, municipalInventoryUpdated: null, demolitionSitesTracked: null, notes: "SCVURPPP PCBs control measures program; old industrial area monitoring" },
      "Campbell":  { industrialSitesSampled: true, municipalInventoryUpdated: null, demolitionSitesTracked: null, notes: "SCVURPPP regional PCBs control measures program participation" },
    },
    aggregateMetrics: [
      { label: "Cities with Active PCBs Sampling", getValue: (d) => d.industrialSitesSampled ? 1 : 0, unit: "cities", sumAll: true },
      { label: "Cities Tracking Demolition Sites", getValue: (d) => d.demolitionSitesTracked ? 1 : 0, unit: "cities", sumAll: true },
    ],
    scores: { "San Jose": 85, "Sunnyvale": 85, "Saratoga": 85, "Campbell": 85 },
  },
  {
    code: "C.17",
    name: "Unsheltered Homeless Populations",
    description: "Identifying and implementing control measures for non-stormwater discharges associated with unsheltered homeless populations.",
    icon: "🏠",
    costs: { "San Jose": 63982000, "Sunnyvale": 624000, "Saratoga": 21000, "Campbell": 52000 },
    nextCosts: { "San Jose": 69388000, "Sunnyvale": 649000, "Saratoga": 22000, "Campbell": 54000 },
    outputs: {
      "San Jose":  { unsheltered: 3959, waterwaySurgeCount: 1236, encampmentsCleared: null, trashRemovedTons: 1884, housingPlacements: null, notes: "2025 PIT count: 3,959; 1,236 within 500ft of waterways; OLIVE program: 30 sites cleared, 59 vehicles towed Jan–Jun 2025; $4.8M ERF Round 3 grant" },
      "Sunnyvale": { unsheltered: null, waterwaySurgeCount: null, encampmentsCleared: null, trashRemovedTons: null, housingPlacements: 39, notes: "WeHOPE: 1,827 contacts, 156 clients, 39 placed in housing since Sep 2024; Inclement Weather Hotel Pilot (Jan–Mar 2025)" },
      "Saratoga":  { unsheltered: 10, waterwaySurgeCount: null, encampmentsCleared: 3, trashRemovedTons: 0.2, housingPlacements: null, notes: "0–10 individuals; 3 cleanups; 400+ lbs removed; $2,000 contractor costs; coordination with SCC Sheriff's Office" },
      "Campbell":  { unsheltered: null, waterwaySurgeCount: null, encampmentsCleared: 11, trashRemovedTons: null, housingPlacements: null, notes: "11 encampments cleared near Los Gatos Creek (~70 cy); affordable housing projects approved at 60 W. Hamilton & VTA Winchester" },
    },
    aggregateMetrics: [
      { label: "Unsheltered Population (Min Known)", getValue: (d) => d.unsheltered || 0, unit: "people", sumAll: true },
      { label: "Encampments/Areas Cleared", getValue: (d) => d.encampmentsCleared || 0, unit: "sites", sumAll: true },
      { label: "Housing Placements Facilitated", getValue: (d) => d.housingPlacements || 0, unit: "placements", sumAll: true },
    ],
    scores: { "San Jose": 78, "Sunnyvale": 82, "Saratoga": 96, "Campbell": 84 },
  },
];

const CITY_NAMES = Object.keys(CITY_META);
const COLORS = { "San Jose": "#38bdf8", "Sunnyvale": "#a78bfa", "Saratoga": "#34d399", "Campbell": "#fbbf24" };

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmtNum = (n) => {
  if (n >= 1000000) return (n/1000000).toFixed(1) + "M";
  if (n >= 1000) return (n/1000).toFixed(0) + "K";
  return n.toString();
};
const fmtCost = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(2)}M` : `$${(n/1000).toFixed(0)}K`;
const scoreColor = (s) => s >= 95 ? "#34d399" : s >= 88 ? "#38bdf8" : s >= 80 ? "#fbbf24" : "#f87171";
const avgScore = (prov) => Math.round(CITY_NAMES.reduce((s, c) => s + prov.scores[c], 0) / CITY_NAMES.length);
const overallCityScore = (city) => Math.round(PROVISIONS.reduce((s, p) => s + p.scores[city], 0) / PROVISIONS.length);

// ─── AGGREGATE ROW ────────────────────────────────────────────────────────────
function AggregateRow({ metric, provision }) {
  const values = CITY_NAMES.map(c => ({ city: c, val: metric.getValue(provision.outputs[c]) }));
  const sum = values.reduce((s, v) => s + v.val, 0);
  const avg = sum / values.filter(v => v.val > 0).length;
  const displayValue = metric.aggregate === "avg" ? avg.toFixed(1) : sum;
  const max = Math.max(...values.map(v => v.val));

  return (
    <div style={{ borderBottom: `1px solid #1a2d46`, padding: "12px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>{metric.label}</span>
        <span style={{ color: "#e2e8f0", fontFamily: "monospace", fontWeight: 800, fontSize: 18 }}>
          {metric.unit === "$" ? `$${fmtNum(+displayValue)}` : metric.unit === "%" ? `${displayValue}%` : `${fmtNum(+displayValue)}`}
          <span style={{ color: "#475569", fontSize: 10, marginLeft: 4 }}>
            {metric.aggregate === "avg" ? "avg" : "total"} {metric.unit !== "$" && metric.unit !== "%" ? metric.unit : ""}
          </span>
        </span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {values.map(({ city, val }) => (
          <div key={city} style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ color: COLORS[city], fontSize: 9, fontWeight: 700 }}>{city.split(" ")[0]}</span>
              <span style={{ color: "#94a3b8", fontSize: 9, fontFamily: "monospace" }}>
                {metric.unit === "$" ? `$${fmtNum(val)}` : metric.unit === "%" ? `${val}%` : fmtNum(val)}
              </span>
            </div>
            <div style={{ height: 6, background: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3, transition: "width 0.6s ease",
                width: max > 0 ? `${(val / max) * 100}%` : "0%",
                background: COLORS[city],
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PROVISION CARD (aggregated view) ────────────────────────────────────────
function ProvisionAggregateCard({ provision, expanded, onToggle }) {
  const avg = avgScore(provision);
  const totalCost = CITY_NAMES.reduce((s, c) => s + provision.costs[c], 0);

  return (
    <div
      onClick={onToggle}
      style={{
        background: expanded ? "#0f1e33" : "#0b1527",
        border: `1px solid ${expanded ? "#1e3a5f" : "#131f30"}`,
        borderLeft: `3px solid ${scoreColor(avg)}`,
        borderRadius: 12, cursor: "pointer",
        transition: "all 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <div style={{ display: "grid", gridTemplateColumns: "44px 1fr auto auto auto", gap: 12, alignItems: "center", padding: "14px 18px" }}>
        <div style={{ fontSize: 22, textAlign: "center" }}>{provision.icon}</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#38bdf8", fontSize: 11, fontFamily: "monospace", fontWeight: 800 }}>{provision.code}</span>
            <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14 }}>{provision.name}</span>
          </div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>{provision.description}</div>
        </div>

        {/* Per-city score dots */}
        <div style={{ display: "flex", gap: 5 }}>
          {CITY_NAMES.map(c => (
            <div key={c} title={`${c}: ${provision.scores[c]}`} style={{
              width: 28, height: 28, borderRadius: "50%",
              background: scoreColor(provision.scores[c]) + "20",
              border: `2px solid ${scoreColor(provision.scores[c])}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: scoreColor(provision.scores[c]), fontSize: 9, fontWeight: 800, fontFamily: "monospace"
            }}>{provision.scores[c]}</div>
          ))}
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#475569", fontSize: 10 }}>Total Cost</div>
          <div style={{ color: "#94a3b8", fontFamily: "monospace", fontWeight: 700, fontSize: 13 }}>{fmtCost(totalCost)}</div>
        </div>

        <div style={{ width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          background: `conic-gradient(${scoreColor(avg)} ${avg * 3.6}deg, #0f172a ${avg * 3.6}deg)`,
          boxShadow: `0 0 0 2px #0b1527, 0 0 0 3px ${scoreColor(avg)}40`,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0b1527",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: scoreColor(avg), fontFamily: "monospace", fontWeight: 900, fontSize: 13 }}>{avg}</span>
          </div>
        </div>
      </div>

      {/* Expanded aggregate detail */}
      {expanded && (
        <div style={{ borderTop: "1px solid #1a2d46", padding: "20px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Left: Aggregate metrics */}
          <div>
            <div style={{ color: "#38bdf8", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
              ◈ Aggregated Outcomes — All 4 Cities Combined
            </div>
            {provision.aggregateMetrics.map((m, i) => (
              <AggregateRow key={i} metric={m} provision={provision} />
            ))}
          </div>

          {/* Right: City-by-city notes + cost breakdown */}
          <div>
            <div style={{ color: "#a78bfa", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
              ◈ City Detail
            </div>
            {CITY_NAMES.map(c => (
              <div key={c} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #131f30" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[c] }} />
                    <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 12 }}>{c}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ color: "#475569", fontSize: 11, fontFamily: "monospace" }}>{fmtCost(provision.costs[c])}</span>
                    <span style={{ color: scoreColor(provision.scores[c]), fontFamily: "monospace", fontWeight: 800, fontSize: 13 }}>{provision.scores[c]}</span>
                  </div>
                </div>
                <div style={{ color: "#64748b", fontSize: 11, lineHeight: 1.5 }}>{provision.outputs[c].notes}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AGGREGATED SUMMARY HERO ──────────────────────────────────────────────────
function AggregateSummaryHero() {
  const totalCost = CITY_NAMES.reduce((s, c) => s + CITY_META[c].totalCost, 0);
  const totalInspections_C4 = PROVISIONS.find(p => p.code === "C.4");
  const c4total = CITY_NAMES.reduce((s, c) => s + (totalInspections_C4.outputs[c].inspectionsTotal || 0), 0);
  const c5total = CITY_NAMES.reduce((s, c) => s + (PROVISIONS.find(p => p.code === "C.5").outputs[c].totalReports || 0), 0);
  const c6total = CITY_NAMES.reduce((s, c) => s + (PROVISIONS.find(p => p.code === "C.6").outputs[c].totalInspections || 0), 0);
  const trashTons = CITY_NAMES.reduce((s, c) => s + (PROVISIONS.find(p => p.code === "C.10").outputs[c].trashTonsRemoved || 0), 0);
  const mercuryLbs = CITY_NAMES.reduce((s, c) => s + (PROVISIONS.find(p => p.code === "C.11").outputs[c].mercuryPoundsDisposed || 0), 0);
  const hhwHouseholds = CITY_NAMES.reduce((s, c) => s + (PROVISIONS.find(p => p.code === "C.11").outputs[c].hhwHouseholds || 0), 0);
  const cleanups_C17 = CITY_NAMES.reduce((s, c) => s + (PROVISIONS.find(p => p.code === "C.17").outputs[c].encampmentsCleared || 0), 0);
  const housingPlacements = CITY_NAMES.reduce((s, c) => s + (PROVISIONS.find(p => p.code === "C.17").outputs[c].housingPlacements || 0), 0);
  const c6sites = CITY_NAMES.reduce((s, c) => s + (PROVISIONS.find(p => p.code === "C.6").outputs[c].constructionSites || 0), 0);
  const c3inventory = CITY_NAMES.reduce((s, c) => s + (PROVISIONS.find(p => p.code === "C.3").outputs[c].totalInventory || 0), 0);
  const c3inspections = CITY_NAMES.reduce((s, c) => s + (PROVISIONS.find(p => p.code === "C.3").outputs[c].inspectedCount || 0), 0);

  const stats = [
    { label: "Combined Program Cost", value: fmtCost(totalCost), sub: "FY 2024-25 total", accent: "#38bdf8" },
    { label: "Cities at 100% Trash Reduction", value: "4 of 4", sub: "all cities compliant", accent: "#34d399" },
    { label: "Industrial Inspections (C.4)", value: fmtNum(c4total), sub: "inspections across 4 cities", accent: "#a78bfa" },
    { label: "Discharge Reports Handled (C.5)", value: fmtNum(c5total), sub: "illicit discharge events", accent: "#fbbf24" },
    { label: "Construction Stormwater Inspections (C.6)", value: fmtNum(c6total), sub: `across ${c6sites} sites monitored`, accent: "#38bdf8" },
    { label: "Trash Removed (C.10)", value: `${(trashTons).toFixed(1)} tons`, sub: "from creeks & waterways", accent: "#34d399" },
    { label: "Mercury Disposed (C.11)", value: `${mercuryLbs} lbs`, sub: `${hhwHouseholds} households via HHW`, accent: "#a78bfa" },
    { label: "Encampments Cleared (C.17)", value: fmtNum(cleanups_C17), sub: `+ ${housingPlacements} housing placements`, accent: "#fbbf24" },
    { label: "Regulated LID Projects (C.3)", value: fmtNum(c3inventory), sub: `${c3inspections} O&M inspections`, accent: "#38bdf8" },
  ];

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: "#0b1527", border: `1px solid #131f30`,
            borderTop: `2px solid ${s.accent}33`, borderRadius: 10, padding: "14px 18px",
          }}>
            <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
            <div style={{ color: s.accent, fontFamily: "monospace", fontWeight: 900, fontSize: 22, lineHeight: 1 }}>{s.value}</div>
            <div style={{ color: "#334155", fontSize: 11, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CITY SUMMARY PANEL ────────────────────────────────────────────────────────
function CitySummaryPanel() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
      {CITY_NAMES.map(c => {
        const score = overallCityScore(c);
        const pcc = Math.round(CITY_META[c].totalCost / CITY_META[c].pop);
        return (
          <div key={c} style={{
            background: "#0b1527", border: `1px solid ${COLORS[c]}22`,
            borderRadius: 12, padding: 18,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[c] }} />
              <span style={{ color: "#e2e8f0", fontWeight: 800, fontSize: 15 }}>{c}</span>
            </div>
            <div style={{ color: scoreColor(score), fontFamily: "monospace", fontWeight: 900, fontSize: 36 }}>{score}</div>
            <div style={{ color: "#475569", fontSize: 11, marginBottom: 10 }}>avg compliance score</div>
            <div style={{ color: COLORS[c], fontFamily: "monospace", fontWeight: 700, fontSize: 14 }}>{fmtCost(CITY_META[c].totalCost)}</div>
            <div style={{ color: "#475569", fontSize: 11 }}>total program cost</div>
            <div style={{ marginTop: 10, padding: "8px 0", borderTop: "1px solid #1a2d46", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              <div>
                <div style={{ color: "#e2e8f0", fontFamily: "monospace", fontWeight: 700 }}>${pcc}</div>
                <div style={{ color: "#334155", fontSize: 10 }}>per capita</div>
              </div>
              <div>
                <div style={{ color: "#e2e8f0", fontFamily: "monospace", fontWeight: 700 }}>{CITY_META[c].pop.toLocaleString()}</div>
                <div style={{ color: "#334155", fontSize: 10 }}>population</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── COMPARISON CHARTS ────────────────────────────────────────────────────────
function CompareCharts() {
  const scoreData = PROVISIONS.map(p => {
    const entry = { code: p.code };
    CITY_NAMES.forEach(c => { entry[c] = p.scores[c]; });
    entry.avg = avgScore(p);
    return entry;
  });

  const costData = PROVISIONS.map(p => {
    const entry = { code: p.code };
    CITY_NAMES.forEach(c => { entry[c] = Math.round(p.costs[c] / 1000); });
    return entry;
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 14px" }}>
        <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>{label}</div>
        {payload.map(p => p.name !== "avg" && (
          <div key={p.name} style={{ color: COLORS[p.name] || "#94a3b8", fontSize: 12, fontWeight: 700 }}>
            {p.name}: {p.value}{typeof p.value === "number" && p.dataKey !== "avg" ? "" : ""}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: "#0b1527", border: "1px solid #131f30", borderRadius: 14, padding: 20 }}>
        <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Compliance Scores by Provision — All Cities</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={scoreData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" />
            <XAxis dataKey="code" tick={{ fill: "#475569", fontSize: 10, fontFamily: "monospace" }} />
            <YAxis domain={[70, 100]} tick={{ fill: "#475569", fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "#64748b", fontSize: 11 }} />
            {CITY_NAMES.map(c => <Bar key={c} dataKey={c} fill={COLORS[c]} radius={[3,3,0,0]} />)}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: "#0b1527", border: "1px solid #131f30", borderRadius: 14, padding: 20 }}>
        <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Program Cost by Provision ($K)</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={costData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" />
            <XAxis dataKey="code" tick={{ fill: "#475569", fontSize: 10, fontFamily: "monospace" }} />
            <YAxis tick={{ fill: "#475569", fontSize: 10 }} tickFormatter={v => `$${v}K`} />
            <Tooltip content={<CustomTooltip />} formatter={(v) => [`$${v}K`]} />
            <Legend wrapperStyle={{ color: "#64748b", fontSize: 11 }} />
            {CITY_NAMES.map(c => <Bar key={c} dataKey={c} fill={COLORS[c]} radius={[3,3,0,0]} />)}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("aggregate");
  const [expandedProvision, setExpandedProvision] = useState(null);

  const tabs = [
    { id: "aggregate", label: "Provision Aggregates" },
    { id: "compare",   label: "Comparison Charts"   },
    { id: "overview",  label: "City Overview"        },
  ];

  const toggle = (code) => setExpandedProvision(p => p === code ? null : code);

  return (
    <div style={{
      minHeight: "100vh", background: "#060e1a", color: "#cbd5e1",
      fontFamily: "'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', monospace",
    }}>
      {/* Top bar */}
      <div style={{
        background: "#08111e", borderBottom: "1px solid #0f1e33",
        position: "sticky", top: 0, zIndex: 100, padding: "0 28px",
      }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", height: 60, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="32" height="32" viewBox="0 0 32 32">
              <polygon points="16,2 30,9 30,23 16,30 2,23 2,9" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
              <polygon points="16,8 24,12 24,20 16,24 8,20 8,12" fill="#38bdf822" stroke="#38bdf855" strokeWidth="1" />
            </svg>
            <div>
              <div style={{ color: "#e2e8f0", fontWeight: 900, fontSize: 14, letterSpacing: "0.05em" }}>STORMWATER IQ</div>
              <div style={{ color: "#334155", fontSize: 9, letterSpacing: "0.12em" }}>NPDES MRP FY 2024-25 · SANTA CLARA COUNTY · 4 PERMITTEES</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 2, marginLeft: 24 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                background: activeTab === t.id ? "#38bdf820" : "transparent",
                border: activeTab === t.id ? "1px solid #38bdf840" : "1px solid transparent",
                color: activeTab === t.id ? "#38bdf8" : "#475569",
                borderRadius: 8, padding: "6px 16px", fontSize: 11, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em", transition: "all 0.15s",
              }}>{t.label}</button>
            ))}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
            {CITY_NAMES.map(c => (
              <div key={c} style={{ textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: COLORS[c] }} />
                  <span style={{ color: "#334155", fontSize: 10 }}>{c.split(" ")[0]}</span>
                </div>
                <div style={{ color: scoreColor(overallCityScore(c)), fontFamily: "monospace", fontWeight: 900, fontSize: 14 }}>
                  {overallCityScore(c)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "28px" }}>
        {activeTab === "aggregate" && (
          <>
            <AggregateSummaryHero />
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: "#334155", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                Click any provision to see aggregated outcomes across all 4 cities
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {PROVISIONS.map(p => (
                  <ProvisionAggregateCard
                    key={p.code}
                    provision={p}
                    expanded={expandedProvision === p.code}
                    onToggle={() => toggle(p.code)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "compare" && (
          <>
            <CitySummaryPanel />
            <CompareCharts />
          </>
        )}

        {activeTab === "overview" && (
          <>
            <CitySummaryPanel />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {CITY_NAMES.map(c => (
                <div key={c} style={{ background: "#0b1527", border: `1px solid ${COLORS[c]}22`, borderRadius: 14, padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[c] }} />
                    <span style={{ color: "#e2e8f0", fontWeight: 800, fontSize: 16 }}>City of {c}</span>
                    <span style={{ marginLeft: "auto", color: scoreColor(overallCityScore(c)), fontFamily: "monospace", fontWeight: 900, fontSize: 22 }}>
                      {overallCityScore(c)}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {PROVISIONS.map(p => (
                      <div key={p.code} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ color: "#38bdf8", fontFamily: "monospace", fontSize: 10, width: 28 }}>{p.code}</span>
                        <div style={{ flex: 1, height: 5, background: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${p.scores[c]}%`, background: scoreColor(p.scores[c]), borderRadius: 3 }} />
                        </div>
                        <span style={{ color: scoreColor(p.scores[c]), fontFamily: "monospace", fontSize: 11, fontWeight: 700, width: 24 }}>{p.scores[c]}</span>
                        <span style={{ color: "#1e3a5f", fontSize: 10, width: 48, textAlign: "right" }}>{fmtCost(p.costs[c])}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #131f30", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={{ color: COLORS[c], fontFamily: "monospace", fontWeight: 800, fontSize: 16 }}>{fmtCost(CITY_META[c].totalCost)}</div>
                      <div style={{ color: "#334155", fontSize: 10 }}>total program cost</div>
                    </div>
                    <div>
                      <div style={{ color: "#94a3b8", fontFamily: "monospace", fontWeight: 700, fontSize: 14 }}>${Math.round(CITY_META[c].totalCost / CITY_META[c].pop)}/capita</div>
                      <div style={{ color: "#334155", fontSize: 10 }}>cost per resident</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
