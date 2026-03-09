/**
 * Pump taxonomy and pump_master.csv field definitions.
 * Form fields match backend/data/pump_master.csv columns.
 */

export const PUMP_CATEGORIES = [
  { id: 'rotodynamic', label: 'Rotodynamic Pumps (Centrifugal Family)', description: 'Most common pumps in process industries.' },
  { id: 'positive_displacement', label: 'Positive Displacement Pumps', description: 'High pressure / viscous fluids / accurate flow control.' },
  { id: 'special_industrial', label: 'Special Industrial Pumps', description: 'Application-specific pumps.' },
  { id: 'utility', label: 'Utility / Auxiliary Pumps', description: 'Vacuum, dosing, transfer, booster, circulation.' },
];

export const ROTODYNAMIC_TYPES = [
  { pumpType: 'Centrifugal Process Pump', subType: 'End Suction Overhung', standard: 'API 610 OH1 / ISO 13709, ISO 5199' },
  { pumpType: 'Centrifugal Process Pump', subType: 'Centerline Mounted', standard: 'API 610 OH2 / ISO 13709' },
  { pumpType: 'Centrifugal Pump', subType: 'Vertical In-Line', standard: 'API 610 OH3' },
  { pumpType: 'Close Coupled Pump', subType: 'Vertical Inline', standard: 'API 610 OH4' },
  { pumpType: 'Vertical Turbine Pump', subType: 'Line Shaft', standard: 'API 610 VS1' },
  { pumpType: 'Vertical Turbine Pump', subType: 'Can Type', standard: 'API 610 VS6' },
  { pumpType: 'Vertical Suspended Pump', subType: 'Single Casing', standard: 'API 610 VS2' },
  { pumpType: 'Vertical Suspended Pump', subType: 'Double Casing', standard: 'API 610 VS3' },
  { pumpType: 'Submersible Pump', subType: 'Motor Integrated', standard: 'API 610 VS4 / ISO 9906' },
  { pumpType: 'Axial Flow Pump', subType: 'Propeller Pump', standard: 'ISO 9906 / HI standards' },
  { pumpType: 'Mixed Flow Pump', subType: 'Semi-axial', standard: 'ISO 9906 / Hydraulic Institute' },
  { pumpType: 'Multistage Centrifugal Pump', subType: 'Radial Split', standard: 'API 610 BB4' },
  { pumpType: 'Multistage Centrifugal Pump', subType: 'Axially Split', standard: 'API 610 BB3' },
  { pumpType: 'Multistage Centrifugal Pump', subType: 'Barrel Pump', standard: 'API 610 BB5' },
  { pumpType: 'Single Stage Between Bearing', subType: 'Horizontal Split', standard: 'API 610 BB1' },
  { pumpType: 'Double Suction Pump', subType: 'Split Case', standard: 'API 610 BB1 / ISO 13709' },
  { pumpType: 'Canned Motor Pump', subType: 'Seal-less', standard: 'API 685' },
  { pumpType: 'Magnetic Drive Pump', subType: 'Seal-less', standard: 'API 685 / ISO 15783' },
];

export const RECIPROCATING_TYPES = [
  { pumpType: 'Reciprocating Plunger Pump', subType: 'Triplex / Quintuplex', standard: 'API 674' },
  { pumpType: 'Reciprocating Piston Pump', subType: 'Process Service', standard: 'API 674' },
  { pumpType: 'Diaphragm Metering Pump', subType: 'Controlled Flow', standard: 'API 675' },
  { pumpType: 'Hydraulic Diaphragm Pump', subType: 'Metering', standard: 'API 675' },
  { pumpType: 'Solenoid Metering Pump', subType: 'Chemical dosing', standard: 'API 675 / Manufacturer' },
  { pumpType: 'High Pressure Injection Pump', subType: 'Chemical Injection', standard: 'API 674 / API 675' },
  { pumpType: 'Mud Pump', subType: 'Drilling', standard: 'API 7K' },
  { pumpType: 'Power Pump', subType: 'High Pressure Service', standard: 'API 674' },
];

