export const TEMPLATE_NAME = "西沙(工地B)_2B大樓T15日報表";
export const TEMPLATE_TITLE = "西沙 (工地 B) - 2B 大樓T15地盤工作日報表";
export const TEMPLATE_WORKBOOK_SOURCE = "2026-4";

export const WEATHER_CHOICES = ["晴", "雨", "陰"];

export const HEADCOUNT_FIELDS = [
  { key: "staffRegular", label: "職員 正班", shortLabel: "職員 正班", cell: "C9" },
  { key: "staffOvertime", label: "職員 加班", shortLabel: "職員 加班", cell: "E9" },
  { key: "labourRegular", label: "平水 / 平什 正班", shortLabel: "平水 正班", cell: "G9" },
  { key: "labourOvertime", label: "平水 / 平什 加班", shortLabel: "平水 加班", cell: "I9" },
  { key: "miscRegular", label: "男女什工 正班", shortLabel: "男女什工 正班", cell: "K9" },
  { key: "miscOvertime", label: "男女什工 加班", shortLabel: "男女什工 加班", cell: "M9" },
  { key: "security", label: "看更", shortLabel: "看更", cell: "O9" },
];

export const SIGNATORY_FIELDS = [
  { key: "preparedBy", label: "製表", cell: "D48", defaultValue: "劉詩怡" },
  { key: "foreman", label: "管工", cell: "L48", defaultValue: "邱兆偉" },
  { key: "assistantGeneralForeman", label: "助理總管", cell: "U48", defaultValue: "鄒嘉文" },
  { key: "generalForeman", label: "總管", cell: "X48", defaultValue: "郭耀輝" },
];

export const ENTRY_GROUPS = [
  { key: "structural", title: "工程總類", subtitle: "釘板、扎鐵、鋁模、棚架" },
  { key: "building_services", title: "樓宇設備", subtitle: "水喉、弱電、電氣、消防等" },
  { key: "others", title: "其他", subtitle: "裝修、石材、金屬、雜項" },
];

