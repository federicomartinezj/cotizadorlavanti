import { useState, useMemo, useCallback, useRef, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════
// UniMac OPL Laundry Designer — Diseñador Profesional de Lavanderías
// Hoteleras Industriales LATAM
// Engineering formulas from Alliance Laundry Systems technical docs
// ══════════════════════════════════════════════════════════════════

// ─── COMPLETE UniMac Washer-Extractor Catalog (2025 LATAM Price Sheet) ───
// series: "UC" = Hardmount (1.0 ciclo/hr), "UYC"/"UY" = Softmount (1.0 ciclo/hr), "UW" = Pocket Hardmount (1.1 ciclo/hr)
// cyclesHr: ciclos prácticos por hora (incluye carga, descarga, transferencia)
// price_usd: List price FCA (Solution 1 / UniLinc Touch where available)
// water_gal/hot_water_gal: from consumption data where available; estimated for UC/UY based on capacity ratio
const WASHERS = [
  // ── UC Series Hardmount (100-200 G-Force) ──
  { id:"UC020",model:"UC020",series:"UC",cap_lb:20,cap_kg:9,gForce:200,cyclesHr:1.0,water_gal:22,hot_water_gal:14,elec_kw:0.15,frame_m2:0.42,hose_mm:19,hose_qty:2,price_usd:8311 },
  { id:"UC030",model:"UC030",series:"UC",cap_lb:30,cap_kg:14,gForce:200,cyclesHr:1.0,water_gal:33,hot_water_gal:22,elec_kw:0.20,frame_m2:0.42,hose_mm:19,hose_qty:2,price_usd:11402 },
  { id:"UC040",model:"UC040",series:"UC",cap_lb:40,cap_kg:18,gForce:200,cyclesHr:1.0,water_gal:44,hot_water_gal:29,elec_kw:0.25,frame_m2:0.50,hose_mm:19,hose_qty:2,price_usd:14625 },
  { id:"UC060",model:"UC060",series:"UC",cap_lb:60,cap_kg:27,gForce:200,cyclesHr:1.0,water_gal:55,hot_water_gal:36,elec_kw:0.30,frame_m2:0.56,hose_mm:19,hose_qty:2,price_usd:19558 },
  { id:"UC080",model:"UC080",series:"UC",cap_lb:80,cap_kg:36,gForce:200,cyclesHr:1.0,water_gal:73,hot_water_gal:48,elec_kw:0.38,frame_m2:0.72,hose_mm:25,hose_qty:2,price_usd:28042 },
  { id:"UC100",model:"UC100",series:"UC",cap_lb:100,cap_kg:45,gForce:165,cyclesHr:1.0,water_gal:90,hot_water_gal:59,elec_kw:0.45,frame_m2:0.72,hose_mm:25,hose_qty:2,price_usd:33331 },
  // ── UYC Series Softmount Small (400-500 G-Force) ──
  { id:"UYC065",model:"UYC065",series:"UYC",cap_lb:15,cap_kg:6.5,gForce:500,cyclesHr:1.0,water_gal:18,hot_water_gal:12,elec_kw:6,frame_m2:0.38,hose_mm:19,hose_qty:2,price_usd:8553 },
  { id:"UYC080",model:"UYC080",series:"UYC",cap_lb:20,cap_kg:7.5,gForce:500,cyclesHr:1.0,water_gal:22,hot_water_gal:14,elec_kw:6,frame_m2:0.38,hose_mm:19,hose_qty:2,price_usd:9922 },
  { id:"UYC105",model:"UYC105",series:"UYC",cap_lb:25,cap_kg:10.5,gForce:500,cyclesHr:1.0,water_gal:28,hot_water_gal:18,elec_kw:9,frame_m2:0.42,hose_mm:19,hose_qty:2,price_usd:12364 },
  { id:"UYC135",model:"UYC135",series:"UYC",cap_lb:30,cap_kg:13.5,gForce:460,cyclesHr:1.0,water_gal:33,hot_water_gal:22,elec_kw:12,frame_m2:0.42,hose_mm:19,hose_qty:2,price_usd:14638 },
  { id:"UYC180",model:"UYC180",series:"UYC",cap_lb:40,cap_kg:18,gForce:460,cyclesHr:1.0,water_gal:44,hot_water_gal:29,elec_kw:12,frame_m2:0.50,hose_mm:19,hose_qty:2,price_usd:18603 },
  { id:"UYC240",model:"UYC240",series:"UYC",cap_lb:55,cap_kg:24,gForce:450,cyclesHr:1.0,water_gal:55,hot_water_gal:36,elec_kw:18,frame_m2:0.56,hose_mm:19,hose_qty:2,price_usd:25725 },
  { id:"UYC280",model:"UYC280",series:"UYC",cap_lb:65,cap_kg:28,gForce:400,cyclesHr:1.0,water_gal:60,hot_water_gal:39,elec_kw:21.9,frame_m2:0.60,hose_mm:19,hose_qty:2,price_usd:29727 },
  // ── UY Series Softmount Large (350-360 G-Force) ──
  { id:"UY350",model:"UY350",series:"UY",cap_lb:77,cap_kg:35,gForce:360,cyclesHr:1.0,water_gal:75,hot_water_gal:49,elec_kw:24,frame_m2:0.80,hose_mm:25,hose_qty:2,price_usd:34360 },
  { id:"UY450",model:"UY450",series:"UY",cap_lb:100,cap_kg:45,gForce:360,cyclesHr:1.0,water_gal:95,hot_water_gal:62,elec_kw:36,frame_m2:0.95,hose_mm:25,hose_qty:2,price_usd:41906 },
  { id:"UY600",model:"UY600",series:"UY",cap_lb:132,cap_kg:60,gForce:360,cyclesHr:1.0,water_gal:125,hot_water_gal:82,elec_kw:54,frame_m2:1.10,hose_mm:32,hose_qty:2,price_usd:54195 },
  { id:"UY800",model:"UY800",series:"UY",cap_lb:180,cap_kg:80,gForce:350,cyclesHr:1.0,water_gal:170,hot_water_gal:111,elec_kw:67.5,frame_m2:1.30,hose_mm:32,hose_qty:3,price_usd:65427 },
  { id:"UY1000",model:"UY1000",series:"UY",cap_lb:230,cap_kg:100,gForce:350,cyclesHr:1.0,water_gal:210,hot_water_gal:137,elec_kw:67.5,frame_m2:1.50,hose_mm:32,hose_qty:3,price_usd:72200 },
  { id:"UY1200",model:"UY1200",series:"UY",cap_lb:275,cap_kg:120,gForce:350,cyclesHr:1.0,water_gal:250,hot_water_gal:163,elec_kw:67.5,frame_m2:1.70,hose_mm:32,hose_qty:3,price_usd:78360 },
  // ── UW Series Pocket Hardmount (200-400 G-Force) — datos de consumo reales ──
  { id:"UW045",model:"UW045",series:"UW",cap_lb:45,cap_kg:20.4,gForce:400,cyclesHr:1.1,water_gal:66,hot_water_gal:43,elec_kw:0.301,frame_m2:0.75,hose_mm:19,hose_qty:2,price_usd:21266 },
  { id:"UW065",model:"UW065",series:"UW",cap_lb:65,cap_kg:29.5,gForce:400,cyclesHr:1.1,water_gal:72,hot_water_gal:47,elec_kw:0.345,frame_m2:0.75,hose_mm:19,hose_qty:2,price_usd:23925 },
  { id:"UW085",model:"UW085",series:"UW",cap_lb:85,cap_kg:38.6,gForce:300,cyclesHr:1.1,water_gal:98,hot_water_gal:65,elec_kw:0.445,frame_m2:1.09,hose_mm:25,hose_qty:2,price_usd:35847 },
  { id:"UW105",model:"UW105",series:"UW",cap_lb:105,cap_kg:47.6,gForce:300,cyclesHr:1.1,water_gal:112,hot_water_gal:74,elec_kw:0.514,frame_m2:1.09,hose_mm:25,hose_qty:2,price_usd:38860 },
  { id:"UW130",model:"UW130",series:"UW",cap_lb:130,cap_kg:59,gForce:300,cyclesHr:1.1,water_gal:133,hot_water_gal:90,elec_kw:0.640,frame_m2:1.33,hose_mm:32,hose_qty:2,price_usd:45160 },
  { id:"UW160",model:"UW160",series:"UW",cap_lb:160,cap_kg:72.6,gForce:300,cyclesHr:1.1,water_gal:156,hot_water_gal:107,elec_kw:0.744,frame_m2:1.33,hose_mm:32,hose_qty:2,price_usd:50182 },
  { id:"UW200",model:"UW200",series:"UW",cap_lb:200,cap_kg:90.7,gForce:200,cyclesHr:1.1,water_gal:194,hot_water_gal:131,elec_kw:0.801,frame_m2:1.33,hose_mm:32,hose_qty:2,price_usd:56180 },
];

// ─── COMPLETE UniMac Tumble Dryer Catalog (2025 LATAM Price Sheet + consumption data) ───
// price_usd: Solution 2 (UniLinc Touch, Stainless Cylinder) or best available
const DRYERS = [
  // ── Stacked (2-pocket) ──
  { id:"UxT30",model:"UxT30",cap_lb:30,cap_kg:14,type:"Stack",dry_min:25.3,btu:30577,kwh_gas:8.96,eff_btu_lb:1870,removal_kg_min:0.29,price_usd:15373 },
  { id:"UxT45",model:"UxT45",cap_lb:45,cap_kg:20,type:"Stack",dry_min:28,btu:44300,kwh_gas:12.98,eff_btu_lb:1822,removal_kg_min:0.39,price_usd:17863 },
  // ── Singles (Axial airflow) ──
  { id:"Ux030",model:"Ux030",cap_lb:30,cap_kg:14,type:"Single",dry_min:27,btu:31919,kwh_gas:9.36,eff_btu_lb:1967,removal_kg_min:0.27,price_usd:7598 },
  { id:"Ux055",model:"Ux055",cap_lb:55,cap_kg:25,type:"Single",dry_min:27.5,btu:49133,kwh_gas:14.4,eff_btu_lb:1761,removal_kg_min:0.46,price_usd:8896 },
  // ── Singles (Radial airflow) ──
  { id:"Ux075",model:"Ux075",cap_lb:75,cap_kg:35,type:"Single",dry_min:29,btu:77408,kwh_gas:22.69,eff_btu_lb:1934,removal_kg_min:0.63,price_usd:10734 },
  { id:"UxF75",model:"UxF75",cap_lb:75,cap_kg:34,type:"Single",dry_min:29,btu:77408,kwh_gas:22.69,eff_btu_lb:1934,removal_kg_min:0.63,price_usd:11055 },
  { id:"Ux120",model:"Ux120",cap_lb:120,cap_kg:50,type:"Single",dry_min:33,btu:129435,kwh_gas:37.94,eff_btu_lb:2024,removal_kg_min:0.88,price_usd:18644 },
  { id:"Ux170",model:"Ux170",cap_lb:170,cap_kg:77,type:"Single",dry_min:29.5,btu:174809,kwh_gas:51.24,eff_btu_lb:1923,removal_kg_min:1.4,price_usd:25270 },
  { id:"Ux200",model:"Ux200",cap_lb:200,cap_kg:90,type:"Single",dry_min:31.5,btu:202764,kwh_gas:59.43,eff_btu_lb:1888,removal_kg_min:1.55,price_usd:35219 },
  // ── Heat Pump (ventless) ──
  { id:"UHP250",model:"UHP250",cap_lb:28,cap_kg:12.5,type:"HeatPump",dry_min:45,btu:0,kwh_gas:0,eff_btu_lb:0,removal_kg_min:0.22,price_usd:15898 },
  { id:"UHP285",model:"UHP285",cap_lb:31,cap_kg:14,type:"HeatPump",dry_min:45,btu:0,kwh_gas:0,eff_btu_lb:0,removal_kg_min:0.25,price_usd:16650 },
  { id:"UHP345",model:"UHP345",cap_lb:37,cap_kg:17,type:"HeatPump",dry_min:45,btu:0,kwh_gas:0,eff_btu_lb:0,removal_kg_min:0.30,price_usd:16853 },
];

// ─── COMPLETE UniMac Ironer Catalog (2025 LATAM Price Sheet + consumption data) ───
// elec_heat_kwh = consumo eléctrico TOTAL cuando calentamiento es eléctrico (resistencias)
// motor_kw = consumo eléctrico real cuando calentamiento es a GAS (solo motor cilindro ~1.5kW + ventilador ~1kW)
// Chest Heated (I-series): solo eléctricos, motor_kw ≈ potencia total ya que no hay quemador
// Cylinder Heated (FCU): electric/gas/steam — motor_kw es solo motores cuando gas
const IRONERS = [
  // ── Chest Heated Roll Ironers (I-series, electric only) ──
  { id:"I18_120",model:"I18-120 VT",output_kg_hr:25,elec_heat_kwh:3.5,motor_kw:3.5,gas_m3h:0,steam_kg_h:null,width_mm:1200,rolls:1,type:"chest",price_usd:4580 },
  { id:"I18_140",model:"I18-140 VT",output_kg_hr:30,elec_heat_kwh:4.0,motor_kw:4.0,gas_m3h:0,steam_kg_h:null,width_mm:1400,rolls:1,type:"chest",price_usd:5192 },
  { id:"I25_120",model:"I25-120 VT",output_kg_hr:35,elec_heat_kwh:5.5,motor_kw:5.5,gas_m3h:0,steam_kg_h:null,width_mm:1200,rolls:1,type:"chest",price_usd:5295 },
  { id:"I25_140",model:"I25-140 VT",output_kg_hr:40,elec_heat_kwh:6.0,motor_kw:6.0,gas_m3h:0,steam_kg_h:null,width_mm:1400,rolls:1,type:"chest",price_usd:5861 },
  { id:"I25_140A",model:"I25-140 AVT",output_kg_hr:42,elec_heat_kwh:6.5,motor_kw:6.5,gas_m3h:0,steam_kg_h:null,width_mm:1400,rolls:1,type:"chest",price_usd:7025 },
  { id:"I30_160",model:"I30-160",output_kg_hr:48,elec_heat_kwh:9.0,motor_kw:9.0,gas_m3h:0,steam_kg_h:null,width_mm:1600,rolls:1,type:"chest",price_usd:9060 },
  { id:"I30_160A",model:"I30-160 AV",output_kg_hr:50,elec_heat_kwh:9.5,motor_kw:9.5,gas_m3h:0,steam_kg_h:null,width_mm:1600,rolls:1,type:"chest",price_usd:10153 },
  { id:"I30_200A",model:"I30-200 AV",output_kg_hr:55,elec_heat_kwh:11.0,motor_kw:11.0,gas_m3h:0,steam_kg_h:null,width_mm:2000,rolls:1,type:"chest",price_usd:11000 },
  // ── Cylinder Heated FCU 320mm (small) ──
  { id:"FCU1664_3",model:"FCU 1664/320",output_kg_hr:62,elec_heat_kwh:21.4,motor_kw:2.5,gas_m3h:2.62,steam_kg_h:null,width_mm:1664,rolls:1,type:"cylinder",price_usd:16311 },
  { id:"FCU2080_3",model:"FCU 2080/320",output_kg_hr:72,elec_heat_kwh:27.3,motor_kw:2.5,gas_m3h:3.13,steam_kg_h:null,width_mm:2080,rolls:1,type:"cylinder",price_usd:17643 },
  // ── Cylinder Heated FCU 500mm (medium) ──
  { id:"FCU2100_5",model:"FCU 2100/500",output_kg_hr:80,elec_heat_kwh:32.3,motor_kw:2.5,gas_m3h:3.74,steam_kg_h:49,width_mm:2100,rolls:1,type:"cylinder",price_usd:35654 },
  { id:"FCU2700_5",model:"FCU 2700/500",output_kg_hr:95,elec_heat_kwh:46.9,motor_kw:3.0,gas_m3h:5.52,steam_kg_h:68,width_mm:2700,rolls:1,type:"cylinder",price_usd:44111 },
  { id:"FCU3300_5",model:"FCU 3300/500",output_kg_hr:120,elec_heat_kwh:56.1,motor_kw:3.0,gas_m3h:6.89,steam_kg_h:88,width_mm:3300,rolls:1,type:"cylinder",price_usd:45980 },
  // ── Cylinder Heated FCU 800mm (large, 2-roll) ──
  { id:"FCU3186_8",model:"FCU 3186/800",output_kg_hr:195,elec_heat_kwh:31,motor_kw:4.0,gas_m3h:11.4,steam_kg_h:190,width_mm:3186,rolls:2,type:"cylinder",price_usd:87424 },
  // ── Cylinder with Rear Return (FCUR 500mm) ──
  { id:"FCUR2000",model:"FCUR 2000/500",output_kg_hr:80,elec_heat_kwh:32.3,motor_kw:2.5,gas_m3h:3.74,steam_kg_h:49,width_mm:2000,rolls:1,type:"cylinder",price_usd:42006 },
  { id:"FCUR2600",model:"FCUR 2600/500",output_kg_hr:95,elec_heat_kwh:46.9,motor_kw:3.0,gas_m3h:5.52,steam_kg_h:68,width_mm:2600,rolls:1,type:"cylinder",price_usd:50274 },
  { id:"FCUR3200",model:"FCUR 3200/500",output_kg_hr:120,elec_heat_kwh:56.1,motor_kw:3.0,gas_m3h:6.89,steam_kg_h:88,width_mm:3200,rolls:1,type:"cylinder",price_usd:52111 },
  // ── Cylinder with Length Folder (FCUF 500mm) ──
  { id:"FCUF2000",model:"FCUF 2000/500",output_kg_hr:80,elec_heat_kwh:32.3,motor_kw:2.5,gas_m3h:3.74,steam_kg_h:49,width_mm:2000,rolls:1,type:"cylinder_folder",price_usd:51695 },
  { id:"FCUF2600",model:"FCUF 2600/500",output_kg_hr:95,elec_heat_kwh:46.9,motor_kw:3.0,gas_m3h:5.52,steam_kg_h:68,width_mm:2600,rolls:1,type:"cylinder_folder",price_usd:60584 },
  { id:"FCUF3200",model:"FCUF 3200/500",output_kg_hr:120,elec_heat_kwh:56.1,motor_kw:3.0,gas_m3h:6.89,steam_kg_h:88,width_mm:3200,rolls:1,type:"cylinder_folder",price_usd:66602 },
  // ── Cylinder with Folder + Feeder (FCUFF 500mm) ──
  { id:"FCUFF2600",model:"FCUFF 2600/500",output_kg_hr:95,elec_heat_kwh:46.9,motor_kw:3.5,gas_m3h:5.52,steam_kg_h:68,width_mm:2600,rolls:1,type:"cylinder_ff",price_usd:115920 },
  { id:"FCUFF3200",model:"FCUFF 3200/500",output_kg_hr:120,elec_heat_kwh:56.1,motor_kw:3.5,gas_m3h:6.89,steam_kg_h:88,width_mm:3200,rolls:1,type:"cylinder_ff",price_usd:122786 },
];

// ─── Space Allocation (from Milnor Sizing doc - sq.ft per lb/day) ───
const SPACE_FACTORS = {
  admin: { factor: 0.0167, pct: 2.78, label: "Administración" },
  employee: { factor: 0.0311, pct: 5.19, label: "Empleados (baños, comedor)" },
  mechanical: { factor: 0.0791, pct: 13.19, label: "Cuarto mecánico" },
  nonProduction: { factor: 0.0496, pct: 8.26, label: "No-producción (costura, inventario)" },
  dock: { factor: 0.0188, pct: 3.13, label: "Muelle de carga" },
  soiledStorage: { factor: 0.0925, pct: 15.42, label: "Almacén ropa sucia" },
  processing: { factor: 0.2639, pct: 43.99, label: "Área de procesamiento" },
  cleanStorage: { factor: 0.0482, pct: 8.04, label: "Almacén ropa limpia" },
  total: { factor: 0.6000, pct: 100, label: "TOTAL" },
};

// ─── Hotel Linen Weights (from Milnor task info, converted to kg) ───
const LINEN_ITEMS = [
  { id:"sheet_single",cat:"Ropa de cama",label:"Sábana Individual",lb:1.25,kg:0.567,classification:"flatwork" },
  { id:"sheet_double",cat:"Ropa de cama",label:"Sábana Doble",lb:1.75,kg:0.794,classification:"flatwork" },
  { id:"sheet_queen",cat:"Ropa de cama",label:"Sábana Queen",lb:2.00,kg:0.907,classification:"flatwork" },
  { id:"sheet_king",cat:"Ropa de cama",label:"Sábana King",lb:2.25,kg:1.021,classification:"flatwork" },
  { id:"pillowcase",cat:"Ropa de cama",label:"Funda de Almohada",lb:0.30,kg:0.136,classification:"flatwork" },
  { id:"mattress_cover",cat:"Ropa de cama",label:"Protector Colchón",lb:2.75,kg:1.247,classification:"full-dry" },
  { id:"bedspread",cat:"Ropa de cama",label:"Cubrecama",lb:3.50,kg:1.588,classification:"full-dry" },
  { id:"blanket",cat:"Ropa de cama",label:"Cobija/Manta",lb:3.75,kg:1.701,classification:"full-dry" },
  { id:"bath_towel",cat:"Toallas",label:"Toalla de Baño",lb:0.60,kg:0.272,classification:"full-dry" },
  { id:"hand_towel",cat:"Toallas",label:"Toalla de Manos",lb:0.20,kg:0.091,classification:"full-dry" },
  { id:"washcloth",cat:"Toallas",label:"Toalla Facial",lb:0.05,kg:0.023,classification:"full-dry" },
  { id:"bath_mat",cat:"Toallas",label:"Tapete de Baño",lb:1.50,kg:0.680,classification:"full-dry" },
  { id:"bathrobe",cat:"Toallas",label:"Bata de Baño",lb:3.00,kg:1.361,classification:"full-dry" },
  { id:"pool_towel",cat:"Piscina/Spa",label:"Toalla Piscina (grande)",lb:3.00,kg:1.361,classification:"full-dry" },
  { id:"spa_towel",cat:"Piscina/Spa",label:"Toalla Spa",lb:2.00,kg:0.907,classification:"full-dry" },
  { id:"tablecloth_54",cat:"F&B",label:'Mantel 54"',lb:0.88,kg:0.399,classification:"flatwork" },
  { id:"tablecloth_72",cat:"F&B",label:'Mantel 72"',lb:1.15,kg:0.522,classification:"flatwork" },
  { id:"tablecloth_90",cat:"F&B",label:'Mantel 90"',lb:2.20,kg:0.998,classification:"flatwork" },
  { id:"napkin",cat:"F&B",label:'Servilleta 20"',lb:0.10,kg:0.045,classification:"flatwork" },
  { id:"chef_coat",cat:"Uniformes",label:"Filipina Chef",lb:0.65,kg:0.295,classification:"full-dry" },
  { id:"chef_pants",cat:"Uniformes",label:"Pantalón Chef",lb:1.15,kg:0.522,classification:"full-dry" },
  { id:"apron_bib",cat:"Uniformes",label:"Delantal Bib",lb:0.45,kg:0.204,classification:"full-dry" },
  { id:"kitchen_shirt",cat:"Uniformes",label:"Camisa Cocina",lb:0.49,kg:0.222,classification:"full-dry" },
  { id:"dish_towel",cat:"Uniformes",label:"Trapo de Cocina",lb:0.10,kg:0.045,classification:"full-dry" },
  { id:"dust_mop_24",cat:"Limpieza",label:'Mopa Polvo 24"',lb:1.00,kg:0.454,classification:"full-dry" },
  { id:"wet_mop",cat:"Limpieza",label:"Trapeador Húmedo",lb:0.20,kg:0.091,classification:"full-dry" },
];

// ─── Plumbing sizes reference (from section 1) ───
const PLUMBING_SIZES = {
  1: { main_mm: 32, hotcold_mm: 25 },
  2: { main_mm: 50, hotcold_mm: 32 },
  3: { main_mm: 50, hotcold_mm: 38 },
  4: { main_mm: 64, hotcold_mm: 50 },
};

const COUNTRY = { code:"CO",name:"Colombia",flag:"🇨🇴",currency:"COP",voltage:"220V/440V 3φ",gasType:"Gas Natural",waterTemp_C:16 };

// Product images embedded as base64 (120px thumbnails from UniMac)
const IMG_UW_SM = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4QC8RXhpZgAASUkqAAgAAAAGABIBAwABAAAAAQAAABoBBQABAAAAVgAAABsBBQABAAAAXgAAACgBAwABAAAAAgAAABMCAwABAAAAAQAAAGmHBAABAAAAZgAAAAAAAABIAAAAAQAAAEgAAAABAAAABgAAkAcABAAAADAyMTABkQcABAAAAAECAwAAoAcABAAAADAxMDABoAMAAQAAAP//AAACoAQAAQAAAFgCAAADoAQAAQAAAJoDAAAAAAAA/9sAQwANCQoLCggNCwoLDg4NDxMgFRMSEhMnHB4XIC4pMTAuKS0sMzpKPjM2RjcsLUBXQUZMTlJTUjI+WmFaUGBKUVJP/9sAQwEODg4TERMmFRUmTzUtNU9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09P/8AAEQgAuAB4AwERAAIRAQMRAf/EABsAAQACAwEBAAAAAAAAAAAAAAAFBgMEBwIB/8QAPRAAAQMCBAMEBwUGBwAAAAAAAQACAwQRBQYSITFBURMiYXEyUmKBkbHBFCOhstEVFiVCQ6ImM1NjkuHw/8QAFwEBAQEBAAAAAAAAAAAAAAAAAAECA//EABoRAQEAAwEBAAAAAAAAAAAAAAABAhExAxL/2gAMAwEAAhEDEQA/AOnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgwVlXFSRa5DudmtHFxQQb8UrHRmUzCMbmzWAgD3hBHMzZJrtFV08x46HtsfoUEhSZupnODKyF0V9tbDqb+vzQWQbi4QEBAQEBAQEBAQamIYhDQRapDd7vQYDuf+kHN8ZxSqqs7YdFNMeyDmOEY2FzqQWZ29ObdCg3312EGBo7alc5thpkbY252DlOcbl+rdqnmGSmhrXPjMbYtLSNFrHx2UuUx6uPnl6ZfOLpEZDo2uabggEFac9aekBAQEBAQEAmwuUBBUs3u7Ovhfy7ID+4oICKliqMRbUtiMlTpDGEC5A8PHfignW9qyEMfC8PBIINhzQRNfHM8SbDvejdx7u3gR5oIqVkZkZraNbRYXFlLjL1ZbOOss9AeSqPqAgICAgICCl5mxWplx+HCmHRAx7C+x3kJ338B0QUCpxrEjiD4hXSACfQADYgarckEljL8TjxRlG2tml1AWMji4Dc9UF1wymbh9GI7kyOH3jzxcfH9EHyol2KCJqZOKCKqHB1wdwgsGFZuqxCKaeJk0oIayV79PHYXsN/qguNDUGqoopy0NMjQbBBnQEBAQEBBQ8ehJzgZeQdGf7QggcfqcNimdFS4fSvqr3dKYx3T9SgZap5Ja19fVuc9zPRLje7jz9w+aCzyVIDSXOAAFyTyQQs+OR6gIYHVEr/8uIGwI9Zx6II+WtxOR1pHULSeELbD6XQIGS1DCZGCAjjrd3T5FBhqWRRPaYpzI9puSG2aD7+KI6PlDEm4hgkbSAJae0TwPAbH3j6oqcQEBAQEBBTc1Ds6isnaQHtjBaehtsgo8NI5x9FznHiepQW7D6VkTHttdrXaR7rKpWWakhqI5IpGu0HY2cQibVKZopaZ8kQLRO5wDuegcBdRpGsbK2obJAbP4XAuR4joUEiyKaPQyYlw2Iu65FuXkgsNK/tqZp0NFhwA49FphIZXf9lzHPAPQqYtVh6zf/FStRdFFEBAQEBBXMdiilqZWTW0HTdBDSzUNNG4M03sbWQe8HmFTholHHtXA/gqzW0GXkJtu03HwRENLUYhJhs0ofTksDmvvFwIuCjWlTp5NLGuLiHDiR1UVuwVHbVEYaXOcXAb+aCyYbqNOxttgABsqykcJj/xJTOaLaWuB28ClWLkoogICAgIKfm2ZjDWa3WDGNd8ACgpH7QZ/Tj1ePFBMYJJqMLGBzNWtxbuOn1ugmailllp3tjkex/FpDiN0FYlb2HbU1XJJFTTP1dpv9zJzDhzaUGEZernR6qdjZmu9F8bgWlB7pqMYe/S5wqK123Zxm4hbzJPC9uCC04fEJKKN+h7Q4Xs7mOCu2dJfBaYnEHTOHoMP47D6qLFgRRAQEBAQUDNM4Zj9Q0gHus4j2QgihVWG1h5BBv087hLRFtPJITC92oDj3+F/IE/BBYoDHPE2WI6muFwUGCtwqGrBJ7klragL3HQjmghTlOziI2xBp4hsj2A+4IJGiy/FAzRJo7PiYom2a4+0Tu7y4IJV7WRsLnbNCCRwphbA9zhZznXI6bbBBuoCAgICAg5zm1hdmSoPss/KEESIigt2AjThMIuefPxKDLJTywSunoS27t3wuNmv8QeRQemYrTB2ipLqWT1Zhp+DuB+KDaFTAW6hNER11hBjNdBu2Emd/qxd74ngPeUH2Jkj3iWpLQ4bsjabtZ435nx5cuqCWw8Dsnkc3XPwCDaQEBAQEBBzrNsgbmSoB9Vn5QgihO2yC0YLJfDIT5/MoN/Wg+OeHNLXAEdCLhBg7GjDrilgv17Nv6IMwmDRYWAHIcED7QOqCXwh+umcfb+gQbyAgICAgXHVByzO8unNNUAf5Y/yhBBCc9UFywKX+EU/kfmUEj2qD4XoMTnlBhdKQgxOqSOaCzZZk7TDpHf7pH4BBMICAgIPEhIaSEFbxbGHUZOo2CDnGYMSjrcakla+5exvxAtZBoB6C7YC7+D0/kfmUEhqQNaDyXoPLiCgwviDuCCzZUYWYZID/rH5BBNoCAgIPhFxZBXsw4QKumeALkhByHFMPkpql0T2lsjT3b/AMw/VBqRVBB0ybEcyg6BgBP7EpTyLT+YoN4ysbxe0eZCDG6piH9RvxQYJcQp42lznkgdGkoIabN1Cx5Y2Cpcb+qB9UGzhOYqKuqhDUiWmDiA12zroOl4TTR0tHoilMjXHVqItxQbqAgICAg+OaHCxCCt5iytT4rC4tAbIODgg5niWVMYhnLG4fNM4HZ8bbhw8UH2DJ+aKhjWNopo2DgJJQ0D3XQWXCsjYrGwfaHwMPOxLkE9Fk5wH3tX/wAWoM/7m0Tm2llldfxsg8x5CwFrtTqXWfacSg36bK+DUzg6KhhaRz0oJdjGxtDWAADkEHpAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEH/2Q==";
const IMG_UW_LG = "data:image/jpeg;base64,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";
const IMG_UW_XL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4QC8RXhpZgAASUkqAAgAAAAGABIBAwABAAAAAQAAABoBBQABAAAAVgAAABsBBQABAAAAXgAAACgBAwABAAAAAgAAABMCAwABAAAAAQAAAGmHBAABAAAAZgAAAAAAAABIAAAAAQAAAEgAAAABAAAABgAAkAcABAAAADAyMTABkQcABAAAAAECAwAAoAcABAAAADAxMDABoAMAAQAAAP//AAACoAQAAQAAAFgCAAADoAQAAQAAAEkDAAAAAAAA/9sAQwANCQoLCggNCwoLDg4NDxMgFRMSEhMnHB4XIC4pMTAuKS0sMzpKPjM2RjcsLUBXQUZMTlJTUjI+WmFaUGBKUVJP/9sAQwEODg4TERMmFRUmTzUtNU9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09P/8AAEQgAqAB4AwERAAIRAQMRAf/EABsAAQADAAMBAAAAAAAAAAAAAAAEBQYCAwcB/8QAPBAAAQMDAQQHBQYEBwAAAAAAAQACAwQFERIGITFBExQiUWFxwSMygZGhBxVCUrHRJXKC8DRTYmNzk/H/xAAWAQEBAQAAAAAAAAAAAAAAAAAAAQL/xAAbEQEBAQACAwAAAAAAAAAAAAAAEQECEiFRYf/aAAwDAQACEQMRAD8A9OQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBBwmmjgidJK8MY0ZJJQULL994s6a3SDq+XNDwN7iDjO9BFbcL4XExU9S6Pfh5axzXD4HKLFhZb1NXVT6WpgayRjS7U3dwOMEfFEXaAgICAgICAgICAgyd3nkqjWQOdk6ZI2DkNxCCJs1Quttqio5ZGPezU5xbwGTwQSaq6VVI0RRBj2MILexk/Mf3vRc2OvZnpn7STyOc1sZicQwDOckc1nM2/Grx6yefbZLTAgICAgICAgp7zeDQuMMLcyhmtzncAP7CDMWb7QKm41D4XUcLC1mvUHE53geqCZXbazUtO94o43OHDDyg5WSlnuURuFfG6Jsri4Rk73eJxw8kFpOyJjcNjYAOGGhBS1pYc5a35IK6luMtrrOsUwaTjS5ruBHpwQbG27RW+4QtPSiKYuDTE89rJ7u8eKC3QEBAQEBAQZLajs1sryN3QD1QYuSWht+ZIYI2SuGMMGCR+yBYKaa/wB5ayoJbTQ+0lA3DGdw8yfVB6U+ZrGBjAGtaMADgAgp7hcqeAOM0zGBvvFx4eHifAIM9U3unkz0bZi385jw0/VBE1uqgTE0uHeOA+KDrZUvt08U0MjHyscHhoJIB8TzRHqtrr4rnb4ayD3JW5xzaeYPkUVKQEBAQEBBj9tpBFBVvBHSdX7LeZO9B51HTSSHVKcuPFBtNlqbqdBI5re3K/Lj4Abh/fehU65VVTFRyvp4XyzAdhoGd/f5IlY9hAiFTUO6WZ2SzXv0g/ix3nj4DCKi9emY5znPdIeTXHLfiP2wg+xXKWeoDZ34JOdw7JHMaeHBBeustM9gLJJDqGQQRhWM1cfZ7VPZJWW2QnsnpWjuOcO9FGm3QEBAQEBBltqKQ1M0jGe86Noz4ZKCjh2fAbl5QWlDp6A6eGtyrOvtQQIZy4lrejOXAZLRg7wOaIzdTao5onVFPPJICdOHMxjG5RtnKgGN7mHi1BEEwjmaXNOQ4EY78oN/asut8OrfgFvyJHoqzrt2bYYtr3adwc14PyB9FFxvkUQEBAQEGfvs7KeoklkIDWRBxJ5DJQUh2hoh+PKCNQ1borfLJA9rm9KcahnidyJE6tlqGQSujYx2BgggnLef0QjLuuNdRUj3ROY5hIbM1zchj8Y1eAcMFFZ2onfI9z3nLnHJKD7bqXrFR0rm+yiIc9x3DPJvmT6lB6Jb6d0NJEw78N94bxnmfnlVhP2dpSby+oI91jj88BRtrEBAQEBAQZTaOWNt1McjWuBibkOGQd5QVTup4/w0H/W39kH1sFO6WlDHsYw6XyxgYA7RDSeQzv8APCC+6v4IKO5WCXpDPQHS4ggtwDkcwQdzm+HJBRi0NMmmptMAd3h0gB/pQXFNYjNGyN0OiJpyMs0Mb/KziT4n68EF5HRMjjbGxuGtGAEFnZogyOV4HvOGPIILJAQEBAQEGD2xeRfgB/kt/UoKfW7HFBrbLQ0strhmkha6SWLS8nmMlB3te6gxHVOLoODJzyHc/u8+BQTQAQCMEHgRzQfceaD4Q0AkkADiTyQdbcVHuj2X5ju1+Xh4oJ9I0APwOJCCQgICAgICDz3bWUM2hA/2Gfq5BS9ZGEG1sU4+5qXf+D1KCyEwIwcYKCMKOFpJpZJaYneRE7sn+k5H0QchHUDjXOI/4WZQchHHkGRz5SOHSHIHw4IO3ph3oJdC7Ux58UEpAQEBB8duCClulxdSgngAg852juXXrp0wdnEbW/LKCsEx70G6scx+5qXf+D1KCwE5HNBzFTjmg5iqB4lAM2eBQdT5yEFtYpOkglPc/H0QWaAgICAgq7tQCpgcMZyEHkV6oKm2Vr2TBz43Oy1xG/8A9/VBAD+BByDwKDd2N38Gpf5PUoLDUg4l5QdTp2s957R5lBDmvtvpyRLXQtI5asn6IOpu1FrfIIxVAk89Jx80G5sEeijc/UxwkdqBac7sILRAQEBAQCMjBQU17sNNdKd0cjBkjig8wu2yl2t1S4QUstTGTucwZz5+Pig5UlBts6nZBS0k8UbBhuWNbgeZQXdu2Y2qkGa6p05/NLn9EF3FsjUke2rB8ASgkN2NpiPazyO8sBB1j7P7GX6pYXyH/U8oJkGxthgILLfFkd4ygvIII4IxHEwNaOAAQdiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIP/2Q==";
const IMG_DRYER = IMG_UW_SM; // placeholder until dryer images uploaded
const IMG_IRONER = IMG_UW_SM; // placeholder until ironer images uploaded

const SERIES_IMG = {
  UW: IMG_UW_SM, UC: IMG_UW_SM, UY: IMG_UW_LG, UYC: IMG_UW_SM,
  Single: IMG_DRYER, Stack: IMG_DRYER, "Heat Pump": IMG_DRYER,
  chest: IMG_IRONER, cylinder: IMG_IRONER, cylinder_folder: IMG_IRONER, cylinder_ff: IMG_IRONER,
};
// Size-specific images for UW washers
const getImg = (item, tab) => {
  if (tab === "washers") {
    if (item.series === "UW" && item.cap_lb >= 160) return IMG_UW_XL;
    if (item.series === "UW" && item.cap_lb >= 105) return IMG_UW_LG;
    return SERIES_IMG[item.series] || IMG_UW_SM;
  }
  if (tab === "dryers") return SERIES_IMG[item.type] || IMG_DRYER;
  return SERIES_IMG[item.type] || IMG_IRONER;
};

const HOTEL_PRESETS = [
  { label:"Boutique (30-60 hab)",type:"boutique",rooms:45,stars:4,occ:0.72,fb_covers:60,spa:false,pool:false,lbPerRoom:10 },
  { label:"Business (80-150 hab)",type:"business",rooms:120,stars:4,occ:0.75,fb_covers:180,spa:false,pool:true,lbPerRoom:10 },
  { label:"Resort (150-300 hab)",type:"resort_med",rooms:225,stars:5,occ:0.78,fb_covers:400,spa:true,pool:true,lbPerRoom:12 },
  { label:"Gran Resort (300-600)",type:"chain_lg",rooms:450,stars:5,occ:0.80,fb_covers:800,spa:true,pool:true,lbPerRoom:12 },
  { label:"Mega Resort (600+)",type:"mega",rooms:750,stars:5,occ:0.82,fb_covers:1500,spa:true,pool:true,lbPerRoom:12 },
  { label:"Personalizado",type:"resort_med",rooms:100,stars:4,occ:0.75,fb_covers:120,spa:false,pool:false,lbPerRoom:10 },
];

const STEPS = ["Hotel","Carga","Equipos","Ingeniería","Resumen","Cotización"];

const fmt = (n,d=0) => Number(n).toLocaleString("es-MX",{minimumFractionDigits:d,maximumFractionDigits:d});
const fmtUSD = n => "$"+fmt(n,0)+" USD";

// ─── Chevron Icon ───
const Chev = ({d}) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{d==="l"?<polyline points="15 18 9 12 15 6"/>:<polyline points="9 18 15 12 9 6"/>}</svg>;
const Check = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const Info = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;

export default function UniMacOPLDesigner() {
  const [step, setStep] = useState(0);
  const [preset, setPreset] = useState(2);
  const [hotel, setHotel] = useState({...HOTEL_PRESETS[2]});
  const [opHours, setOpHours] = useState(16);
  const [opDays, setOpDays] = useState(7);
  const [hotWaterTemp, setHotWaterTemp] = useState(60);
  const [hovZone, setHovZone] = useState(null);
  const ref = useRef(null);
  // Custom equipment overrides (null = use recommendation)
  const [customWashers, setCustomWashers] = useState(null); // [{id,qty},...] 
  const [customDryers, setCustomDryers] = useState(null);
  const [customIroner, setCustomIroner] = useState(null); // {id,qty} or null
  const [catalogTab, setCatalogTab] = useState("washers"); // "washers"|"dryers"|"ironers"
  const [seriesFilter, setSeriesFilter] = useState("all"); // "all"|"UC"|"UYC"|"UY"|"UW"

  const cc = COUNTRY;

  const changePreset = useCallback(i => {
    setPreset(i);
    setHotel({...HOTEL_PRESETS[i]});
  },[]);

  useEffect(()=>{if(ref.current) ref.current.scrollTop=0},[step]);

  // ════════ CORE ENGINEERING CALCULATIONS ════════

  const eng = useMemo(() => {
    const h = hotel;
    const opHrsWeek = opHours * opDays;

    // ── 1. TASK DEFINITION (from Milnor formula) ──
    // lbs/room/day × rooms × 7 × occupancy / operating_hrs_week
    const lbPerDay = h.lbPerRoom * h.rooms * h.occ;
    const lbPerWeek = lbPerDay * 7;
    const lbPerHr = lbPerWeek / opHrsWeek;
    const kgPerDay = lbPerDay * 0.4536;
    const kgPerHr = lbPerHr * 0.4536;
    const kgPerWeek = lbPerWeek * 0.4536;

    // ── 2. WASHER SELECTION ──
    // Lógica de campo para OPL hotelero:
    // 150-300 kg/día → 1 lavadora de 40-60 lb
    // 300-600 kg/día → 2 lavadoras del mismo tamaño (2×40lb o 2×60lb)
    // 600-1500 kg/día → 2 grandes + 1 pequeña (ej: 2×105lb + 1×45lb)
    // 1500+ kg/día → múltiples grandes (UW130-200) + 1 mediana complemento
    // Se usa cap_kg × 0.85 (factor carga) × cyclesHr × horas_op × días_op para calcular kg/semana por máquina
    const kgPerWeekPerMachine = (w) => w.cap_kg * 0.85 * w.cyclesHr * opHours * opDays;

    // Filtrar lavadoras OPL relevantes (desde UC040 / 18kg en adelante)
    const oplWashers = WASHERS.filter(w => w.cap_kg >= 14);
    // Subconjuntos por tamaño
    const smallW = oplWashers.filter(w => w.cap_lb >= 40 && w.cap_lb <= 65); // 40-65 lb
    const mediumW = oplWashers.filter(w => w.cap_lb >= 85 && w.cap_lb <= 130); // 85-130 lb
    const largeW = oplWashers.filter(w => w.cap_lb >= 130 && w.cap_lb <= 200); // 130-200 lb

    let washerConfig = []; // array of { model, qty, ...washerData }
    const kgWeek = kgPerWeek; // total kg por semana a procesar

    if (kgPerDay <= 300) {
      // ── Pequeño: 1 lavadora 40-60 lb ──
      let pick = smallW.find(w => kgPerWeekPerMachine(w) >= kgWeek) || smallW[smallW.length-1];
      washerConfig = [{ ...pick, qty: 1 }];
    } else if (kgPerDay <= 600) {
      // ── Mediano: 2 lavadoras del mismo tamaño ──
      let pick = smallW.find(w => kgPerWeekPerMachine(w) * 2 >= kgWeek);
      if (!pick) pick = mediumW.find(w => kgPerWeekPerMachine(w) * 2 >= kgWeek) || mediumW[mediumW.length-1];
      washerConfig = [{ ...pick, qty: 2 }];
    } else if (kgPerDay <= 1500) {
      // ── Grande: 2 grandes + 1 pequeña para cargas incompletas ──
      // Buscar la grande que con 2 unidades cubra ~80% de la demanda
      let bigPick = mediumW.find(w => kgPerWeekPerMachine(w) * 2 >= kgWeek * 0.75);
      if (!bigPick) bigPick = largeW.find(w => kgPerWeekPerMachine(w) * 2 >= kgWeek * 0.75) || mediumW[mediumW.length-1];
      // Complemento: lavadora pequeña para el restante y cargas parciales
      const remainKgWeek = Math.max(0, kgWeek - kgPerWeekPerMachine(bigPick) * 2);
      let smallPick = smallW.find(w => kgPerWeekPerMachine(w) >= remainKgWeek) || smallW[0];
      washerConfig = [{ ...bigPick, qty: 2 }, { ...smallPick, qty: 1 }];
    } else {
      // ── Muy grande (1500+ kg/día): múltiples grandes + 1 mediana complemento ──
      // Usar las más grandes disponibles para evacuar volumen
      const biggest = largeW.length > 0 ? largeW[largeW.length-1] : oplWashers[oplWashers.length-1];
      const bigQty = Math.floor(kgWeek / kgPerWeekPerMachine(biggest));
      const remainKgWeek = kgWeek - kgPerWeekPerMachine(biggest) * bigQty;
      // Complemento mediano
      let compPick = mediumW.find(w => kgPerWeekPerMachine(w) >= remainKgWeek);
      if (!compPick) compPick = smallW.find(w => kgPerWeekPerMachine(w) >= remainKgWeek) || smallW[smallW.length-1];
      washerConfig = [{ ...biggest, qty: Math.max(1, bigQty) }];
      if (remainKgWeek > 0) washerConfig.push({ ...compPick, qty: 1 });
    }

    // Consolidar: usar el primer (más grande) como "bestWasher" para cálculos de ingeniería
    const bestWasher = washerConfig[0];
    const washersNeeded = washerConfig.reduce((sum, w) => sum + w.qty, 0);
    const practicalCyclesHr = bestWasher.cyclesHr;
    const wKgHr = bestWasher.cap_kg * 0.85 * practicalCyclesHr;
    const totalWasherCap_kg = washerConfig.reduce((sum, w) => sum + w.cap_kg * w.qty, 0);
    const totalWasherCap_lb = washerConfig.reduce((sum, w) => sum + w.cap_lb * w.qty, 0);

    // ── 3. DRYER SELECTION ──
    // Ratio 1:1 por cada grupo de lavadoras
    // Secadora ~1.2× capacidad de la lavadora correspondiente
    const gasDryers = DRYERS.filter(d => d.type === "Single");
    let dryerConfig = washerConfig.map(wg => {
      const targetKg = wg.cap_kg * 1.2;
      let pick = gasDryers.find(d => d.cap_kg >= targetKg * 0.85) || gasDryers[gasDryers.length-1];
      return { ...pick, qty: wg.qty };
    });
    const bestDryer = dryerConfig[0];
    const dryersNeeded = dryerConfig.reduce((sum, d) => sum + d.qty, 0);
    const dKgHr = bestDryer.removal_kg_min * 60;

    // ── 4. FLATWORK IRONER ──
    // Flatwork es ~40% de ropa hotelera (sábanas, fundas, manteles)
    // Ancho mínimo del rodillo según tipo de hotel:
    // - Hoteles económicos/budget (Ibis, etc.): 2000mm — sábanas dobladas a la mitad
    // - Hoteles cadena con King beds: 3000mm+ — planchado sin doblar
    // - Resorts grandes: 3200mm+ para volumen
    const flatworkKgHr = kgPerHr * 0.40;
    const stdIroners = IRONERS.filter(ir => ir.type === "cylinder");
    let bestIroner = null;
    if (flatworkKgHr > 20) {
      // Determinar ancho mínimo según tipo de hotel
      // hotelType from preset: "boutique","business","resort_med","chain_lg","mega"
      const hotelType = h.type || "resort_med";
      const minWidth = (hotelType === "boutique" || hotelType === "business") ? 1600 : 
                        (hotelType === "resort_med") ? 2000 : 
                        3000; // chain_lg, mega → King beds, necesitan 3m
      // Filtrar por ancho mínimo Y output suficiente
      const validIroners = stdIroners.filter(ir => ir.width_mm >= minWidth);
      for (const ir of validIroners) {
        if (ir.output_kg_hr >= flatworkKgHr) { bestIroner = ir; break; }
      }
      if (!bestIroner && validIroners.length > 0) bestIroner = validIroners[validIroners.length-1];
      if (!bestIroner) { // fallback si no hay de ese ancho
        for (const ir of stdIroners) {
          if (ir.output_kg_hr >= flatworkKgHr) { bestIroner = ir; break; }
        }
        if (!bestIroner) bestIroner = stdIroners[stdIroners.length-1];
      }
    }

    // ── CUSTOM OVERRIDES ──
    // Si el usuario ha personalizado la selección, usar esa en lugar de la recomendada
    if (customWashers && customWashers.length > 0) {
      washerConfig = customWashers.map(cw => {
        const w = WASHERS.find(x => x.id === cw.id);
        return w ? { ...w, qty: cw.qty } : null;
      }).filter(Boolean);
      if (washerConfig.length === 0) washerConfig = [{ ...bestWasher, qty: 1 }];
    }
    if (customDryers && customDryers.length > 0) {
      dryerConfig = customDryers.map(cd => {
        const d = DRYERS.find(x => x.id === cd.id);
        return d ? { ...d, qty: cd.qty } : null;
      }).filter(Boolean);
      if (dryerConfig.length === 0) dryerConfig = [{ ...bestDryer, qty: 1 }];
    }
    if (customIroner) {
      bestIroner = IRONERS.find(x => x.id === customIroner.id) || bestIroner;
    }

    // Recalcular totales con config final (sea recomendada o custom)
    const finalWasher = washerConfig[0];
    const finalWashersNeeded = washerConfig.reduce((s, w) => s + w.qty, 0);
    const finalTotalWasherCap_kg = washerConfig.reduce((s, w) => s + w.cap_kg * w.qty, 0);
    const finalTotalWasherCap_lb = washerConfig.reduce((s, w) => s + w.cap_lb * w.qty, 0);
    const finalDryer = dryerConfig[0];
    const finalDryersNeeded = dryerConfig.reduce((s, d) => s + d.qty, 0);
    // ── 5. LABOR ──
    // Factor de productividad: 25 kg/hr por persona (estándar OPL hotelero)
    // Rango real: 20-30 kg/hr/persona según ancho de rodillo y cantidad de máquinas
    const productivityKgHrPerson = 25;
    const ftePerShift = Math.ceil(kgPerHr / productivityKgHrPerson);
    const shifts = opHours <= 8 ? 1 : opHours <= 16 ? 2 : 3;
    const totalFTE = ftePerShift * shifts;

    // ══════════════════════════════════════════════
    // ENGINEERING OUTPUTS
    // ══════════════════════════════════════════════

    // ── A. SPACE (m²) ──
    // Formula: lbs processed/day × 0.6 sq.ft = total sq.ft (from Milnor doc)
    // Adjusted for operating days: if 7 days, load is spread more so use daily
    const lbProcessedPerOpDay = lbPerWeek / opDays;
    const totalSqFt = lbProcessedPerOpDay * 0.6;
    const totalM2 = totalSqFt * 0.0929;
    const spaceBreakdown = Object.entries(SPACE_FACTORS).map(([k,v]) => ({
      key: k,
      label: v.label,
      sqft: lbProcessedPerOpDay * v.factor,
      m2: lbProcessedPerOpDay * v.factor * 0.0929,
      pct: v.pct,
    }));

    // ── B. WATER SUPPLY ──
    // Calcular agua sumando por cada línea de lavadoras (puede haber mezcla de modelos)
    let totalWaterLPH = 0, hotWaterLPH = 0;
    for (const wg of washerConfig) {
      const wpc = wg.water_gal * 3.785;
      const hwpc = wg.hot_water_gal * 3.785;
      totalWaterLPH += wpc * wg.cyclesHr * wg.qty;
      hotWaterLPH += hwpc * wg.cyclesHr * wg.qty;
    }
    const totalWaterM3H = totalWaterLPH / 1000;
    const totalWaterM3Day = totalWaterM3H * opHours;

    // Peak flow: largest machine fill OR 1/3 of all machines
    const biggestWasherFill_L = finalWasher.water_gal * 3.785;
    const peakFlowOption1_LPM = biggestWasherFill_L;
    const peakFlowOption2_LPM = (biggestWasherFill_L * finalWashersNeeded) / 3;
    const peakFlow_LPM = Math.max(peakFlowOption1_LPM, peakFlowOption2_LPM);

    // Pipe sizing (from Alliance plumbing table)
    const pipeLookup = PLUMBING_SIZES[Math.min(finalWashersNeeded, 4)] || PLUMBING_SIZES[4];
    const mainPipe_mm = pipeLookup.main_mm;
    const branchPipe_mm = pipeLookup.hotcold_mm;
    const mainPipe_in = mainPipe_mm / 25.4;
    const branchPipe_in = branchPipe_mm / 25.4;

    // ── C. DRAINAGE ──
    const maxDump_L = biggestWasherFill_L * finalWashersNeeded;
    const maxDump_m3 = maxDump_L / 1000;
    const trenchWidth_mm = finalWashersNeeded <= 2 ? 305 : 457;
    const trenchDepth_mm = finalWashersNeeded <= 3 ? 305 : 457;
    const trenchLength_m = maxDump_L / (trenchWidth_mm/1000 * trenchDepth_mm/1000 * 1000);
    const outletDiam_mm = finalWashersNeeded <= 1 ? 76 : finalWashersNeeded <= 2 ? 102 : finalWashersNeeded <= 4 ? 152 : 203;
    const outletDiam_in = outletDiam_mm / 25.4;
    const dailyDischarge_m3 = totalWaterM3Day * 0.95;

    // ── D. ELECTRICAL ──
    // Sumar por cada línea de lavadoras
    let washerKW = 0;
    for (const wg of washerConfig) { washerKW += wg.elec_kw * wg.cyclesHr * wg.qty; }
    // Sumar por cada línea de secadoras
    let dryerKW = 0;
    for (const dg of dryerConfig) { dryerKW += (dg.kwh_gas / dg.dry_min * 60 * 0.1) * dg.qty; }
    // Ironer: solo motores (cilindro ~1.5kW + ventilador ~1kW) cuando calentamiento es a gas
    // NO usar elec_heat_kwh que es el consumo total con calentamiento eléctrico por resistencias
    const ironerKW = bestIroner ? bestIroner.motor_kw : 0; // motor_kw = consumo real con gas
    // Ancillary: pumps, compressors, lights, HVAC ~ 30% of equipment
    const ancillaryKW = (washerKW + dryerKW + ironerKW) * 0.30;
    const totalKW = washerKW + dryerKW + ironerKW + ancillaryKW;
    // KVA = kW / power factor (typically 0.85)
    const totalKVA = totalKW / 0.85;
    // Recommended transformer with 25% reserve
    const transformerKVA = totalKVA * 1.25;
    // Standard transformer sizes
    const stdTransformers = [30,45,75,112.5,150,225,300,500,750,1000,1500,2000];
    const recommendedTransformer = stdTransformers.find(t => t >= transformerKVA) || stdTransformers[stdTransformers.length-1];

    // ── E. GAS ──
    // Sumar BTU por cada línea de secadoras
    let dryerBTU_hr = 0;
    for (const dg of dryerConfig) { dryerBTU_hr += (dg.btu / dg.dry_min * 60) * dg.qty; }
    // Hot water heating: Formula from Milnor doc
    // BTU/hr = gallons/hr × 8.33 × (HWT - IWT) / efficiency
    const incomingTemp_F = cc.waterTemp_C * 9/5 + 32;
    const hotWaterTemp_F = hotWaterTemp * 9/5 + 32;
    const hotWaterBTU_hr = (hotWaterLPH * 0.2642) * 8.33 * (hotWaterTemp_F - incomingTemp_F) / 0.85;
    // Ironer gas
    const ironerBTU_hr = bestIroner ? bestIroner.gas_m3h * 35315 : 0; // m³/h × ~35315 BTU/m³ natural gas
    const totalBTU_hr = dryerBTU_hr + hotWaterBTU_hr + ironerBTU_hr;
    const totalTherms_hr = totalBTU_hr / 100000;
    // Gas meter sizing: m³/h = BTU/hr / 35315 (natural gas) or /91630 per gallon LP
    const gasM3H = totalBTU_hr / 35315; // natural gas
    // Gas pressure: standard 2-7" WC (water column) residential, 2 PSI commercial
    const gasPressure_kPa = 14; // ~2 PSI standard commercial
    // Gas meter size based on m³/h
    const gasMeterSizes = [{max:6,size:"G4"},{max:10,size:"G6"},{max:16,size:"G10"},{max:25,size:"G16"},{max:40,size:"G25"},{max:65,size:"G40"},{max:100,size:"G65"},{max:160,size:"G100"},{max:250,size:"G160"},{max:400,size:"G250"}];
    const recommendedMeter = gasMeterSizes.find(m => m.max >= gasM3H)?.size || "G250+";
    // Gas pipe diameter
    const gasPipeSizes = [{max:5,mm:25},{max:12,mm:32},{max:25,mm:40},{max:50,mm:50},{max:100,mm:65},{max:200,mm:80},{max:400,mm:100}];
    const gasPipe_mm = gasPipeSizes.find(p => p.max >= gasM3H)?.mm || 100;

    // ── F. EXHAUST/VENTILATION (from Alliance Section 9 - Tumble Dryers) ──
    // Datos reales de CFM y ductos por modelo (60Hz):
    const DRYER_EXHAUST = {
      // model_pattern: { cfm, duct_individual_mm, duct_individual_in, makeup_sqin }
      25:  { cfm:500, duct_mm:152, duct_in:6, makeup_sqin:110 },
      30:  { cfm:500, duct_mm:152, duct_in:6, makeup_sqin:110 },
      35:  { cfm:650, duct_mm:203, duct_in:8, makeup_sqin:144 },
      55:  { cfm:700, duct_mm:203, duct_in:8, makeup_sqin:144 },
      75:  { cfm:920, duct_mm:203, duct_in:8, makeup_sqin:195 },
      120: { cfm:1600, duct_mm:254, duct_in:10, makeup_sqin:360 },
      170: { cfm:2450, duct_mm:305, duct_in:12, makeup_sqin:525 },
      200: { cfm:2450, duct_mm:305, duct_in:12, makeup_sqin:525 },
    };
    // Tabla de ducto colector (manifold) por número de secadoras (Station A→L)
    // Columnas: [25-30lb, 35-75lb, T45/F75/120lb, 170lb, 200lb] en mm
    const MANIFOLD_TABLE = [
      // Station A (1 dryer individual)
      [152, 203, 254, 305, 305],
      // Station B (collector after 2 dryers)
      [254, 305, 381, 432, 432],
      // Station C (3 dryers)
      [305, 381, 457, 533, 533],
      // Station D (4 dryers)
      [356, 432, 533, 610, 610],
    ];

    // Buscar datos de exhaust del dryer principal
    const dryerLbKey = [25,30,35,55,75,120,170,200].reduce((best,k) => 
      Math.abs(k - finalDryer.cap_lb) < Math.abs(best - finalDryer.cap_lb) ? k : best, 75);
    const exhData = DRYER_EXHAUST[dryerLbKey] || DRYER_EXHAUST[75];
    
    // CFM y ducto individual por secadora
    const exhaustCFM_each = exhData.cfm;
    const ductDiam_mm_each = exhData.duct_mm;
    const ductDiam_in_each = exhData.duct_in;
    
    // Total CFM todas las secadoras
    const totalExhaustCFM = exhaustCFM_each * finalDryersNeeded;
    
    // Ducto colector (manifold) si hay más de 1 secadora
    const manifoldCol = dryerLbKey <= 30 ? 0 : dryerLbKey <= 75 ? 1 : dryerLbKey <= 120 ? 2 : dryerLbKey <= 170 ? 3 : 4;
    const manifoldRow = Math.min(finalDryersNeeded - 1, MANIFOLD_TABLE.length - 1);
    const mainDuct_diam_mm = finalDryersNeeded <= 1 ? ductDiam_mm_each : MANIFOLD_TABLE[manifoldRow][manifoldCol];
    const mainDuct_diam_in = Math.round(mainDuct_diam_mm / 25.4);
    
    // Makeup air
    const makeupAir_sqin_each = exhData.makeup_sqin;
    const totalMakeupAir_sqin = makeupAir_sqin_each * finalDryersNeeded;
    const totalMakeupAir_sqcm = totalMakeupAir_sqin * 6.452;
    const makeupAir_CFM = totalExhaustCFM;
    const makeupAir_m3h = makeupAir_CFM * 1.699;
    
    const maxDuctLength_m = 4.3;
    const elbowEquiv_m = (ductDiam_in_each * 1.7 * 25.4) / 1000;
    const minDuctVelocity_fpm = 1200;

    // ── G. BOILER (if steam) ──
    // BHP = BTU/hr output / 33500
    const boilerBHP = hotWaterBTU_hr / 33500;
    const boilerBHP_sized = boilerBHP / 0.70; // 70% efficiency factor
    const steamPressure_psi = 100; // standard laundry

    return {
      lbPerDay, lbPerHr, kgPerDay, kgPerHr, kgPerWeek, lbPerWeek,
      washerConfig, dryerConfig,
      recWasherConfig: [{ ...bestWasher, qty: washersNeeded }], // recommendation for reference
      recDryerConfig: [{ ...bestDryer, qty: dryersNeeded }],
      washersNeeded: finalWashersNeeded, totalWasherCap_kg: finalTotalWasherCap_kg,
      dryersNeeded: finalDryersNeeded,
      ironer: bestIroner, flatworkKgHr,
      ftePerShift, totalFTE, shifts, productivityKgHrPerson,
      space: { totalSqFt, totalM2, breakdown: spaceBreakdown },
      water: { totalWaterLPH, hotWaterLPH, totalWaterM3H, totalWaterM3Day, peakFlow_LPM, mainPipe_mm, mainPipe_in: mainPipe_in.toFixed(1), branchPipe_mm, branchPipe_in: branchPipe_in.toFixed(1) },
      drain: { maxDump_L, maxDump_m3, trenchWidth_mm, trenchDepth_mm, trenchLength_m, outletDiam_mm, outletDiam_in, dailyDischarge_m3 },
      electrical: { washerKW, dryerKW, ironerKW, ancillaryKW, totalKW, totalKVA, transformerKVA, recommendedTransformer },
      gas: { dryerBTU_hr, hotWaterBTU_hr, ironerBTU_hr, totalBTU_hr, totalTherms_hr, gasM3H, gasPressure_kPa, recommendedMeter, gasPipe_mm },
      exhaust: { ductDiam_in_each, ductDiam_mm_each, mainDuct_diam_in, mainDuct_diam_mm, totalExhaustCFM, exhaustCFM_each, makeupAir_CFM, makeupAir_m3h, makeupAir_sqin_each, totalMakeupAir_sqin, totalMakeupAir_sqcm, maxDuctLength_m, elbowEquiv_m, minDuctVelocity_fpm, dryersWithDuct: finalDryersNeeded },
      boiler: { boilerBHP, boilerBHP_sized, steamPressure_psi },
    };
  }, [hotel, opHours, opDays, hotWaterTemp, customWashers, customDryers, customIroner]);

  // ════════ RENDER STEPS ════════

  const renderStep0 = () => (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div>
        <label style={S.label}>Tipo de Hotel</label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:6}}>
          {HOTEL_PRESETS.map((p,i)=>(
            <button key={i} onClick={()=>changePreset(i)} style={{...S.chip,...(preset===i?S.chipOn:{}),textAlign:"left",padding:"8px 12px"}}>
              <div style={{fontWeight:600,fontSize:12}}>{p.label}</div>
              {i<5&&<div style={{fontSize:10,opacity:.6}}>{"★".repeat(p.stars)} · {p.lbPerRoom} lb/hab/día</div>}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        <div><label style={S.label}>Habitaciones</label>
          <input type="number" value={hotel.rooms} onChange={e=>setHotel(p=>({...p,rooms:+e.target.value}))} style={S.input}/></div>
        <div><label style={S.label}>Ocupación (%)</label>
          <input type="number" value={Math.round(hotel.occ*100)} onChange={e=>setHotel(p=>({...p,occ:+e.target.value/100}))} style={S.input} min={30} max={100}/></div>
        <div><label style={S.label}>lb/hab/día</label>
          <select value={hotel.lbPerRoom} onChange={e=>setHotel(p=>({...p,lbPerRoom:+e.target.value}))} style={S.input}>
            <option value={8}>8 (Budget)</option>
            <option value={10}>10 (Estándar)</option>
            <option value={12}>12 (Lujo)</option>
            <option value={15}>15 (Resort playa)</option>
            <option value={22}>22 (Beach resort max)</option>
          </select></div>
        <div><label style={S.label}>Horas operación/día</label>
          <input type="number" value={opHours} onChange={e=>setOpHours(Math.max(8,Math.min(24,+e.target.value)))} style={S.input}/></div>
        <div><label style={S.label}>Días/semana</label>
          <input type="number" value={opDays} onChange={e=>setOpDays(Math.max(5,Math.min(7,+e.target.value)))} style={S.input}/></div>
        <div><label style={S.label}>Temp. agua caliente °C</label>
          <input type="number" value={hotWaterTemp} onChange={e=>setHotWaterTemp(+e.target.value)} style={S.input} min={40} max={85}/></div>
      </div>
      <div style={{display:"flex",gap:16}}>
        {[["Spa",hotel.spa,"spa"],["Piscina",hotel.pool,"pool"]].map(([lbl,val,key])=>(
          <label key={key} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13}}>
            <div onClick={()=>setHotel(p=>({...p,[key]:!p[key]}))} style={{width:36,height:20,borderRadius:10,background:val?"#1e6bb8":"#d1d5db",position:"relative",cursor:"pointer",transition:"background .3s"}}>
              <div style={{position:"absolute",top:2,left:val?18:2,width:16,height:16,borderRadius:"50%",background:"rgba(15,23,42,0.7)",transition:"left .3s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
            </div>
            {lbl}
          </label>
        ))}
      </div>
      <Box color="#eff6ff" border="#93c5fd">
        <Info/> <span style={{fontSize:11,color:"#00d4ff"}}>Fórmula de carga: <b>lb/hab/día × habitaciones × 7 × %ocupación ÷ hrs_semana</b> (Metodología Milnor/Alliance Laundry Systems)</span>
      </Box>
    </div>
  );

  const renderStep1 = () => (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10}}>
        {[
          {l:"Lb / Día",v:fmt(eng.lbPerDay,0),s:`${fmt(eng.kgPerDay,0)} kg`},
          {l:"Lb / Hora",v:fmt(eng.lbPerHr,1),s:`${fmt(eng.kgPerHr,1)} kg/hr`},
          {l:"Kg / Semana",v:fmt(eng.kgPerWeek,0),s:`${opDays} días × ${opHours} hrs`},
          {l:"Kg / Hab. Ocupada",v:fmt(eng.kgPerDay/(hotel.rooms*hotel.occ),2),s:"por día"},
        ].map((m,i)=>(
          <div key={i} style={S.metric}>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:.5,fontWeight:600}}>{m.l}</div>
            <div style={{fontSize:24,fontWeight:800,color:"#fff",lineHeight:1.1,marginTop:2}}>{m.v}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{m.s}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={S.sectionTitle}>CLASIFICACIÓN DE CARGA</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{...S.metric,background:"rgba(0,212,255,0.06)",borderColor:"rgba(0,212,255,0.2)"}}>
            <div style={{fontSize:10,color:"#00d4ff",fontWeight:600}}>FLATWORK (planchado)</div>
            <div style={{fontSize:20,fontWeight:800,color:"#00d4ff"}}>{fmt(eng.flatworkKgHr,1)} kg/hr</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>~40% — sábanas, fundas, manteles</div>
          </div>
          <div style={{...S.metric,background:"rgba(251,191,36,0.06)",borderColor:"rgba(251,191,36,0.2)"}}>
            <div style={{fontSize:10,color:"#fbbf24",fontWeight:600}}>FULL-DRY (secado completo)</div>
            <div style={{fontSize:20,fontWeight:800,color:"#fbbf24"}}>{fmt(eng.kgPerHr*0.6,1)} kg/hr</div>
            <div style={{fontSize:10,color:"#fbbf24"}}>~60% — toallas, uniformes, batas</div>
          </div>
        </div>
      </div>

      <Box color="#f0fdf4" border="#86efac">
        <Info/> <span style={{fontSize:11,color:"#00ffcc"}}>Nota: Un hotel resort de playa puede generar hasta 22 lb/hab/día. Hotels estándar: 10 lb. Ajusta según experiencia real del property.</span>
      </Box>
    </div>
  );

  // ════════ CATALOG HELPERS ════════
  const activeWashers = customWashers || eng.washerConfig.map(w => ({id:w.id,qty:w.qty}));
  const activeDryers = customDryers || eng.dryerConfig.map(d => ({id:d.id,qty:d.qty}));
  const activeIroner = customIroner || (eng.ironer ? {id:eng.ironer.id,qty:1} : null);

  const addEquipLine = (type, id) => {
    if (type === "washers") {
      const next = [...activeWashers, {id, qty:1}];
      setCustomWashers(next);
    } else if (type === "dryers") {
      const next = [...activeDryers, {id, qty:1}];
      setCustomDryers(next);
    } else {
      setCustomIroner({id, qty:1});
    }
  };
  const removeEquipLine = (type, idx) => {
    if (type === "washers") {
      const next = activeWashers.filter((_,i) => i !== idx);
      setCustomWashers(next.length ? next : null);
    } else if (type === "dryers") {
      const next = activeDryers.filter((_,i) => i !== idx);
      setCustomDryers(next.length ? next : null);
    } else {
      setCustomIroner(null);
    }
  };
  const updateEquipQty = (type, idx, qty) => {
    if (type === "washers") {
      const next = activeWashers.map((w,i) => i===idx ? {...w,qty:Math.max(1,qty)} : w);
      setCustomWashers(next);
    } else if (type === "dryers") {
      const next = activeDryers.map((d,i) => i===idx ? {...d,qty:Math.max(1,qty)} : d);
      setCustomDryers(next);
    } else {
      setCustomIroner({...activeIroner, qty: Math.max(1,qty)});
    }
  };
  const swapEquipModel = (type, idx, newId) => {
    if (type === "washers") {
      const next = activeWashers.map((w,i) => i===idx ? {id:newId,qty:w.qty} : w);
      setCustomWashers(next);
    } else if (type === "dryers") {
      const next = activeDryers.map((d,i) => i===idx ? {id:newId,qty:d.qty} : d);
      setCustomDryers(next);
    } else {
      setCustomIroner({id:newId, qty: activeIroner?.qty||1});
    }
  };
  const resetEquip = () => { setCustomWashers(null); setCustomDryers(null); setCustomIroner(null); };
  const isCustom = customWashers || customDryers || customIroner;

  const renderStep2 = () => {
    // Catalog data by tab
    const seriesOptions = catalogTab === "washers" ? ["all","UC","UYC","UY","UW"]
      : catalogTab === "dryers" ? ["all","Stack","Single","Heat Pump"]
      : ["all","chest","cylinder","cylinder_folder","cylinder_ff"];
    const catalogItems = catalogTab === "washers" ? WASHERS
      : catalogTab === "dryers" ? DRYERS : IRONERS;
    const filtered = catalogItems.filter(item => {
      if (seriesFilter === "all") return true;
      if (catalogTab === "washers") return item.series === seriesFilter;
      if (catalogTab === "dryers") return item.type === seriesFilter;
      return item.type === seriesFilter;
    });
    const activeLines = catalogTab === "washers" ? activeWashers
      : catalogTab === "dryers" ? activeDryers
      : activeIroner ? [activeIroner] : [];
    const activeIds = new Set(activeLines.map(l => l.id));
    const eqType = catalogTab === "washers" ? "washers" : catalogTab === "dryers" ? "dryers" : "ironers";

    const CS = {
      tab: { padding:"8px 16px",fontSize:12,fontWeight:700,border:"none",borderRadius:"8px 8px 0 0",cursor:"pointer",transition:"all .2s" },
      tabOn: { background:"#0e2a47",color:"#fff" },
      tabOff: { background:"#f1f5f9",color:"rgba(255,255,255,0.5)" },
      card: { borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",padding:10,cursor:"pointer",transition:"all .2s",minWidth:0 },
      cardSel: { borderColor:"#1e6bb8",background:"rgba(0,212,255,0.06)",boxShadow:"0 0 0 2px #1e6bb8" },
      line: { display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(15,23,42,0.7)" },
      qtyBtn: { width:28,height:28,borderRadius:6,border:"1px solid #d1d5db",background:"rgba(15,23,42,0.7)",cursor:"pointer",fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center" },
    };

    return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Header with reset */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>CONFIGURACIÓN DE EQUIPOS</div>
        {isCustom && <button onClick={resetEquip} style={{...S.chip,fontSize:11,color:"#ff6b6b",borderColor:"rgba(255,107,107,0.3)",background:"rgba(0,212,255,0.08)"}}>↩ Restaurar recomendación</button>}
      </div>

      {/* Active equipment lines */}
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:.5}}>Equipos seleccionados</div>
        {activeWashers.map((line,i) => {
          const w = WASHERS.find(x=>x.id===line.id);
          if(!w) return null;
          return (
          <div key={`wl${i}`} style={CS.line}>
            <span style={{fontSize:14}}>🌊</span>
            <select value={line.id} onChange={e=>swapEquipModel("washers",i,e.target.value)} style={{flex:1,border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"4px 6px",fontSize:12,background:"rgba(15,23,42,0.9)",color:"#fff"}}>
              {WASHERS.map(ww=><option key={ww.id} value={ww.id}>{ww.model} — {ww.cap_kg}kg ({ww.cap_lb}lb) · {ww.series}</option>)}
            </select>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <button onClick={()=>updateEquipQty("washers",i,line.qty-1)} style={CS.qtyBtn}>−</button>
              <span style={{fontSize:14,fontWeight:800,minWidth:20,textAlign:"center"}}>{line.qty}</span>
              <button onClick={()=>updateEquipQty("washers",i,line.qty+1)} style={CS.qtyBtn}>+</button>
            </div>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.4)",minWidth:65,textAlign:"right"}}>${(w.price_usd*line.qty).toLocaleString()}</span>
            {activeWashers.length > 1 && <button onClick={()=>removeEquipLine("washers",i)} style={{...CS.qtyBtn,color:"#ff6b6b",borderColor:"rgba(255,107,107,0.3)"}}>×</button>}
          </div>);
        })}
        {activeDryers.map((line,i) => {
          const d = DRYERS.find(x=>x.id===line.id);
          if(!d) return null;
          return (
          <div key={`dl${i}`} style={CS.line}>
            <span style={{fontSize:14}}>🔥</span>
            <select value={line.id} onChange={e=>swapEquipModel("dryers",i,e.target.value)} style={{flex:1,border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"4px 6px",fontSize:12,background:"rgba(15,23,42,0.9)",color:"#fff"}}>
              {DRYERS.map(dd=><option key={dd.id} value={dd.id}>{dd.model} — {dd.cap_kg}kg ({dd.cap_lb}lb) · {dd.type}</option>)}
            </select>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <button onClick={()=>updateEquipQty("dryers",i,line.qty-1)} style={CS.qtyBtn}>−</button>
              <span style={{fontSize:14,fontWeight:800,minWidth:20,textAlign:"center"}}>{line.qty}</span>
              <button onClick={()=>updateEquipQty("dryers",i,line.qty+1)} style={CS.qtyBtn}>+</button>
            </div>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.4)",minWidth:65,textAlign:"right"}}>${(d.price_usd*line.qty).toLocaleString()}</span>
            {activeDryers.length > 1 && <button onClick={()=>removeEquipLine("dryers",i)} style={{...CS.qtyBtn,color:"#ff6b6b",borderColor:"rgba(255,107,107,0.3)"}}>×</button>}
          </div>);
        })}
        {activeIroner && (() => {
          const ir = IRONERS.find(x=>x.id===activeIroner.id);
          if(!ir) return null;
          return (
          <div style={CS.line}>
            <span style={{fontSize:14}}>🔄</span>
            <select value={activeIroner.id} onChange={e=>swapEquipModel("ironers",0,e.target.value)} style={{flex:1,border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"4px 6px",fontSize:12,background:"rgba(15,23,42,0.9)",color:"#fff"}}>
              {IRONERS.map(ii=><option key={ii.id} value={ii.id}>{ii.model} — {ii.output_kg_hr}kg/hr · {ii.width_mm}mm</option>)}
            </select>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.4)",minWidth:65,textAlign:"right"}}>${ir.price_usd?.toLocaleString()}</span>
            <button onClick={()=>removeEquipLine("ironers",0)} style={{...CS.qtyBtn,color:"#ff6b6b",borderColor:"rgba(255,107,107,0.3)"}}>×</button>
          </div>);
        })()}
      </div>

      {/* Totals bar */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {[
          {l:"Inversión equipos",v:"$"+fmt(
            activeWashers.reduce((s,l)=>{const w=WASHERS.find(x=>x.id===l.id);return s+(w?w.price_usd*l.qty:0)},0)
            +activeDryers.reduce((s,l)=>{const d=DRYERS.find(x=>x.id===l.id);return s+(d?d.price_usd*l.qty:0)},0)
            +(activeIroner?IRONERS.find(x=>x.id===activeIroner.id)?.price_usd||0:0)
          ,0)+" USD"},
          {l:"Capacidad lavado",v:fmt(eng.totalWasherCap_kg,0)+" kg",s:fmt(eng.washersNeeded,0)+" máquinas"},
          {l:"Personal",v:eng.totalFTE+" personas",s:eng.ftePerShift+" por turno"},
        ].map((m,i)=>(
          <div key={i} style={{...S.metric,padding:8}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",fontWeight:600,textTransform:"uppercase"}}>{m.l}</div>
            <div style={{fontSize:16,fontWeight:800,color:"#fff"}}>{m.v}</div>
            {m.s && <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{m.s}</div>}
          </div>
        ))}
      </div>

      {/* Catalog browser */}
      <div style={{borderTop:"1px solid #e2e8f0",paddingTop:12}}>
        <div style={{display:"flex",gap:2,marginBottom:8}}>
          {["washers","dryers","ironers"].map(t=>(
            <button key={t} onClick={()=>{setCatalogTab(t);setSeriesFilter("all")}} style={{...CS.tab,...(catalogTab===t?CS.tabOn:CS.tabOff)}}>
              {t==="washers"?"🌊 Lavadoras":t==="dryers"?"🔥 Secadoras":"🔄 Planchadoras"}
            </button>
          ))}
        </div>
        {/* Series filter chips */}
        <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>
          {seriesOptions.map(s=>(
            <button key={s} onClick={()=>setSeriesFilter(s)} style={{...S.chip,fontSize:10,padding:"4px 10px",...(seriesFilter===s?S.chipOn:{})}}>
              {s==="all"?"Todos":s}
            </button>
          ))}
        </div>
        {/* Catalog cards grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8,maxHeight:320,overflowY:"auto",padding:2}}>
          {filtered.map(item => {
            const isActive = activeIds.has(item.id);
            return (
            <div key={item.id}
              onClick={()=>{ if(!isActive) addEquipLine(eqType, item.id); }}
              style={{...CS.card,...(isActive?CS.cardSel:{}),opacity:isActive?1:0.85}}>
              <div style={{height:80,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:6,overflow:"hidden",borderRadius:6,background:"rgba(15,23,42,0.5)"}}>
                <img src={getImg(item, catalogTab)} alt={item.model} style={{maxHeight:74,maxWidth:"100%",objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{fontSize:13,fontWeight:800,color:"#fff"}}>{item.model}</div>
                {isActive && <span style={{fontSize:9,background:"#1e6bb8",color:"#fff",borderRadius:4,padding:"1px 5px",fontWeight:700}}>✓</span>}
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",marginTop:3}}>
                {catalogTab==="ironers" 
                  ? `${item.output_kg_hr} kg/hr · ${item.width_mm}mm`
                  : `${item.cap_kg} kg (${item.cap_lb} lb)`
                }
              </div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:2}}>
                {catalogTab==="washers" && `${item.series} · G${item.gForce} · ${item.cyclesHr} c/hr`}
                {catalogTab==="dryers" && `${item.type} · ${item.dry_min}min · ${fmt(item.btu,0)} BTU`}
                {catalogTab==="ironers" && `${item.rolls}R · ${item.type} · ${item.motor_kw}kW`}
              </div>
              <div style={{fontSize:11,fontWeight:700,color:"#00d4ff",marginTop:4}}>${item.price_usd?.toLocaleString()} USD</div>
            </div>);
          })}
        </div>
      </div>

      {/* Labor note */}
      <div style={S.metric}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontWeight:600,textTransform:"uppercase"}}>Personal Requerido</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2}}>Productividad: 25 kg/hr por persona · {fmt(eng.kgPerHr,1)} kg/hr a producir</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>{eng.totalFTE} personas</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{eng.ftePerShift} por turno × {eng.shifts} turnos</div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderStep3 = () => (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* A. SPACE */}
      <EngSection title="A. ÁREA REQUERIDA" icon="📐" accent="#6366f1">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:12}}>
          <div>
            <div style={{fontSize:32,fontWeight:800,color:"#fff"}}>{fmt(eng.space.totalM2,0)} m²</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{fmt(eng.space.totalSqFt,0)} sq ft · {fmt(eng.space.totalM2/hotel.rooms,2)} m²/habitación</div>
          </div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",textAlign:"right"}}>Fórmula: lb/día × 0.6 ft²<br/>({fmt(eng.lbPerDay/opDays*7,0)} lb × 0.6)</div>
        </div>
        <div style={{display:"flex",height:32,borderRadius:6,overflow:"hidden",marginBottom:8}}>
          {eng.space.breakdown.filter(z=>z.key!=="total").map(z=>{
            const colors = {admin:"#818cf8",employee:"#a78bfa",mechanical:"#f472b6",nonProduction:"#fb923c",dock:"#38bdf8",soiledStorage:"#f87171",processing:"#34d399",cleanStorage:"#a3e635"};
            return <div key={z.key} style={{width:`${z.pct}%`,background:colors[z.key]||"#94a3b8",cursor:"pointer",position:"relative"}}
              onMouseEnter={()=>setHovZone(z.key)} onMouseLeave={()=>setHovZone(null)}>
              {hovZone===z.key&&<div style={{position:"absolute",bottom:40,left:"50%",transform:"translateX(-50%)",background:"#1e293b",color:"#fff",padding:"4px 8px",borderRadius:4,fontSize:10,whiteSpace:"nowrap",zIndex:10}}>{z.label}: {fmt(z.m2,0)} m²</div>}
            </div>;
          })}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:4,fontSize:11}}>
          {eng.space.breakdown.filter(z=>z.key!=="total").map(z=>{
            const colors = {admin:"#818cf8",employee:"#a78bfa",mechanical:"#f472b6",nonProduction:"#fb923c",dock:"#38bdf8",soiledStorage:"#f87171",processing:"#34d399",cleanStorage:"#a3e635"};
            return <div key={z.key} style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:10,height:10,borderRadius:2,background:colors[z.key],flexShrink:0}}/>
              <span>{z.label}</span>
              <span style={{marginLeft:"auto",color:"rgba(255,255,255,0.4)",fontWeight:600}}>{fmt(z.m2,0)} m² ({z.pct}%)</span>
            </div>;
          })}
        </div>
      </EngSection>

      {/* B. WATER */}
      <EngSection title="B. ACOMETIDA DE AGUA" icon="💧" accent="#0ea5e9">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <MiniMetric label="Caudal total" value={`${fmt(eng.water.totalWaterLPH,0)} L/hr`} sub={`${fmt(eng.water.totalWaterM3H,1)} m³/hr`}/>
          <MiniMetric label="Agua caliente" value={`${fmt(eng.water.hotWaterLPH,0)} L/hr`} sub={`${hotWaterTemp}°C objetivo`}/>
          <MiniMetric label="Consumo diario" value={`${fmt(eng.water.totalWaterM3Day,1)} m³/día`} sub={`${fmt(eng.water.totalWaterM3Day*30,0)} m³/mes`}/>
          <MiniMetric label="Flujo pico" value={`${fmt(eng.water.peakFlow_LPM,0)} L/min`} sub="máx. simultáneo"/>
          <MiniMetric label="Tubería principal" value={`${eng.water.mainPipe_mm} mm`} sub={`(${eng.water.mainPipe_in}")`}/>
          <MiniMetric label="Ramales H/C" value={`${eng.water.branchPipe_mm} mm`} sub={`(${eng.water.branchPipe_in}")`}/>
        </div>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:8}}>Presión recomendada: 2.8 - 4.1 bar (40-60 PSI). Agua entrante: {cc.waterTemp_C}°C ({cc.name})</div>
      </EngSection>

      {/* C. DRAIN */}
      <EngSection title="C. DRENAJE" icon="🔽" accent="#ef4444">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <MiniMetric label="Descarga máx." value={`${fmt(eng.drain.maxDump_L,0)} L`} sub={`${fmt(eng.drain.maxDump_m3,2)} m³ simultáneo`}/>
          <MiniMetric label="Trinchera" value={`${fmt(eng.drain.trenchLength_m,1)} m largo`} sub={`${eng.drain.trenchWidth_mm}×${eng.drain.trenchDepth_mm} mm`}/>
          <MiniMetric label="Salida drenaje" value={`${eng.drain.outletDiam_mm} mm`} sub={`(${eng.drain.outletDiam_in.toFixed(0)}")`}/>
          <MiniMetric label="Descarga diaria" value={`${fmt(eng.drain.dailyDischarge_m3,1)} m³/día`} sub="al alcantarillado"/>
        </div>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:8}}>Pendiente trinchera: 0.25"/pie (6mm/m) hacia salida. Rejilla filtro de pelusa: malla expandida 13mm #16.</div>
      </EngSection>

      {/* D. ELECTRICAL */}
      <EngSection title="D. ACOMETIDA ELÉCTRICA" icon="⚡" accent="#eab308">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <MiniMetric label="Lavadoras" value={`${fmt(eng.electrical.washerKW,1)} kW`} sub={eng.washerConfig.map(w=>`${w.qty}×${w.model}`).join(" + ")}/>
          <MiniMetric label="Secadoras" value={`${fmt(eng.electrical.dryerKW,1)} kW`} sub="motores (gas dryers)"/>
          <MiniMetric label="Planchadora" value={`${fmt(eng.electrical.ironerKW,1)} kW`} sub={eng.ironer?`${eng.ironer.model} (motores)`:"N/A"}/>
          <MiniMetric label="Auxiliares" value={`${fmt(eng.electrical.ancillaryKW,1)} kW`} sub="bombas, ilum., HVAC"/>
          <MiniMetric label="DEMANDA TOTAL" value={`${fmt(eng.electrical.totalKW,0)} kW`} sub={`${fmt(eng.electrical.totalKVA,0)} kVA`} bold/>
          <MiniMetric label="Transformador" value={`${eng.electrical.recommendedTransformer} kVA`} sub={cc.voltage} bold/>
        </div>
      </EngSection>

      {/* E. GAS */}
      <EngSection title="E. ACOMETIDA DE GAS" icon="🔥" accent="#f97316">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <MiniMetric label="Secadoras" value={`${fmt(eng.gas.dryerBTU_hr,0)} BTU/hr`} sub={eng.dryerConfig.map(d=>`${d.qty}×${d.model}`).join(" + ")}/>
          <MiniMetric label="Calentamiento agua" value={`${fmt(eng.gas.hotWaterBTU_hr,0)} BTU/hr`} sub={`${cc.waterTemp_C}°C → ${hotWaterTemp}°C`}/>
          <MiniMetric label="Planchadora" value={`${fmt(eng.gas.ironerBTU_hr,0)} BTU/hr`} sub={eng.ironer?.model||"N/A"}/>
          <MiniMetric label="TOTAL GAS" value={`${fmt(eng.gas.totalBTU_hr,0)} BTU/hr`} sub={`${fmt(eng.gas.totalTherms_hr,2)} Therms/hr`} bold/>
          <MiniMetric label="Caudal gas" value={`${fmt(eng.gas.gasM3H,1)} m³/hr`} sub={`Presión: ${eng.gas.gasPressure_kPa} kPa (2 PSI)`}/>
          <MiniMetric label="Medidor / Tubería" value={eng.gas.recommendedMeter} sub={`Tubería: ${eng.gas.gasPipe_mm} mm`} bold/>
        </div>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:8}}>Tipo: {cc.gasType}. Gas natural: ~35,315 BTU/m³. GLP: ~91,630 BTU/galón.</div>
      </EngSection>

      {/* F. EXHAUST */}
      <EngSection title="F. DUCTO DE EXTRACCIÓN" icon="🌀" accent="#8b5cf6">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <MiniMetric label="Ducto individual" value={`${eng.exhaust.ductDiam_in_each}" Ø`} sub={`${eng.exhaust.ductDiam_mm_each} mm · por secadora`}/>
          <MiniMetric label={eng.exhaust.dryersWithDuct > 1 ? "Colector (manifold)" : "Ducto único"} value={`${eng.exhaust.mainDuct_diam_in}" Ø`} sub={`${eng.exhaust.mainDuct_diam_mm} mm`} bold/>
          <MiniMetric label="CFM por secadora" value={`${fmt(eng.exhaust.exhaustCFM_each,0)} CFM`} sub={`Total: ${fmt(eng.exhaust.totalExhaustCFM,0)} CFM`}/>
          <MiniMetric label="Aire de reposición" value={`${fmt(eng.exhaust.makeupAir_CFM,0)} CFM`} sub={`${fmt(eng.exhaust.makeupAir_m3h,0)} m³/hr`}/>
          <MiniMetric label="Apertura makeup" value={`${fmt(eng.exhaust.totalMakeupAir_sqin,0)} sq.in`} sub={`${fmt(eng.exhaust.totalMakeupAir_sqcm,0)} cm² total`}/>
          <MiniMetric label="Long. máx. ducto" value={`${eng.exhaust.maxDuctLength_m} m`} sub={`+ 2 codos (${fmt(eng.exhaust.elbowEquiv_m,1)}m c/u)`}/>
        </div>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:8}}>
          Ducto individual por secadora al colector a 45°. Vel. mín. {eng.exhaust.minDuctVelocity_fpm} ft/min. 
          Sin malla/screen en salida. Louvers reducen flujo 40% — aumentar apertura. Datos de Alliance Section 9.
        </div>
      </EngSection>
    </div>
  );

  const renderStep4 = () => (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Grand Summary Card */}
      <div style={{background:"linear-gradient(135deg,rgba(0,212,255,0.1),rgba(0,255,204,0.05))",borderRadius:16,padding:20,color:"#fff"}}>
        <div style={{fontSize:11,opacity:.7,textTransform:"uppercase",letterSpacing:1}}>Resumen Ejecutivo — {hotel.rooms} habitaciones · {cc.name}</div>
        <div style={{fontSize:13,opacity:.5,marginTop:2}}>UniMac OPL Laundry Designer · {opHours}hr/día × {opDays} días/sem</div>
      </div>

      {/* Summary Table */}
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,overflow:"hidden"}}>
        <thead><tr style={{background:"rgba(15,23,42,0.5)"}}>
          <th style={S.th}>Parámetro</th><th style={S.th}>Valor</th><th style={S.th}>Detalle</th>
        </tr></thead>
        <tbody>
          <SumRow label="Carga diaria" val={`${fmt(eng.kgPerDay,0)} kg/día`} det={`${fmt(eng.lbPerDay,0)} lb · ${fmt(eng.kgPerHr,1)} kg/hr`}/>
          {eng.washerConfig.map((wg,i) => <SumRow key={`sw${i}`} label={i===0?"Lavadoras":"+ Complemento"} val={`${wg.qty}× ${wg.model}`} det={`${wg.cap_kg} kg · G${wg.gForce} · ${wg.series}`} accent/>)}
          {eng.dryerConfig.map((dg,i) => <SumRow key={`sd${i}`} label={i===0?"Secadoras":"+ Complemento"} val={`${dg.qty}× ${dg.model}`} det={`${dg.cap_kg} kg · ${fmt(dg.btu,0)} BTU/ciclo`}/>)}
          {eng.ironer&&<SumRow label="Planchadora" val={`1× ${eng.ironer.model}`} det={`${eng.ironer.output_kg_hr} kg/hr`} accent/>}
          <SumRow label="Personal" val={`${eng.totalFTE} FTE`} det={`${eng.ftePerShift}/turno × ${eng.shifts} turnos`}/>
          <SumRow label="Área total" val={`${fmt(eng.space.totalM2,0)} m²`} det={`${fmt(eng.space.totalSqFt,0)} ft² · ${fmt(eng.space.totalM2/hotel.rooms,2)} m²/hab`} accent/>
          <SumRow label="Agua (caudal)" val={`${fmt(eng.water.totalWaterM3H,1)} m³/hr`} det={`Pico: ${fmt(eng.water.peakFlow_LPM,0)} L/min · Tubería: ${eng.water.mainPipe_mm}mm`}/>
          <SumRow label="Agua (consumo)" val={`${fmt(eng.water.totalWaterM3Day,0)} m³/día`} det={`${fmt(eng.water.totalWaterM3Day*30,0)} m³/mes`}/>
          <SumRow label="Drenaje" val={`${eng.drain.outletDiam_mm}mm salida`} det={`Trinchera: ${fmt(eng.drain.trenchLength_m,1)}m × ${eng.drain.trenchWidth_mm}mm`} accent/>
          <SumRow label="Eléctrica" val={`${fmt(eng.electrical.totalKW,0)} kW`} det={`${eng.electrical.recommendedTransformer} kVA transf. · ${cc.voltage}`}/>
          <SumRow label="Gas" val={`${fmt(eng.gas.totalBTU_hr,0)} BTU/hr`} det={`${fmt(eng.gas.gasM3H,1)} m³/hr · Medidor: ${eng.gas.recommendedMeter} · Tub: ${eng.gas.gasPipe_mm}mm`} accent/>
          <SumRow label="Extracción aire" val={`${eng.exhaust.mainDuct_diam_mm}mm Ø`} det={`${fmt(eng.exhaust.totalExhaustCFM,0)} CFM · Reposición: ${fmt(eng.exhaust.makeupAir_m3h,0)} m³/hr`}/>
        </tbody>
      </table>

      {/* Operational Flow */}
      <div style={{background:"rgba(15,23,42,0.5)",border:"1px dashed rgba(255,255,255,0.1)",borderRadius:12,padding:16}}>
        <div style={{fontWeight:700,fontSize:11,color:"rgba(255,255,255,0.5)",marginBottom:10,textTransform:"uppercase"}}>Flujo Operativo Lineal (Sucio → Limpio)</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3,flexWrap:"wrap"}}>
          {["Recepción\ny Peso","Clasificación","Lavado\n(Washers)","Secado\n(Dryers)","Planchado\n(Ironer)","Doblado\ny QC","Almacén\nLimpio","Despacho"].map((z,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:3}}>
              <div style={{background:i===2?"#dbeafe":i===3?"#fef3c7":i===4?"#d1fae5":"#f1f5f9",border:`1px solid ${i===2?"#93c5fd":i===3?"#fcd34d":i===4?"#6ee7b7":"#e2e8f0"}`,borderRadius:6,padding:"6px 8px",textAlign:"center",fontSize:10,fontWeight:600,whiteSpace:"pre-line",lineHeight:1.2,minWidth:58}}>{z}</div>
              {i<7&&<span style={{color:"rgba(255,255,255,0.3)",fontSize:14,fontWeight:700}}>→</span>}
            </div>
          ))}
        </div>
      </div>

      <Box color="#fefce8" border="#fde047">
        <Info/> <span style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>Cálculos basados en fórmulas de Alliance Laundry Systems (Section 1 General Information) y Milnor Sizing & Planning Guide. Valores referenciales sujetos a validación en campo con distribuidor UniMac autorizado en {cc.name}. Costos de utilidades varían por localidad.</span>
      </Box>
    </div>
  );

  const renderStep5 = () => {
    // Build quotation line items from active config
    const washerLines = (customWashers || eng.washerConfig.map(w=>({id:w.id,qty:w.qty}))).map(l => {
      const w = WASHERS.find(x=>x.id===l.id); if(!w) return null;
      return { cat:"Lavadora-Extractora", model:w.model, series:w.series, desc:`${w.cap_kg} kg (${w.cap_lb} lb) · G-Force ${w.gForce} · ${w.cyclesHr} ciclos/hr`, qty:l.qty, unit:w.price_usd, total:w.price_usd*l.qty };
    }).filter(Boolean);
    const dryerLines = (customDryers || eng.dryerConfig.map(d=>({id:d.id,qty:d.qty}))).map(l => {
      const d = DRYERS.find(x=>x.id===l.id); if(!d) return null;
      return { cat:"Secadora", model:d.model, series:d.type, desc:`${d.cap_kg} kg (${d.cap_lb} lb) · ${fmt(d.btu,0)} BTU · ${d.dry_min} min`, qty:l.qty, unit:d.price_usd, total:d.price_usd*l.qty };
    }).filter(Boolean);
    const irLine = (() => {
      const ai = customIroner || (eng.ironer ? {id:eng.ironer.id,qty:1} : null);
      if(!ai) return [];
      const ir = IRONERS.find(x=>x.id===ai.id); if(!ir) return [];
      return [{ cat:"Planchadora", model:ir.model, series:ir.type, desc:`${ir.output_kg_hr} kg/hr · ${ir.width_mm}mm · ${ir.rolls} rodillo(s) · ${ir.gas_m3h>0?`Gas ${ir.gas_m3h} m³/h`:"Eléctrica"}`, qty:ai.qty, unit:ir.price_usd, total:ir.price_usd*ai.qty }];
    })();

    const allLines = [...washerLines, ...dryerLines, ...irLine];
    const subWash = washerLines.reduce((s,l)=>s+l.total,0);
    const subDry = dryerLines.reduce((s,l)=>s+l.total,0);
    const subIron = irLine.reduce((s,l)=>s+l.total,0);
    const grandTotal = subWash + subDry + subIron;

    const QS = {
      th: { padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",borderBottom:"1px solid rgba(255,255,255,0.06)",letterSpacing:.5 },
      td: { padding:"8px 10px",fontSize:12,borderBottom:"1px solid rgba(255,255,255,0.04)",verticalAlign:"top" },
      tdR: { padding:"8px 10px",fontSize:12,borderBottom:"1px solid rgba(255,255,255,0.04)",textAlign:"right",fontVariantNumeric:"tabular-nums" },
      catRow: { background:"rgba(0,212,255,0.04)",fontWeight:700,fontSize:11,color:"rgba(255,255,255,0.7)" },
      subRow: { background:"#f1f5f9",fontWeight:700,fontSize:12 },
      grandRow: { background:"#0e2a47",color:"#fff",fontWeight:800,fontSize:14 },
    };

    const CatHeader = ({icon,label,sub}) => (
      <tr><td colSpan={5} style={{...QS.td,...QS.catRow,padding:"10px 10px 6px"}}>
        <span style={{marginRight:6}}>{icon}</span>{label}
        <span style={{fontWeight:400,color:"rgba(255,255,255,0.4)",marginLeft:8,fontSize:10}}>{sub}</span>
      </td></tr>
    );
    const SubtotalRow = ({label,value}) => (
      <tr><td colSpan={3} style={{...QS.td,...QS.subRow,textAlign:"right",paddingRight:16}}>{label}</td>
        <td style={{...QS.td,...QS.subRow,textAlign:"right"}}></td>
        <td style={{...QS.td,...QS.subRow,textAlign:"right"}}>${fmt(value,0)}</td>
      </tr>
    );

    return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,rgba(0,212,255,0.1),rgba(0,255,204,0.05))",borderRadius:16,padding:20,color:"#fff"}}>
        <div style={{fontSize:11,opacity:.7,textTransform:"uppercase",letterSpacing:1}}>Cotización de Equipos — {hotel.rooms} habitaciones</div>
        <div style={{fontSize:22,fontWeight:800,marginTop:4}}>${fmt(grandTotal,0)} USD</div>
        <div style={{fontSize:11,opacity:.5,marginTop:2}}>Precios lista FCA Ripon/Pribor 2025 · No incluye flete, instalación ni impuestos</div>
      </div>

      {/* Quotation table */}
      <div style={{borderRadius:12,border:"1px solid rgba(255,255,255,0.08)",overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>
            <th style={QS.th}>Modelo</th>
            <th style={QS.th}>Descripción</th>
            <th style={{...QS.th,textAlign:"center",width:50}}>Cant.</th>
            <th style={{...QS.th,textAlign:"right",width:90}}>Precio Unit.</th>
            <th style={{...QS.th,textAlign:"right",width:100}}>Subtotal</th>
          </tr></thead>
          <tbody>
            {/* Washers */}
            {washerLines.length > 0 && <CatHeader icon="🌊" label="LAVADORAS-EXTRACTORAS" sub={`${washerLines.reduce((s,l)=>s+l.qty,0)} unidades`}/>}
            {washerLines.map((l,i) => (
              <tr key={`wq${i}`}>
                <td style={QS.td}><span style={{fontWeight:700,color:"#fff"}}>{l.model}</span><br/><span style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>{l.series}</span></td>
                <td style={QS.td}><span style={{fontSize:11,color:"rgba(255,255,255,0.7)"}}>{l.desc}</span></td>
                <td style={{...QS.td,textAlign:"center",fontWeight:700}}>{l.qty}</td>
                <td style={QS.tdR}>${fmt(l.unit,0)}</td>
                <td style={{...QS.tdR,fontWeight:700,color:"#fff"}}>${fmt(l.total,0)}</td>
              </tr>
            ))}
            {washerLines.length > 0 && <SubtotalRow label="Subtotal Lavadoras" value={subWash}/>}

            {/* Dryers */}
            {dryerLines.length > 0 && <CatHeader icon="🔥" label="SECADORAS" sub={`${dryerLines.reduce((s,l)=>s+l.qty,0)} unidades`}/>}
            {dryerLines.map((l,i) => (
              <tr key={`dq${i}`}>
                <td style={QS.td}><span style={{fontWeight:700,color:"#fff"}}>{l.model}</span><br/><span style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>{l.series}</span></td>
                <td style={QS.td}><span style={{fontSize:11,color:"rgba(255,255,255,0.7)"}}>{l.desc}</span></td>
                <td style={{...QS.td,textAlign:"center",fontWeight:700}}>{l.qty}</td>
                <td style={QS.tdR}>${fmt(l.unit,0)}</td>
                <td style={{...QS.tdR,fontWeight:700,color:"#fff"}}>${fmt(l.total,0)}</td>
              </tr>
            ))}
            {dryerLines.length > 0 && <SubtotalRow label="Subtotal Secadoras" value={subDry}/>}

            {/* Ironers */}
            {irLine.length > 0 && <CatHeader icon="🔄" label="PLANCHADORAS" sub={`${irLine.reduce((s,l)=>s+l.qty,0)} unidad(es)`}/>}
            {irLine.map((l,i) => (
              <tr key={`iq${i}`}>
                <td style={QS.td}><span style={{fontWeight:700,color:"#fff"}}>{l.model}</span><br/><span style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>{l.series}</span></td>
                <td style={QS.td}><span style={{fontSize:11,color:"rgba(255,255,255,0.7)"}}>{l.desc}</span></td>
                <td style={{...QS.td,textAlign:"center",fontWeight:700}}>{l.qty}</td>
                <td style={QS.tdR}>${fmt(l.unit,0)}</td>
                <td style={{...QS.tdR,fontWeight:700,color:"#fff"}}>${fmt(l.total,0)}</td>
              </tr>
            ))}
            {irLine.length > 0 && <SubtotalRow label="Subtotal Planchadoras" value={subIron}/>}

            {/* Grand total */}
            <tr>
              <td colSpan={3} style={{...QS.td,...QS.grandRow,textAlign:"right",paddingRight:16,borderRadius:"0 0 0 12px"}}>TOTAL EQUIPOS</td>
              <td style={{...QS.td,...QS.grandRow,textAlign:"right"}}>{allLines.reduce((s,l)=>s+l.qty,0)} uds</td>
              <td style={{...QS.td,...QS.grandRow,textAlign:"right",borderRadius:"0 0 12px 0"}}>${fmt(grandTotal,0)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        <div style={{...S.metric,borderLeft:"3px solid #1e6bb8",padding:12}}>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontWeight:600}}>LAVADO</div>
          <div style={{fontSize:18,fontWeight:800,color:"#00d4ff"}}>${fmt(subWash,0)}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{washerLines.reduce((s,l)=>s+l.qty,0)} equipos · {fmt((subWash/grandTotal*100)||0,0)}%</div>
        </div>
        <div style={{...S.metric,borderLeft:"3px solid #e97b1f",padding:12}}>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontWeight:600}}>SECADO</div>
          <div style={{fontSize:18,fontWeight:800,color:"#e97b1f"}}>${fmt(subDry,0)}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{dryerLines.reduce((s,l)=>s+l.qty,0)} equipos · {fmt((subDry/grandTotal*100)||0,0)}%</div>
        </div>
        <div style={{...S.metric,borderLeft:"3px solid #10b981",padding:12}}>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontWeight:600}}>PLANCHADO</div>
          <div style={{fontSize:18,fontWeight:800,color:"#10b981"}}>${fmt(subIron,0)}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{irLine.length} equipo(s) · {fmt((subIron/grandTotal*100)||0,0)}%</div>
        </div>
      </div>

      {/* Cost per room and per kg */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div style={{...S.metric,padding:12}}>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontWeight:600}}>INVERSIÓN POR HABITACIÓN</div>
          <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>${fmt(grandTotal/hotel.rooms,0)}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>USD / habitación · {hotel.rooms} habitaciones</div>
        </div>
        <div style={{...S.metric,padding:12}}>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontWeight:600}}>INVERSIÓN POR KG/DÍA</div>
          <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>${fmt(eng.kgPerDay>0?grandTotal/eng.kgPerDay:0,0)}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>USD por kg/día de capacidad · {fmt(eng.kgPerDay,0)} kg/día</div>
        </div>
      </div>

      <Box color="#fefce8" border="#fde047">
        <Info/> <span style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>Precios lista 2025 FCA Ripon, WI / Pribor, CZ para mercado LATAM. No incluyen flete internacional, internación, aranceles, IVA, instalación ni puesta en marcha. Consultar con distribuidor UniMac autorizado en {cc.name} para precio final de venta.</span>
      </Box>
    </div>
    );
  };

  const renders = [renderStep0,renderStep1,renderStep2,renderStep3,renderStep4,renderStep5];

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.header}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,background:"rgba(15,23,42,0.7)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:"#00d4ff",letterSpacing:-.5}}>UM</div>
          <div>
            <div style={{fontWeight:800,fontSize:15,letterSpacing:-.3}}>UniMac OPL Laundry Designer</div>
            <div style={{fontSize:10,opacity:.7}}>Diseñador Profesional de Lavanderías · {cc.name} {cc.flag}</div>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div style={S.stepper}>
        {STEPS.map((s,i)=>(
          <button key={i} onClick={()=>setStep(i)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"3px 10px",border:"none",background:"none",cursor:"pointer"}}>
            <div style={{width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,background:i<step?"#10b981":i===step?"#c41230":"#e5e7eb",color:i<=step?"#fff":"#9ca3af",transition:"all .3s"}}>
              {i<step?<Check/>:i+1}
            </div>
            <span style={{fontSize:9,fontWeight:i===step?700:500,color:i===step?"#c41230":i<step?"#10b981":"#9ca3af"}}>{s}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div ref={ref} style={S.content}>
        <div style={{marginBottom:14}}>
          <h2 style={{fontSize:16,fontWeight:800,color:"#fff",margin:0}}>
            {["Configuración del Hotel","Análisis de Carga","Selección de Equipos","Cálculos de Ingeniería","Resumen Ejecutivo"][step]}
          </h2>
          <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",margin:"3px 0 0"}}>
            {["Define propiedad, ocupación y parámetros operativos.","Volumen de procesamiento diario y clasificación.","Lavadoras, secadoras, planchadora y personal.","Área, agua, drenaje, eléctrica, gas y extracción de aire.","Tabla consolidada de todos los parámetros de diseño."][step]}
          </p>
        </div>
        {renders[step]()}
      </div>

      {/* Footer */}
      <div style={S.footer}>
        <button onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0} style={{...S.btn,opacity:step===0?.3:1}}><Chev d="l"/> Anterior</button>
        <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>Paso {step+1}/{STEPS.length}</span>
        <button onClick={()=>setStep(Math.min(STEPS.length-1,step+1))} disabled={step===STEPS.length-1} style={{...S.btnP,opacity:step===STEPS.length-1?.3:1}}>Siguiente <Chev d="r"/></button>
      </div>
    </div>
  );
}

