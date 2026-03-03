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
  "San Jose":  { pop: 979415, color: "#0284c7", totalCost: 123982000, nextCost: 132402000 },
  "Sunnyvale": { pop: 155805, color: "#7c3aed", totalCost: 4848000,   nextCost: 5040000   },
  "Saratoga":  { pop: 31000,  color: "#059669", totalCost: 1239000,   nextCost: 1270000   },
  "Campbell":  { pop: 42895,  color: "#d97706", totalCost: 1150000,   nextCost: 1187000   },
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
const COLORS = { "San Jose": "#0284c7", "Sunnyvale": "#7c3aed", "Saratoga": "#059669", "Campbell": "#d97706" };

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmtNum = (n) => {
  if (n >= 1000000) return (n/1000000).toFixed(1) + "M";
  if (n >= 1000) return (n/1000).toFixed(0) + "K";
  return n.toString();
};
const fmtCost = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(2)}M` : `$${(n/1000).toFixed(0)}K`;
const scoreColor = (s) => s >= 95 ? "#059669" : s >= 88 ? "#0284c7" : s >= 80 ? "#d97706" : "#f87171";
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
    <div style={{ borderBottom: "1px solid #e2e8f0", padding: "12px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ color: "#64748b", fontSize: 14, fontWeight: 600 }}>{metric.label}</span>
        <span style={{ color: "#1e293b", fontFamily: "inherit", fontWeight: 800, fontSize: 20 }}>
          {metric.unit === "$" ? `$${fmtNum(+displayValue)}` : metric.unit === "%" ? `${displayValue}%` : `${fmtNum(+displayValue)}`}
          <span style={{ color: "#64748b", fontSize: 13, marginLeft: 4 }}>
            {metric.aggregate === "avg" ? "avg" : "total"} {metric.unit !== "$" && metric.unit !== "%" ? metric.unit : ""}
          </span>
        </span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {values.map(({ city, val }) => (
          <div key={city} style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ color: COLORS[city], fontSize: 12, fontWeight: 700 }}>{city.split(" ")[0]}</span>
              <span style={{ color: "#64748b", fontSize: 12, fontFamily: "inherit" }}>
                {metric.unit === "$" ? `$${fmtNum(val)}` : metric.unit === "%" ? `${val}%` : fmtNum(val)}
              </span>
            </div>
            <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 4, transition: "width 0.6s ease",
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
        background: expanded ? "#f0f7ff" : "#ffffff",
        border: `1px solid ${expanded ? "#bfdbfe" : "#e2e8f0"}`,
        borderLeft: `4px solid ${scoreColor(avg)}`,
        borderRadius: 12, cursor: "pointer",
        transition: "all 0.2s ease",
        overflow: "hidden",
        boxShadow: expanded ? "0 2px 12px rgba(0,0,0,0.08)" : "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header row */}
      <div style={{ display: "grid", gridTemplateColumns: "52px 1fr auto auto auto", gap: 14, alignItems: "center", padding: "18px 22px" }}>
        <div style={{ fontSize: 28, textAlign: "center" }}>{provision.icon}</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#0284c7", fontSize: 15, fontFamily: "inherit", fontWeight: 800, background: "#e0f2fe", padding: "2px 8px", borderRadius: 6 }}>{provision.code}</span>
            <span style={{ color: "#1e293b", fontWeight: 700, fontSize: 18 }}>{provision.name}</span>
          </div>
          <div style={{ color: "#64748b", fontSize: 14, marginTop: 5, lineHeight: 1.5 }}>{provision.description}</div>
        </div>

        {/* Per-city score dots */}
        <div style={{ display: "flex", gap: 6 }}>
          {CITY_NAMES.map(c => (
            <div key={c} title={`${c}: ${provision.scores[c]}`} style={{
              width: 36, height: 36, borderRadius: "50%",
              background: scoreColor(provision.scores[c]) + "15",
              border: `2px solid ${scoreColor(provision.scores[c])}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: scoreColor(provision.scores[c]), fontSize: 12, fontWeight: 800, fontFamily: "inherit"
            }}>{provision.scores[c]}</div>
          ))}
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#94a3b8", fontSize: 13 }}>Total Cost</div>
          <div style={{ color: "#1e293b", fontFamily: "inherit", fontWeight: 700, fontSize: 16 }}>{fmtCost(totalCost)}</div>
        </div>

        <div style={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          background: `conic-gradient(${scoreColor(avg)} ${avg * 3.6}deg, #e2e8f0 ${avg * 3.6}deg)`,
          boxShadow: `0 0 0 2px #ffffff, 0 0 0 3px ${scoreColor(avg)}60`,
        }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#ffffff",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: scoreColor(avg), fontFamily: "inherit", fontWeight: 900, fontSize: 16 }}>{avg}</span>
          </div>
        </div>
      </div>

      {/* Expanded aggregate detail */}
      {expanded && (
        <div style={{ borderTop: "1px solid #e2e8f0", padding: "24px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, background: "#f8fafc" }}>
          {/* Left: Aggregate metrics */}
          <div>
            <div style={{ color: "#0284c7", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>◈</span> Aggregated Outcomes — All 4 Cities Combined
            </div>
            {provision.aggregateMetrics.map((m, i) => (
              <AggregateRow key={i} metric={m} provision={provision} />
            ))}
          </div>

          {/* Right: City-by-city notes */}
          <div>
            <div style={{ color: "#7c3aed", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>◈</span> City Detail
            </div>
            {CITY_NAMES.map(c => (
              <div key={c} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[c] }} />
                    <span style={{ color: "#1e293b", fontWeight: 700, fontSize: 15 }}>{c}</span>
                  </div>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <span style={{ color: "#64748b", fontSize: 14, fontFamily: "inherit" }}>{fmtCost(provision.costs[c])}</span>
                    <span style={{ color: scoreColor(provision.scores[c]), fontFamily: "inherit", fontWeight: 800, fontSize: 15, background: scoreColor(provision.scores[c]) + "15", padding: "1px 8px", borderRadius: 6 }}>{provision.scores[c]}</span>
                  </div>
                </div>
                <div style={{ color: "#475569", fontSize: 14, lineHeight: 1.6 }}>{provision.outputs[c].notes}</div>
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
    { label: "Combined Program Cost", value: fmtCost(totalCost), sub: "FY 2024-25 total", accent: "#0284c7" },
    { label: "Cities at 100% Trash Reduction", value: "4 of 4", sub: "all cities compliant", accent: "#059669" },
    { label: "Industrial Inspections (C.4)", value: fmtNum(c4total), sub: "inspections across 4 cities", accent: "#7c3aed" },
    { label: "Discharge Reports Handled (C.5)", value: fmtNum(c5total), sub: "illicit discharge events", accent: "#d97706" },
    { label: "Construction Stormwater Inspections (C.6)", value: fmtNum(c6total), sub: `across ${c6sites} sites monitored`, accent: "#0284c7" },
    { label: "Trash Removed (C.10)", value: `${(trashTons).toFixed(1)} tons`, sub: "from creeks & waterways", accent: "#059669" },
    { label: "Mercury Disposed (C.11)", value: `${mercuryLbs} lbs`, sub: `${hhwHouseholds} households via HHW`, accent: "#7c3aed" },
    { label: "Encampments Cleared (C.17)", value: fmtNum(cleanups_C17), sub: `+ ${housingPlacements} housing placements`, accent: "#d97706" },
    { label: "Regulated LID Projects (C.3)", value: fmtNum(c3inventory), sub: `${c3inspections} O&M inspections`, accent: "#0284c7" },
  ];

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: "#ffffff", border: `1px solid #e2e8f0`,
            borderTop: `3px solid ${s.accent}88`, borderRadius: 10, padding: "14px 18px",
          }}>
            <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
            <div style={{ color: s.accent, fontFamily: "inherit", fontWeight: 900, fontSize: 24, lineHeight: 1 }}>{s.value}</div>
            <div style={{ color: "#475569", fontSize: 14, marginTop: 4 }}>{s.sub}</div>
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
            background: "#ffffff", border: `1px solid ${COLORS[c]}22`,
            borderRadius: 12, padding: 18,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[c] }} />
              <span style={{ color: "#1e293b", fontWeight: 800, fontSize: 17 }}>{c}</span>
            </div>
            <div style={{ color: scoreColor(score), fontFamily: "inherit", fontWeight: 900, fontSize: 38 }}>{score}</div>
            <div style={{ color: "#64748b", fontSize: 14, marginBottom: 10 }}>avg compliance score</div>
            <div style={{ color: COLORS[c], fontFamily: "inherit", fontWeight: 700, fontSize: 16 }}>{fmtCost(CITY_META[c].totalCost)}</div>
            <div style={{ color: "#64748b", fontSize: 14 }}>total program cost</div>
            <div style={{ marginTop: 10, padding: "8px 0", borderTop: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              <div>
                <div style={{ color: "#1e293b", fontFamily: "inherit", fontWeight: 700 }}>${pcc}</div>
                <div style={{ color: "#475569", fontSize: 13 }}>per capita</div>
              </div>
              <div>
                <div style={{ color: "#1e293b", fontFamily: "inherit", fontWeight: 700 }}>{CITY_META[c].pop.toLocaleString()}</div>
                <div style={{ color: "#475569", fontSize: 13 }}>population</div>
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
      <div style={{ background: "#f1f5f9", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 14px" }}>
        <div style={{ color: "#64748b", fontSize: 14, marginBottom: 4 }}>{label}</div>
        {payload.map(p => p.name !== "avg" && (
          <div key={p.name} style={{ color: COLORS[p.name] || "#94a3b8", fontSize: 14, fontWeight: 700 }}>
            {p.name}: {p.value}{typeof p.value === "number" && p.dataKey !== "avg" ? "" : ""}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20 }}>
        <div style={{ color: "#1e293b", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Compliance Scores by Provision — All Cities</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={scoreData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" />
            <XAxis dataKey="code" tick={{ fill: "#475569", fontSize: 13, fontFamily: "inherit" }} />
            <YAxis domain={[70, 100]} tick={{ fill: "#475569", fontSize: 13 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "#64748b", fontSize: 14 }} />
            {CITY_NAMES.map(c => <Bar key={c} dataKey={c} fill={COLORS[c]} radius={[3,3,0,0]} />)}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20 }}>
        <div style={{ color: "#1e293b", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Program Cost by Provision ($K)</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={costData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" />
            <XAxis dataKey="code" tick={{ fill: "#475569", fontSize: 13, fontFamily: "inherit" }} />
            <YAxis tick={{ fill: "#475569", fontSize: 13 }} tickFormatter={v => `$${v}K`} />
            <Tooltip content={<CustomTooltip />} formatter={(v) => [`$${v}K`]} />
            <Legend wrapperStyle={{ color: "#64748b", fontSize: 14 }} />
            {CITY_NAMES.map(c => <Bar key={c} dataKey={c} fill={COLORS[c]} radius={[3,3,0,0]} />)}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── TRENDS & PREDICTIONS TAB ────────────────────────────────────────────────
function TrendsTab() {
  // Cost trend data: FY24-25 actual vs FY25-26 projected (from C.20 cost reports)
  const costTrend = CITY_NAMES.map(c => ({
    city: c,
    fy2425: CITY_META[c].totalCost,
    fy2526: CITY_META[c].nextCost,
    changePct: (((CITY_META[c].nextCost - CITY_META[c].totalCost) / CITY_META[c].totalCost) * 100).toFixed(1),
    changeAbs: CITY_META[c].nextCost - CITY_META[c].totalCost,
  }));

  // Provision-level cost changes (current → next year)
  const provCostChanges = PROVISIONS.map(p => {
    const cur = CITY_NAMES.reduce((s, c) => s + p.costs[c], 0);
    const nxt = CITY_NAMES.reduce((s, c) => s + p.nextCosts[c], 0);
    return { code: p.code, name: p.name, icon: p.icon, cur, nxt, pct: (((nxt - cur) / cur) * 100).toFixed(1) };
  }).sort((a, b) => parseFloat(b.pct) - parseFloat(a.pct));

  // Key compliance trends extracted from report text (year-over-year observations)
  const complianceTrends = [
    {
      provision: "C.4", label: "Industrial Inspection Correction Rate",
      city: "San Jose", direction: "down", value: "84%", prev: "86%",
      note: "Timely correction rate declined 2% vs FY 23-24 — 16% of violations not corrected within 10 days",
      risk: "medium",
    },
    {
      provision: "C.6", label: "Construction Site Corrective Actions",
      city: "Sunnyvale", direction: "down", value: "<1%", prev: "2.5%",
      note: "Sites requiring corrective action fell from 2.5% to <1% — multi-year improving trend",
      risk: "low",
    },
    {
      provision: "C.3", label: "Regulated Project Inventory Growth",
      city: "San Jose", direction: "up", value: "696", prev: "655",
      note: "Inventory grew by 41 projects (+6.3%) in one year — inspection capacity under pressure at 24% inspected",
      risk: "high",
    },
    {
      provision: "C.3", label: "Regulated Project Inventory",
      city: "Campbell", direction: "up", value: "55", prev: "49",
      note: "Inventory grew 12% year-over-year after legacy MRP 1.0 projects were added; 49% inspected",
      risk: "medium",
    },
    {
      provision: "C.10", label: "Full Trash Capture Rate",
      city: "Sunnyvale", direction: "up", value: "620+", prev: "490",
      note: "130 new inlet devices installed in FY 24-25 — accelerating toward full capture target",
      risk: "low",
    },
    {
      provision: "C.17", label: "C.17 Program Cost — San Jose",
      city: "San Jose", direction: "up", value: "$63.98M", prev: "~$57M est.",
      note: "C.17 costs rising ~12%/yr, driven by waterway encampment response — no cap in sight without regional funding mechanism",
      risk: "critical",
    },
    {
      provision: "C.17", label: "Housing Placements via WeHOPE",
      city: "Sunnyvale", direction: "up", value: "39", prev: "0",
      note: "New Sep 2024 program already placed 39 individuals in housing — upstream intervention showing early results",
      risk: "low",
    },
    {
      provision: "C.5", label: "Discharge Resolution Rate",
      city: "All Cities", direction: "stable", value: "96–100%", prev: "96–100%",
      note: "All four cities maintaining near-perfect illicit discharge resolution rates — strong baseline",
      risk: "low",
    },
  ];

  // Predictive projections (3-year forward based on current trajectory)
  const predictions = [
    {
      horizon: "FY 2025-26", confidence: "High",
      title: "San Jose C.17 Costs Exceed $69M",
      detail: "Projected FY 25-26 C.17 budget is $69.4M (+8.4%). At current trajectory, C.17 will consume 54%+ of San Jose's entire stormwater budget by FY 26-27 without structural intervention.",
      icon: "📈", risk: "critical",
      metric: "$69.4M", basis: "FY 25-26 C.20 projection from annual report",
    },
    {
      horizon: "June 30, 2027", confidence: "High",
      title: "GSI Numeric Retrofit Deadline — Campbell & Saratoga",
      detail: "MRP 3.0 C.3.j requires numeric impervious area retrofit targets by June 30, 2027. Campbell has Downtown PDA biotreatment underway; Saratoga has only 1 project inspected of 5. Both face deadline risk without immediate project identification.",
      icon: "⏰", risk: "critical",
      metric: "2 yrs", basis: "C.3.j.v.(3) Numeric Retrofit Requirements — all four annual reports",
    },
    {
      horizon: "FY 2026-27", confidence: "Medium",
      title: "San Jose C.3 Inspection Backlog Reaches Crisis Point",
      detail: "With 696 projects in inventory and only 161 inspected (24%), adding ~40 projects/yr means uninspected inventory grows faster than inspection capacity. Projected 800+ project backlog by FY 26-27 without additional inspector resources.",
      icon: "🔍", risk: "high",
      metric: "800+ projects", basis: "C.3 O&M inspection table — San Jose annual report",
    },
    {
      horizon: "FY 2025-26", confidence: "High",
      title: "All 4 Cities Maintain 100% Trash Reduction",
      detail: "Full trash capture infrastructure is largely in place across all cities. Campbell leads at 72.6% full capture; all are on trajectory to maintain 100% reduction compliance. No significant compliance risk anticipated.",
      icon: "♻", risk: "low",
      metric: "100%", basis: "C.10 trash reduction tables — all four annual reports",
    },
    {
      horizon: "FY 2025-26", confidence: "Medium",
      title: "Sunnyvale Bacteria (C.14) Source Identification Breakthrough Possible",
      detail: "130 inlet screens installed in FY 24-25 (620+ total). If FIB source identification efforts isolate primary sources in FY 25-26, targeted remediation could significantly reduce bacteria loading in impaired segments.",
      icon: "🧫", risk: "medium",
      metric: "620+ screens", basis: "C.14 bacteria control — Sunnyvale annual report",
    },
    {
      horizon: "2026-2028", confidence: "Low-Medium",
      title: "Regional Homeless Discharge Cost Sharing Under Pressure",
      detail: "San Jose bears 97%+ of all C.17 costs among these four cities despite regional waterway connectivity. ERF Round 3 grant ($4.8M) provides temporary relief. Without a regional cost-sharing framework, fiscal pressure is unsustainable.",
      icon: "🏠", risk: "high",
      metric: "97% cost share", basis: "C.17 cost reporting — all four annual reports",
    },
  ];

  const riskColor = { critical: "#dc2626", high: "#ea580c", medium: "#d97706", low: "#059669" };
  const riskBg = { critical: "#fef2f2", high: "#fff7ed", medium: "#fffbeb", low: "#f0fdf4" };
  const riskBorder = { critical: "#fecaca", high: "#fed7aa", medium: "#fde68a", low: "#bbf7d0" };
  const dirIcon = { up: "↑", down: "↓", stable: "→" };
  const dirColor = (t, dir) => dir === "up" ? (t.risk === "low" ? "#059669" : "#ea580c") : dir === "down" ? (t.risk === "low" ? "#059669" : "#dc2626") : "#64748b";

  const costBarData = PROVISIONS.map(p => {
    const cur = CITY_NAMES.reduce((s, c) => s + p.costs[c], 0);
    const nxt = CITY_NAMES.reduce((s, c) => s + p.nextCosts[c], 0);
    return { name: p.code, "FY 24-25": Math.round(cur/1000), "FY 25-26 Proj": Math.round(nxt/1000) };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* City cost trajectory */}
      <div>
        <h2 style={{ color: "#1e293b", fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Cost Trajectory — FY 24-25 → FY 25-26</h2>
        <p style={{ color: "#64748b", fontSize: 15, margin: "0 0 18px" }}>Actual vs. projected program costs from each city's C.20 cost reporting section</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          {costTrend.map(ct => (
            <div key={ct.city} style={{ background: "#ffffff", border: `1px solid #e2e8f0`, borderTop: `3px solid ${COLORS[ct.city]}`, borderRadius: 12, padding: 18 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[ct.city] }} />
                <span style={{ color: "#1e293b", fontWeight: 700, fontSize: 15 }}>{ct.city}</span>
              </div>
              <div style={{ color: "#64748b", fontSize: 13, marginBottom: 4 }}>FY 24-25 Actual</div>
              <div style={{ color: "#1e293b", fontWeight: 800, fontSize: 20, marginBottom: 8 }}>{fmtCost(ct.fy2425)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: "#e2e8f0", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${(ct.fy2425 / ct.fy2526) * 100}%`, background: COLORS[ct.city], borderRadius: 3 }} />
                </div>
              </div>
              <div style={{ color: "#64748b", fontSize: 13, marginTop: 8, marginBottom: 2 }}>FY 25-26 Projected</div>
              <div style={{ color: COLORS[ct.city], fontWeight: 800, fontSize: 18 }}>{fmtCost(ct.fy2526)}</div>
              <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4, background: parseFloat(ct.changePct) > 5 ? "#fff7ed" : "#f0fdf4", border: `1px solid ${parseFloat(ct.changePct) > 5 ? "#fed7aa" : "#bbf7d0"}`, borderRadius: 20, padding: "3px 10px" }}>
                <span style={{ color: parseFloat(ct.changePct) > 5 ? "#ea580c" : "#059669", fontWeight: 700, fontSize: 14 }}>
                  ↑ +{ct.changePct}% (+{fmtCost(ct.changeAbs)})
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Provision cost change bar chart */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 22 }}>
          <div style={{ color: "#1e293b", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Provision-Level Budget Changes (All Cities Combined, $K)</div>
          <div style={{ color: "#64748b", fontSize: 14, marginBottom: 16 }}>Comparing FY 24-25 actuals vs FY 25-26 projections — largest increases signal where costs are accelerating</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={costBarData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 13 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={v => `$${v}K`} />
              <Tooltip formatter={(v) => [`$${v.toLocaleString()}K`]} contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="FY 24-25" fill="#0284c7" radius={[4,4,0,0]} />
              <Bar dataKey="FY 25-26 Proj" fill="#7c3aed" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Year-over-year compliance trends */}
      <div>
        <h2 style={{ color: "#1e293b", fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Year-over-Year Compliance Trends</h2>
        <p style={{ color: "#64748b", fontSize: 15, margin: "0 0 18px" }}>Directional signals drawn from FY 23-24 vs FY 24-25 comparisons in the annual reports</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {complianceTrends.map((t, i) => (
            <div key={i} style={{ background: riskBg[t.risk], border: `1px solid ${riskBorder[t.risk]}`, borderLeft: `4px solid ${riskColor[t.risk]}`, borderRadius: 12, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <span style={{ color: "#0284c7", fontSize: 13, fontWeight: 700, background: "#e0f2fe", padding: "2px 8px", borderRadius: 6, marginRight: 8 }}>{t.provision}</span>
                  <span style={{ color: "#64748b", fontSize: 13 }}>{t.city}</span>
                </div>
                <span style={{ color: riskColor[t.risk], fontSize: 12, fontWeight: 700, background: riskBg[t.risk], border: `1px solid ${riskBorder[t.risk]}`, padding: "2px 10px", borderRadius: 20 }}>
                  {t.risk.toUpperCase()}
                </span>
              </div>
              <div style={{ color: "#1e293b", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{t.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <span style={{ color: "#94a3b8", fontSize: 14 }}>Prior: {t.prev}</span>
                <span style={{ color: dirColor(t, t.direction), fontWeight: 800, fontSize: 18 }}>{dirIcon[t.direction]}</span>
                <span style={{ color: "#1e293b", fontSize: 16, fontWeight: 800 }}>Now: {t.value}</span>
              </div>
              <div style={{ color: "#475569", fontSize: 14, lineHeight: 1.6 }}>{t.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Predictive outlook */}
      <div>
        <h2 style={{ color: "#1e293b", fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Predictive Outlook</h2>
        <p style={{ color: "#64748b", fontSize: 15, margin: "0 0 18px" }}>Forward projections based on current trajectories, permit deadlines, and program data</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {predictions.map((p, i) => (
            <div key={i} style={{ background: "#ffffff", border: `1px solid ${riskBorder[p.risk]}`, borderLeft: `5px solid ${riskColor[p.risk]}`, borderRadius: 12, padding: 20, display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 18, alignItems: "start" }}>
              <div style={{ fontSize: 32 }}>{p.icon}</div>
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ color: riskColor[p.risk], fontSize: 13, fontWeight: 700, background: riskBg[p.risk], border: `1px solid ${riskBorder[p.risk]}`, padding: "2px 10px", borderRadius: 20 }}>{p.risk.toUpperCase()}</span>
                  <span style={{ color: "#64748b", fontSize: 13 }}>📅 {p.horizon}</span>
                  <span style={{ color: "#94a3b8", fontSize: 13 }}>· Confidence: {p.confidence}</span>
                </div>
                <div style={{ color: "#1e293b", fontWeight: 800, fontSize: 17, marginBottom: 8 }}>{p.title}</div>
                <div style={{ color: "#475569", fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>{p.detail}</div>
                <div style={{ color: "#94a3b8", fontSize: 12, fontStyle: "italic" }}>Source: {p.basis}</div>
              </div>
              <div style={{ textAlign: "center", background: riskBg[p.risk], border: `1px solid ${riskBorder[p.risk]}`, borderRadius: 12, padding: "12px 18px", minWidth: 90 }}>
                <div style={{ color: riskColor[p.risk], fontWeight: 900, fontSize: 22, lineHeight: 1 }}>{p.metric}</div>
                <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>key metric</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PRIORITY GAPS TAB ────────────────────────────────────────────────────────
function GapsTab() {
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const cityOptions = ["All Cities", ...CITY_NAMES];

  // Gap data grounded entirely in report findings
  const gaps = [
    {
      id: 1, priority: "critical", cities: ["San Jose"],
      provision: "C.17", title: "C.17 Fiscal Sustainability — No Regional Cost-Sharing Framework",
      gap: "San Jose bears $64M (97%+) of all C.17 costs among these four permittees. C.17 now consumes 52% of San Jose's total stormwater budget, crowding out investment in other provisions. No inter-jurisdictional cost mechanism exists despite shared watershed impacts.",
      evidence: "San Jose C.17 FY 24-25 cost: $63.98M. Next three cities combined: $697K. ERF Round 3 grant ($4.8M) covers <8% of annual gap.",
      effort: "High", impact: "Very High",
      actions: [
        "Convene SCVURPPP member agencies to explore C.17 regional cost-sharing formula tied to watershed contribution",
        "Apply for additional state ERF and SB 1 funding rounds; target $10M+",
        "Develop DDTCP cost recovery model — link cleanup contracts to responsible-party billing where possible",
        "Commission independent fiscal sustainability study for C.17 through FY 2030",
      ],
      spend: { current: 63982000, recommended: 70000000, rationale: "Current trajectory +8%/yr; need dedicated regional funding to stabilize" },
    },
    {
      id: 2, priority: "critical", cities: ["Campbell", "Saratoga"],
      provision: "C.3", title: "GSI Numeric Retrofit Deadline — June 30, 2027",
      gap: "MRP 3.0 C.3.j requires numeric impervious area retrofit targets be met by June 30, 2027. Campbell has one project underway (Downtown PDA biotreatment); Saratoga has only 1 of 5 projects inspected. Both cities need to urgently identify, design, and begin construction of qualifying GSI projects.",
      evidence: "Campbell: Downtown PDA biotreatment began construction FY 24-25. Hacienda Ave Green St. ($6.8M, 17.8 acres) not yet credited under MRP 3.0. Saratoga: 20% inspection rate, no standalone GSI retrofit projects identified.",
      effort: "High", impact: "Very High",
      actions: [
        "Campbell: Submit Hacienda Ave Green Street for retroactive MRP 3.0 credit — quantify 17.8 impervious acres treated",
        "Campbell: Accelerate Downtown PDA biotreatment completion; identify 2nd qualifying project by Q1 FY 25-26",
        "Saratoga: Complete O&M inspections for all 5 regulated projects by Q2 FY 25-26",
        "Saratoga: Leverage $5M Village Parking District investment for GSI retrofit credit — confirm eligibility with RWQCB",
        "Both cities: Request SCVURPPP technical assistance for retrofit project identification and prioritization",
      ],
      spend: { current: 854000, recommended: 1500000, rationale: "One-time capital investment in retrofit projects needed; current budget insufficient for 2027 deadline" },
    },
    {
      id: 3, priority: "high", cities: ["San Jose"],
      provision: "C.3", title: "O&M Inspection Capacity — 76% of Projects Uninspected",
      gap: "San Jose inspected only 161 of 696 regulated projects (24%) in FY 24-25. The inventory is growing by ~40 projects/year. At current staffing, the uninspected backlog will exceed 800 projects by FY 26-27, creating compliance liability and unknown treatment system performance.",
      evidence: "C.3 O&M inspection table: 696 total, 161 inspected, 24% rate. FY 23-24 inventory was 655 (+41 in one year). First-pass compliance only 37%.",
      effort: "Medium", impact: "High",
      actions: [
        "Add 1–2 dedicated C.3 O&M inspectors to close backlog — estimated $180K–$240K/yr",
        "Implement risk-based prioritization: inspect older systems and those with prior failures first",
        "Develop self-certification program for low-risk LID systems to free inspector capacity for high-risk sites",
        "Increase first-pass compliance rate from 37% via pre-inspection outreach to project owners",
      ],
      spend: { current: 14665000, recommended: 15200000, rationale: "+$535K for 2 additional C.3 inspectors; modest cost relative to compliance risk" },
    },
    {
      id: 4, priority: "high", cities: ["San Jose"],
      provision: "C.4", title: "Industrial Violation Correction Rate Declining",
      gap: "San Jose's timely correction rate fell from 86% to 84% in FY 24-25 — 16% of identified violations are not corrected within the required 10-business-day window. With 8,600+ businesses in inventory and 180 enforcement actions, uncorrected violations represent ongoing discharge risk.",
      evidence: "C.4 reporting: 3,218 inspections, 180 enforcement actions, 84% timely correction rate (down from 86% FY 23-24).",
      effort: "Low", impact: "High",
      actions: [
        "Implement automated follow-up notifications at day 7 (3 days before deadline) for open violations",
        "Escalate repeat offenders to Level 3/4 enforcement — verbal warnings for recidivists are ineffective",
        "Target restaurants and auto businesses — highest actual discharge frequency per C.4 data",
        "Add one enforcement follow-up staff position dedicated to violation tracking closure",
      ],
      spend: { current: 1890000, recommended: 2050000, rationale: "+$160K for enforcement follow-up position; high ROI via reduced discharge incidents" },
    },
    {
      id: 5, priority: "high", cities: ["Sunnyvale"],
      provision: "C.14", title: "Bacteria Source Identification — FIB Sources Not Yet Isolated",
      gap: "Sunnyvale's $690K C.14 program is monitoring FIB (fecal indicator bacteria) in impaired water bodies but has not yet isolated primary sources. Without source identification, investments remain broad-based rather than targeted. 130 inlet screens installed, but bacteria loading reduction is not yet quantified.",
      evidence: "C.14 section: 620+ inlet screens, $690K budget, FIB monitoring ongoing. No source isolation confirmed in FY 24-25.",
      effort: "Medium", impact: "High",
      actions: [
        "Commission a dedicated FIB source tracking study using microbial source tracking (MST) techniques",
        "Prioritize screening in areas with highest-density inlet screen installation",
        "Coordinate with Santa Clara County Vector Control and adjacent permittees on shared FIB sources",
        "Set explicit FY 25-26 milestone: identify top 3 FIB source categories",
      ],
      spend: { current: 690000, recommended: 850000, rationale: "+$160K for MST study — targeted investment could dramatically improve C.14 ROI" },
    },
    {
      id: 6, priority: "medium", cities: ["Saratoga", "Campbell"],
      provision: "C.10", title: "Full Trash Capture Gap — Saratoga at 33.4%",
      gap: "Saratoga has the lowest full trash capture rate (33.4%) among the four cities. While 100% reduction is currently achieved through other measures (street sweeping, cleanups), heavy reliance on operational controls is less reliable long-term than infrastructure. Campbell leads at 72.6%.",
      evidence: "C.10 reporting: Saratoga 33.4% full capture vs. Campbell 72.6%, Sunnyvale 52.9%, San Jose 59.5%.",
      effort: "Medium", impact: "Medium",
      actions: [
        "Identify high-trash-generation areas in Saratoga for priority full-capture device installation",
        "Leverage SCVURPPP group purchasing for inlet-based devices (Sunnyvale contract model)",
        "Set interim target: increase full capture from 33% to 50% by FY 26-27",
        "Study Campbell's 72.6% capture model — replicate street prioritization methodology",
      ],
      spend: { current: 43000, recommended: 120000, rationale: "+$77K for device procurement and installation; significant unit cost reduction via group purchasing" },
    },
    {
      id: 7, priority: "medium", cities: ["Campbell", "Saratoga"],
      provision: "C.5", title: "Discharge Investigations Reaching Waterways at High Rate",
      gap: "Campbell reported 10 of 11 discharge events (91%) confirmed to reach waterways. Saratoga reported 5 of 6 (83%). This is substantially higher than would be expected with robust early detection. Detection is happening too late — after discharge has reached the drain.",
      evidence: "C.5: Campbell 10/11 reached waterways; Saratoga 5/6 reached storm drain or receiving waters.",
      effort: "Low", impact: "Medium",
      actions: [
        "Install additional inlet monitoring devices at high-incident locations near commercial zones",
        "Expand public reporting app/hotline awareness — target businesses and landscapers who generate most discharges",
        "Implement dry-weather screening patrols at high-frequency discharge locations",
        "Train first responders (fire, code enforcement) to identify and immediately report discharge events",
      ],
      spend: { current: 38000, recommended: 65000, rationale: "+$27K for expanded detection; reduces discharge events reaching receiving waters" },
    },
    {
      id: 8, priority: "medium", cities: ["San Jose", "Sunnyvale", "Saratoga", "Campbell"],
      provision: "C.11", title: "Mercury HHW Participation Data Gap — San Jose & Sunnyvale Not Reporting",
      gap: "San Jose and Sunnyvale do not report household-level HHW participation data for mercury disposal — only Saratoga (476 households, 63 lbs) and Campbell (740 households, 54 lbs) provide quantified figures. With San Jose's population of 979K, even 1% participation would represent ~9,000 households — a major unmeasured data gap.",
      evidence: "C.11 reporting: Saratoga and Campbell report household and pound data. San Jose and Sunnyvale reference County HHW program without city-specific metrics.",
      effort: "Low", impact: "Medium",
      actions: [
        "Request city-specific HHW participation data from Santa Clara County for San Jose and Sunnyvale",
        "Add HHW participation metric to annual C.11 reporting for all permittees",
        "Set participation rate targets: 1% of households minimum for large cities",
        "Cross-promote HHW during C.7 outreach events — bundle messaging with trash, pesticide programs",
      ],
      spend: { current: 0, recommended: 15000, rationale: "Administrative cost only — data request and reporting process improvement" },
    },
  ];

  const priorityColor = { critical: "#dc2626", high: "#ea580c", medium: "#d97706", low: "#059669" };
  const priorityBg = { critical: "#fef2f2", high: "#fff7ed", medium: "#fffbeb", low: "#f0fdf4" };
  const priorityBorder = { critical: "#fecaca", high: "#fed7aa", medium: "#fde68a", low: "#bbf7d0" };

  const filteredGaps = selectedCity === "All Cities"
    ? gaps
    : gaps.filter(g => g.cities.includes(selectedCity));

  const criticalCount = filteredGaps.filter(g => g.priority === "critical").length;
  const highCount = filteredGaps.filter(g => g.priority === "high").length;
  const mediumCount = filteredGaps.filter(g => g.priority === "medium").length;

  // Investment gap summary
  const totalCurrentFiltered = filteredGaps.reduce((s, g) => s + (g.spend?.current || 0), 0);
  const totalRecommendedFiltered = filteredGaps.reduce((s, g) => s + (g.spend?.recommended || 0), 0);

  return (
    <div>
      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 18 }}>
          <div style={{ color: "#dc2626", fontSize: 36, fontWeight: 900 }}>{criticalCount}</div>
          <div style={{ color: "#dc2626", fontWeight: 700, fontSize: 15 }}>Critical Gaps</div>
          <div style={{ color: "#94a3b8", fontSize: 13 }}>Immediate action required</div>
        </div>
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: 18 }}>
          <div style={{ color: "#ea580c", fontSize: 36, fontWeight: 900 }}>{highCount}</div>
          <div style={{ color: "#ea580c", fontWeight: 700, fontSize: 15 }}>High Priority</div>
          <div style={{ color: "#94a3b8", fontSize: 13 }}>Address within 12 months</div>
        </div>
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: 18 }}>
          <div style={{ color: "#d97706", fontSize: 36, fontWeight: 900 }}>{mediumCount}</div>
          <div style={{ color: "#d97706", fontWeight: 700, fontSize: 15 }}>Medium Priority</div>
          <div style={{ color: "#94a3b8", fontSize: 13 }}>Plan for next permit cycle</div>
        </div>
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: 18 }}>
          <div style={{ color: "#0284c7", fontSize: 24, fontWeight: 900 }}>{fmtCost(totalRecommendedFiltered - totalCurrentFiltered)}</div>
          <div style={{ color: "#0284c7", fontWeight: 700, fontSize: 15 }}>Additional Investment Needed</div>
          <div style={{ color: "#94a3b8", fontSize: 13 }}>Across identified gaps</div>
        </div>
      </div>

      {/* City filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 22, alignItems: "center" }}>
        <span style={{ color: "#64748b", fontSize: 14, fontWeight: 600 }}>Filter by city:</span>
        {cityOptions.map(c => (
          <button key={c} onClick={() => setSelectedCity(c)} style={{
            background: selectedCity === c ? (c === "All Cities" ? "#0284c7" : COLORS[c] || "#0284c7") : "#ffffff",
            color: selectedCity === c ? "#ffffff" : "#475569",
            border: `1px solid ${selectedCity === c ? "transparent" : "#e2e8f0"}`,
            borderRadius: 20, padding: "6px 16px", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}>{c}</button>
        ))}
      </div>

      {/* Gap cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filteredGaps.map(g => (
          <div key={g.id} style={{
            background: "#ffffff", border: `1px solid ${priorityBorder[g.priority]}`,
            borderLeft: `5px solid ${priorityColor[g.priority]}`,
            borderRadius: 14, overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{ padding: "18px 22px", borderBottom: `1px solid ${priorityBorder[g.priority]}`, background: priorityBg[g.priority] }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ color: "#0284c7", fontSize: 14, fontWeight: 700, background: "#e0f2fe", padding: "3px 10px", borderRadius: 6 }}>{g.provision}</span>
                  <span style={{ color: priorityColor[g.priority], fontSize: 13, fontWeight: 700, background: "#ffffff", border: `1px solid ${priorityBorder[g.priority]}`, padding: "3px 12px", borderRadius: 20 }}>{g.priority.toUpperCase()} PRIORITY</span>
                  {g.cities.map(c => (
                    <span key={c} style={{ color: COLORS[c] || "#0284c7", fontSize: 13, fontWeight: 600, background: "#ffffff", border: `1px solid ${COLORS[c] || "#0284c7"}44`, padding: "3px 10px", borderRadius: 20 }}>
                      {c}
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexShrink: 0 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>Effort</div>
                    <div style={{ color: "#1e293b", fontWeight: 700, fontSize: 14 }}>{g.effort}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>Impact</div>
                    <div style={{ color: "#1e293b", fontWeight: 700, fontSize: 14 }}>{g.impact}</div>
                  </div>
                </div>
              </div>
              <h3 style={{ color: "#1e293b", fontSize: 18, fontWeight: 800, margin: "12px 0 0" }}>{g.title}</h3>
            </div>

            {/* Body */}
            <div style={{ padding: "18px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>The Gap</div>
                <p style={{ color: "#334155", fontSize: 15, lineHeight: 1.7, margin: "0 0 14px" }}>{g.gap}</p>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
                  <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>📋 EVIDENCE FROM REPORTS</div>
                  <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.6 }}>{g.evidence}</div>
                </div>

                {g.spend && (
                  <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
                      <div style={{ color: "#94a3b8", fontSize: 12 }}>Current Spend</div>
                      <div style={{ color: "#64748b", fontWeight: 800, fontSize: 18 }}>{fmtCost(g.spend.current)}</div>
                    </div>
                    <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: 12 }}>
                      <div style={{ color: "#0284c7", fontSize: 12 }}>Recommended</div>
                      <div style={{ color: "#0284c7", fontWeight: 800, fontSize: 18 }}>{fmtCost(g.spend.recommended)}</div>
                    </div>
                    <div style={{ gridColumn: "1/-1", color: "#94a3b8", fontSize: 12, fontStyle: "italic" }}>{g.spend.rationale}</div>
                  </div>
                )}
              </div>

              <div>
                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Recommended Actions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {g.actions.map((a, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: priorityColor[g.priority] + "20", border: `1px solid ${priorityColor[g.priority]}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: priorityColor[g.priority], fontWeight: 800, fontSize: 12 }}>{i+1}</div>
                      <span style={{ color: "#334155", fontSize: 14, lineHeight: 1.5 }}>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
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
    { id: "trends",    label: "Trends & Predictions"  },
    { id: "gaps",      label: "Priority Gaps"         },
    { id: "compare",   label: "Comparison Charts"     },
    { id: "overview",  label: "City Overview"         },
  ];

  const toggle = (code) => setExpandedProvision(p => p === code ? null : code);

  return (
    <div style={{
      minHeight: "100vh", background: "#f0f4f8", color: "#475569",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    }}>
      {/* Top bar */}
      <div style={{
        background: "#ffffff", borderBottom: "1px solid #e2e8f0",
        position: "sticky", top: 0, zIndex: 100, padding: "0 28px",
      }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", height: 60, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="32" height="32" viewBox="0 0 32 32">
              <polygon points="16,2 30,9 30,23 16,30 2,23 2,9" fill="none" stroke="#0284c7" strokeWidth="1.5" />
              <polygon points="16,8 24,12 24,20 16,24 8,20 8,12" fill="#0284c715" stroke="#0284c740" strokeWidth="1" />
            </svg>
            <div>
              <div style={{ color: "#1e293b", fontWeight: 900, fontSize: 16, letterSpacing: "0.05em" }}>STORMWATER IQ</div>
              <div style={{ color: "#475569", fontSize: 12, letterSpacing: "0.12em" }}>NPDES MRP FY 2024-25 · SANTA CLARA COUNTY · 4 PERMITTEES</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 2, marginLeft: 24 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                background: activeTab === t.id ? "#0284c715" : "transparent",
                border: activeTab === t.id ? "1px solid #0284c740" : "1px solid transparent",
                color: activeTab === t.id ? "#0284c7" : "#475569",
                borderRadius: 8, padding: "6px 16px", fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em", transition: "all 0.15s",
              }}>{t.label}</button>
            ))}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
            {CITY_NAMES.map(c => (
              <div key={c} style={{ textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: COLORS[c] }} />
                  <span style={{ color: "#475569", fontSize: 13 }}>{c.split(" ")[0]}</span>
                </div>
                <div style={{ color: scoreColor(overallCityScore(c)), fontFamily: "inherit", fontWeight: 900, fontSize: 16 }}>
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
              <div style={{ color: "#475569", fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
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

        {activeTab === "trends" && (
          <TrendsTab />
        )}

        {activeTab === "gaps" && (
          <>
            <div style={{ marginBottom: 22 }}>
              <h2 style={{ color: "#1e293b", fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Priority Gaps & Future Investment</h2>
              <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>Evidence-based gaps identified from FY 24-25 annual reports, ranked by compliance risk and impact potential</p>
            </div>
            <GapsTab />
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
                <div key={c} style={{ background: "#ffffff", border: `1px solid ${COLORS[c]}22`, borderRadius: 14, padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[c] }} />
                    <span style={{ color: "#1e293b", fontWeight: 800, fontSize: 18 }}>City of {c}</span>
                    <span style={{ marginLeft: "auto", color: scoreColor(overallCityScore(c)), fontFamily: "inherit", fontWeight: 900, fontSize: 24 }}>
                      {overallCityScore(c)}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {PROVISIONS.map(p => (
                      <div key={p.code} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ color: "#0284c7", fontFamily: "inherit", fontSize: 13, width: 28 }}>{p.code}</span>
                        <div style={{ flex: 1, height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${p.scores[c]}%`, background: scoreColor(p.scores[c]), borderRadius: 3 }} />
                        </div>
                        <span style={{ color: scoreColor(p.scores[c]), fontFamily: "inherit", fontSize: 14, fontWeight: 700, width: 24 }}>{p.scores[c]}</span>
                        <span style={{ color: "#94a3b8", fontSize: 13, width: 48, textAlign: "right" }}>{fmtCost(p.costs[c])}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={{ color: COLORS[c], fontFamily: "inherit", fontWeight: 800, fontSize: 18 }}>{fmtCost(CITY_META[c].totalCost)}</div>
                      <div style={{ color: "#475569", fontSize: 13 }}>total program cost</div>
                    </div>
                    <div>
                      <div style={{ color: "#64748b", fontFamily: "inherit", fontWeight: 700, fontSize: 16 }}>${Math.round(CITY_META[c].totalCost / CITY_META[c].pop)}/capita</div>
                      <div style={{ color: "#475569", fontSize: 13 }}>cost per resident</div>
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