export const ENTRY_CONFIG = [
  { key: "trade_12", row: 12, group: "structural", label: "釘板", contractor: "廣聯", countCell: "H12", summaryCells: ["K12"], summaryLimits: [88] },
  { key: "trade_13", row: 13, group: "structural", label: "扎鐵", contractor: "浩洲", countCell: "H13", summaryCells: ["K13"], summaryLimits: [88] },
  { key: "trade_14", row: 14, group: "structural", label: "鋁模", contractor: "李悅森", countCell: "H14", summaryCells: ["K14"], summaryLimits: [88] },
  { key: "trade_15", row: 15, group: "structural", label: "落石矢", contractor: "創豐", countCell: "H15", summaryCells: ["K15"], summaryLimits: [88] },
  { key: "trade_16", row: 16, group: "structural", label: "撘棚", contractor: "匯寶", countCell: "H16", summaryCells: ["K16"], summaryLimits: [88] },
  { key: "trade_17", row: 17, group: "building_services", label: "水喉", contractor: "榮發", countCell: "H17", summaryCells: ["K17"], summaryLimits: [88] },
  { key: "trade_18", row: 18, group: "building_services", label: "弱電", contractor: "力安", countCell: "H18", summaryCells: ["K18"], summaryLimits: [88] },
  { key: "trade_19", row: 19, group: "building_services", label: "電訊商", contractor: "數碼通", countCell: "H19", summaryCells: ["K19"], summaryLimits: [88] },
  { key: "trade_20", row: 20, group: "building_services", label: "電氣", contractor: "恒光", countCell: "H20", summaryCells: ["K20"], summaryLimits: [88] },
  { key: "trade_21", row: 21, group: "building_services", label: "煤氣", contractor: "星滿", countCell: "H21", summaryCells: ["K21"], summaryLimits: [88] },
  { key: "trade_22", row: 22, group: "building_services", label: "大冷", contractor: "力佳", countCell: "H22", summaryCells: ["K22"], summaryLimits: [88] },
  { key: "trade_23", row: 23, group: "building_services", label: "細冷", contractor: "萬通", countCell: "H23", summaryCells: ["K23"], summaryLimits: [88] },
  { key: "trade_24", row: 24, group: "building_services", label: "消防", contractor: "力佳", countCell: "H24", summaryCells: ["K24"], summaryLimits: [88] },
  { key: "trade_25", row: 25, group: "building_services", label: "水喉", contractor: "森華", countCell: "H25", summaryCells: ["K25"], summaryLimits: [88] },
  { key: "trade_26", row: 26, group: "others", label: "玻璃欄河", contractor: "東淦", countCell: "H26", summaryCells: ["K26"], summaryLimits: [88] },
  { key: "trade_27", row: 27, group: "others", label: "玻璃幕牆", contractor: "YKK", countCell: "H27", summaryCells: ["K27"], summaryLimits: [88] },
  { key: "trade_28", row: 28, group: "others", label: "鋁窗", contractor: "聯安", countCell: "H28", summaryCells: ["K28"], summaryLimits: [88] },
  { key: "trade_29", row: 29, group: "others", label: "門框", contractor: "新輝木制品", countCell: "H29", summaryCells: ["K29"], summaryLimits: [88] },
  { key: "trade_30", row: 30, group: "others", label: "油漆", contractor: "勝良記", countCell: "H30", summaryCells: ["K30"], summaryLimits: [88] },
  { key: "trade_31", row: 31, group: "others", label: "台面石", contractor: "托高", countCell: "H31", summaryCells: ["K31"], summaryLimits: [88] },
  { key: "trade_32", row: 32, group: "others", label: "雲石", contractor: "勝達", countCell: "H32", summaryCells: ["K32"], summaryLimits: [88] },
  { key: "trade_33", row: 33, group: "others", label: "浴屏", contractor: "旭輝", countCell: "H33", summaryCells: ["K33"], summaryLimits: [88] },
  { key: "trade_34", row: 34, group: "others", label: "預制間牆板", contractor: "標特美", countCell: "H34", summaryCells: ["K34"], summaryLimits: [88] },
  { key: "trade_35", row: 35, group: "others", label: "鐵器", contractor: "宏業", countCell: "H35", summaryCells: ["K35"], summaryLimits: [88] },
  { key: "trade_36", row: 36, group: "others", label: "鐵器", contractor: "合記", countCell: "H36", summaryCells: ["K36"], summaryLimits: [88] },
  { key: "trade_37", row: 37, group: "others", label: "防火板", contractor: "耐用", countCell: "H37", summaryCells: ["K37"], summaryLimits: [88] },
  { key: "trade_38", row: 38, group: "others", label: "防水", contractor: "新鴻安", countCell: "H38", summaryCells: ["K38"], summaryLimits: [88] },
  { key: "trade_39", row: 39, group: "others", label: "假天花", contractor: "海聯", countCell: "H39", summaryCells: ["K39"], summaryLimits: [88] },
  { key: "trade_40", row: 40, group: "others", label: "水櫃", contractor: "海城", countCell: "H40", summaryCells: ["K40"], summaryLimits: [88] },
  { key: "trade_41", row: 41, group: "others", label: "墨斗", contractor: "恒裕", countCell: "H41", summaryCells: ["K41"], summaryLimits: [88] },
  { key: "trade_42", row: 42, group: "others", label: "廚櫃", contractor: "光明", countCell: "H42", summaryCells: ["K42"], summaryLimits: [88] },
  { key: "trade_43", row: 43, group: "others", label: "什項", contractor: "建聯", countCell: "H43", summaryCells: ["K43"], summaryLimits: [88] },
  { key: "trade_44", row: 44, group: "others", label: "什項", contractor: "華昇", countCell: "H44", summaryCells: ["K44"], summaryLimits: [88] },
  { key: "trade_45", row: 45, group: "others", label: "什項", contractor: "佳源", countCell: "H45", summaryCells: ["K45"], summaryLimits: [88] },
  { key: "trade_46", row: 46, group: "others", label: "泥水", contractor: "坤記", countCell: "H46", summaryCells: ["K46"], summaryLimits: [88] },
];

export const BASE_EDITABLE_CELLS = ["E5", "M5", "X5", "D49", "L49", "U49", "X49"];

export const BLOCK_MATCH_RULES = [
  { key: "trade_24", match: ["力佳消防", "消防力佳"], requireAll: ["力佳", "消防"] },
  { key: "trade_22", match: ["力佳大冷", "大冷力佳"], requireAll: ["力佳", "大冷"] },
  { key: "trade_39", match: ["海聯"] },
  { key: "trade_26", match: ["東淦", "東凎"] },
  { key: "trade_17", match: ["榮發"] },
];