// ─── Sub-components (Glassmorphism Dark) ───
function Box({color,border,children}){return <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"rgba(0,212,255,0.05)",borderRadius:12,border:"1px solid rgba(0,212,255,0.15)"}}>{children}</div>}

function EquipCard({color,title,icon,qty,model,specs}){
  return <div style={{border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,overflow:"hidden",background:"rgba(15,23,42,0.7)",backdropFilter:"blur(12px)"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",background:"rgba(0,212,255,0.06)",borderBottom:"1px solid rgba(255,255,255,0.06)",color:"#00d4ff"}}>
      <span style={{fontSize:16}}>{icon}</span><span style={{fontWeight:700,fontSize:13}}>{title}</span>
    </div>
    <div style={{padding:14,display:"flex",gap:16,alignItems:"center"}}>
      <div><div style={{fontSize:28,fontWeight:800,color:"#fff"}}>{qty}×</div><div style={{fontSize:14,fontWeight:600,color:"#00d4ff"}}>{model}</div></div>
      <div style={{flex:1,fontSize:11,color:"rgba(255,255,255,0.5)",lineHeight:1.7}}>{specs.map((s,i)=><div key={i}>{s}</div>)}</div>
    </div>
  </div>;
}

function EngSection({title,icon,accent,children}){
  return <div style={{border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,overflow:"hidden",background:"rgba(15,23,42,0.5)",backdropFilter:"blur(12px)"}}>
    <div style={{padding:"8px 14px",background:"rgba(0,212,255,0.04)",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:15}}>{icon}</span><span style={{fontWeight:700,fontSize:13,color:"#00d4ff"}}>{title}</span>
    </div>
    <div style={{padding:14}}>{children}</div>
  </div>;
}

function MiniMetric({label,value,sub,bold}){
  return <div style={{background:bold?"rgba(0,212,255,0.06)":"rgba(255,255,255,0.03)",border:`1px solid ${bold?"rgba(0,212,255,0.2)":"rgba(255,255,255,0.06)"}`,borderRadius:12,padding:"8px 10px"}}>
    <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:.5,fontWeight:600}}>{label}</div>
    <div style={{fontSize:bold?16:14,fontWeight:bold?800:700,color:bold?"#00d4ff":"#fff",marginTop:2}}>{value}</div>
    {sub&&<div style={{fontSize:9,color:"rgba(255,255,255,0.3)"}}>{sub}</div>}
  </div>;
}