export const ROTARY_TYPES = [
  { pumpType: 'Gear Pump', subType: 'External Gear', standard: 'API 676' },
  { pumpType: 'Gear Pump', subType: 'Internal Gear', standard: 'API 676' },
  { pumpType: 'Screw Pump', subType: 'Single Screw', standard: 'API 676' },
  { pumpType: 'Screw Pump', subType: 'Twin Screw', standard: 'API 676' },
  { pumpType: 'Screw Pump', subType: 'Triple Screw', standard: 'API 676' },
  { pumpType: 'Lobe Pump', subType: 'Rotary Lobe', standard: 'API 676 / 3A / EHEDG' },
  { pumpType: 'Vane Pump', subType: 'Sliding Vane', standard: 'API 676' },
  { pumpType: 'Peristaltic Pump', subType: 'Hose Pump', standard: 'ISO / Manufacturer' },
  { pumpType: 'Progressive Cavity Pump', subType: 'Mono Pump', standard: 'API 676' },
  { pumpType: 'Circumferential Piston Pump', subType: 'Hygienic', standard: '3A / EHEDG' },
  { pumpType: 'Flexible Impeller Pump', subType: 'Hygienic', standard: '3A / Manufacturer' },
];

export const SPECIAL_INDUSTRIAL_TYPES = [
  { pumpType: 'Cryogenic Pump', subType: 'LNG / LOX', standard: 'API 610 / API 685' },
  { pumpType: 'Boiler Feed Pump', subType: 'Power plants', standard: 'API 610 BB5 / ISO 13709' },
  { pumpType: 'Condensate Extraction Pump', subType: 'Steam cycle', standard: 'API 610 VS1' },
  { pumpType: 'Fire Water Pump', subType: 'Fire protection', standard: 'NFPA 20' },
  { pumpType: 'Sewage Pump', subType: 'Wastewater', standard: 'ISO 9906 / Hydraulic Institute' },
  { pumpType: 'Slurry Pump', subType: 'Mining / abrasive', standard: 'ISO 5199 / Manufacturer' },
  { pumpType: 'Desalination Pump', subType: 'RO system', standard: 'ISO / Manufacturer' },
  { pumpType: 'Cooling Water Pump', subType: 'Utility', standard: 'ISO 9906' },
  { pumpType: 'Bitumen Pump', subType: 'Heavy hydrocarbons', standard: 'API 676' },
  { pumpType: 'Asphalt Pump', subType: 'High viscosity', standard: 'API 676' },
  { pumpType: 'Chemical Process Pump', subType: 'Corrosive service', standard: 'ISO 2858 / ISO 5199' },
  { pumpType: 'Sanitary Pump', subType: 'Food/pharma', standard: '3A / EHEDG / FDA' },
];

export const UTILITY_TYPES = [
  { pumpType: 'Vacuum Pump (Liquid Ring)', subType: '-', standard: 'API 681' },
  { pumpType: 'Vacuum Pump (Dry Screw)', subType: '-', standard: 'Manufacturer' },
  { pumpType: 'Dosing Pump', subType: '-', standard: 'API 675' },
  { pumpType: 'Transfer Pump', subType: '-', standard: 'ISO 2858 / API 610' },
  { pumpType: 'Booster Pump', subType: '-', standard: 'ISO / Manufacturer' },
  { pumpType: 'Circulation Pump', subType: '-', standard: 'ISO / Manufacturer' },
];

export function getTypesByCategory(categoryId) {
  switch (categoryId) {
    case 'rotodynamic': return ROTODYNAMIC_TYPES;
    case 'positive_displacement': return [...RECIPROCATING_TYPES, ...ROTARY_TYPES];
    case 'special_industrial': return SPECIAL_INDUSTRIAL_TYPES;
    case 'utility': return UTILITY_TYPES;
    default: return [];
  }
}

/**
 * All pump_master.csv columns as form fields (id = CSV column name).
 */
export const PUMP_MASTER_FIELDS = [
  { id: 'pump_id', label: 'Pump ID', type: 'text', required: true, placeholder: 'e.g. PU-201A' },
  { id: 'pump_type', label: 'Pump Type', type: 'text', required: true, placeholder: 'e.g. Centrifugal' },
  { id: 'pump_type_detail', label: 'Pump Type Detail', type: 'text', required: false, placeholder: 'e.g. BB' },
  { id: 'manufacturer', label: 'Manufacturer', type: 'text', required: false, placeholder: 'e.g. Generic' },
  { id: 'model', label: 'Model', type: 'text', required: false, placeholder: 'e.g. PU201-Series' },
  { id: 'installation_date', label: 'Installation Date', type: 'date', required: false, placeholder: 'YYYY-MM-DD' },
  { id: 'rated_power_kw', label: 'Rated Power (kW)', type: 'number', required: false, placeholder: 'e.g. 22', min: 0 },
  { id: 'rated_flow_m3h', label: 'Rated Flow (m³/h)', type: 'number', required: false, placeholder: 'e.g. 190', min: 0 },
  { id: 'rated_head_m', label: 'Rated Head (m)', type: 'number', required: false, placeholder: 'e.g. 65', min: 0 },
  { id: 'flow_range_min_m3h', label: 'Flow Range Min (m³/h)', type: 'number', required: false, placeholder: 'e.g. 70', min: 0 },
  { id: 'flow_range_max_m3h', label: 'Flow Range Max (m³/h)', type: 'number', required: false, placeholder: 'e.g. 240', min: 0 },
  { id: 'head_range_min_m', label: 'Head Range Min (m)', type: 'number', required: false, placeholder: 'e.g. 35', min: 0 },
  { id: 'head_range_max_m', label: 'Head Range Max (m)', type: 'number', required: false, placeholder: 'e.g. 85', min: 0 },
  { id: 'rated_rpm', label: 'Rated RPM', type: 'number', required: false, placeholder: 'e.g. 1450', min: 0 },
  { id: 'seal_type', label: 'Seal Type', type: 'text', required: false, placeholder: 'e.g. Single_Mechanical' },
  { id: 'bearing_type_de', label: 'Bearing Type DE', type: 'text', required: false, placeholder: 'e.g. Roller' },
  { id: 'bearing_type_nde', label: 'Bearing Type NDE', type: 'text', required: false, placeholder: 'e.g. Roller' },
  { id: 'impeller_type', label: 'Impeller Type', type: 'text', required: false, placeholder: 'e.g. Closed' },
  { id: 'location', label: 'Location', type: 'text', required: false, placeholder: 'e.g. Process_Unit_2' },
  { id: 'criticality_level', label: 'Criticality Level', type: 'text', required: false, placeholder: 'e.g. High' },
  { id: 'serial_number', label: 'Serial Number', type: 'text', required: false, placeholder: 'e.g. PU220510A' },
  { id: 'warranty_expiry', label: 'Warranty Expiry', type: 'date', required: false, placeholder: 'YYYY-MM-DD' },
  { id: 'last_overhaul', label: 'Last Overhaul', type: 'date', required: false, placeholder: 'YYYY-MM-DD' },
  { id: 'min_safe_flow_m3h', label: 'Min Safe Flow (m³/h)', type: 'number', required: false, placeholder: 'e.g. 60', min: 0 },
  { id: 'max_safe_flow_m3h', label: 'Max Safe Flow (m³/h)', type: 'number', required: false, placeholder: 'e.g. 210', min: 0 },
  { id: 'max_motor_load_kw', label: 'Max Motor Load (kW)', type: 'number', required: false, placeholder: 'e.g. 24', min: 0 },
  { id: 'max_suction_pressure_bar', label: 'Max Suction Pressure (bar)', type: 'number', required: false, placeholder: 'e.g. 3.5', min: 0 },
  { id: 'efficiency_bep_percent', label: 'Efficiency at BEP (%)', type: 'number', required: false, placeholder: 'e.g. 84', min: 0, max: 100 },
  { id: 'npshr_m', label: 'NPSHr (m)', type: 'number', required: false, placeholder: 'e.g. 3.8', min: 0 },
  { id: 'health_score', label: 'Health Score', type: 'number', required: false, placeholder: 'e.g. 82', min: 0, max: 100 },
];