function SumRow({label,val,det,accent}){
  return <tr style={{background:accent?"rgba(0,212,255,0.03)":"transparent",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
    <td style={{padding:"7px 12px",fontWeight:600,fontSize:11,color:"rgba(255,255,255,0.6)"}}>{label}</td>
    <td style={{padding:"7px 12px",fontWeight:700,fontSize:12,color:"#fff"}}>{val}</td>
    <td style={{padding:"7px 12px",fontSize:10,color:"rgba(255,255,255,0.4)"}}>{det}</td>
  </tr>;
}

// ─── STYLES — Glassmorphism Dark Theme ───
const S = {
  container:{fontFamily:"'Manrope','Inter',-apple-system,sans-serif",maxWidth:840,margin:"0 auto",background:"rgba(8,12,24,0.95)",borderRadius:22,boxShadow:"0 12px 48px rgba(0,0,0,.5)",overflow:"hidden",display:"flex",flexDirection:"column",height:"min(94vh,920px)",color:"#e2e8f0",backdropFilter:"blur(24px)"},
  header:{background:"rgba(10,15,28,0.85)",color:"#fff",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,borderBottom:"1px solid rgba(255,255,255,0.06)",backdropFilter:"blur(16px)"},
  stepper:{display:"flex",justifyContent:"center",gap:2,padding:"10px 14px",background:"rgba(15,23,42,0.7)",borderBottom:"1px solid rgba(255,255,255,0.06)",flexShrink:0,overflowX:"auto"},
  content:{flex:1,overflowY:"auto",padding:"16px 20px"},
  footer:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 20px",borderTop:"1px solid rgba(255,255,255,0.06)",background:"rgba(10,15,28,0.85)",flexShrink:0},
  btn:{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,background:"rgba(255,255,255,0.05)",cursor:"pointer",fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.7)",backdropFilter:"blur(8px)"},
  btnP:{display:"flex",alignItems:"center",gap:5,padding:"7px 18px",border:"none",borderRadius:12,background:"linear-gradient(135deg,#00d4ff,#00ffcc)",cursor:"pointer",fontSize:12,fontWeight:700,color:"#050a14"},
  label:{display:"block",fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.5)",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5},
  input:{width:"100%",padding:"8px 10px",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,fontSize:13,color:"#fff",background:"rgba(255,255,255,0.05)",outline:"none",boxSizing:"border-box"},
  chip:{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,background:"rgba(255,255,255,0.05)",cursor:"pointer",fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.6)",transition:"all .2s"},
  chipOn:{borderColor:"#00d4ff",background:"rgba(0,212,255,0.1)",color:"#00d4ff",fontWeight:700,boxShadow:"0 0 12px rgba(0,212,255,0.15)"},
  metric:{background:"rgba(15,23,42,0.7)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"12px 14px",backdropFilter:"blur(12px)"},
  sectionTitle:{fontWeight:700,fontSize:12,color:"#00d4ff",marginBottom:8,textTransform:"uppercase",letterSpacing:1},
  th:{padding:"7px 12px",textAlign:"left",fontWeight:600,color:"rgba(255,255,255,0.4)",borderBottom:"1px solid rgba(255,255,255,0.08)",fontSize:10,textTransform:"uppercase",letterSpacing:0.5},
};
