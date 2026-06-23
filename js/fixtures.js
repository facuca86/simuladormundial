// Fixture completo de los 12 grupos del Mundial FIFA 2026.
// Cada constante exportada representa un grupo independiente.
// time: hora local de inicio (HH:MM). utcOffset: desfase UTC de la ciudad sede (horario de verano).

// ── Grupo A ──────────────────────────────────────────────────────────────
export const GROUP_A_FIXTURES = [
  { id: 1,  matchday: 1, date: "2026-06-11", home: "MEX", away: "RSA", stadium: "Estadio Azteca",                         time: "13:00", utcOffset: -5 },
  { id: 2,  matchday: 1, date: "2026-06-11", home: "KOR", away: "CZE", stadium: "Estadio Chivas",                         time: "19:00", utcOffset: -5 },
  { id: 25, matchday: 2, date: "2026-06-18", home: "CZE", away: "RSA", stadium: "Mercedes-Benz Stadium",                  time: "12:00", utcOffset: -4 },
  { id: 28, matchday: 2, date: "2026-06-18", home: "MEX", away: "KOR", stadium: "Estadio Chivas",                         time: "21:00", utcOffset: -5 },
  { id: 53, matchday: 3, date: "2026-06-24", home: "CZE", away: "MEX", stadium: "Estadio Azteca",                         time: "20:00", utcOffset: -5 },
  { id: 54, matchday: 3, date: "2026-06-24", home: "RSA", away: "KOR", stadium: "Estadio BBVA",                           time: "20:00", utcOffset: -5 }
];

// ── Grupo B ──────────────────────────────────────────────────────────────
export const GROUP_B_FIXTURES = [
  { id: 3,  matchday: 1, date: "2026-06-12", home: "CAN", away: "BIH", stadium: "Estadio Nacional de Canadá, Toronto",    time: "15:00", utcOffset: -4 },
  { id: 8,  matchday: 1, date: "2026-06-13", home: "QAT", away: "SUI", stadium: "Levi's Stadium, San Francisco",          time: "21:00", utcOffset: -7 },
  { id: 26, matchday: 2, date: "2026-06-18", home: "SUI", away: "BIH", stadium: "SoFi Stadium, Los Ángeles",              time: "15:00", utcOffset: -7 },
  { id: 27, matchday: 2, date: "2026-06-18", home: "CAN", away: "QAT", stadium: "Estadio BC Place, Vancouver",            time: "18:00", utcOffset: -7 },
  { id: 51, matchday: 3, date: "2026-06-24", home: "SUI", away: "CAN", stadium: "Estadio BC Place, Vancouver",            time: "17:00", utcOffset: -7 },
  { id: 52, matchday: 3, date: "2026-06-24", home: "BIH", away: "QAT", stadium: "Lumen Field, Seattle",                  time: "17:00", utcOffset: -7 }
];

// ── Grupo C ──────────────────────────────────────────────────────────────
export const GROUP_C_FIXTURES = [
  { id: 7,  matchday: 1, date: "2026-06-13", home: "BRA", away: "MAR", stadium: "MetLife Stadium, Nueva Jersey",          time: "18:00", utcOffset: -4 },
  { id: 5,  matchday: 1, date: "2026-06-13", home: "HAI", away: "SCO", stadium: "Gillette Stadium, Boston",               time: "12:00", utcOffset: -4 },
  { id: 29, matchday: 2, date: "2026-06-19", home: "BRA", away: "HAI", stadium: "Lincoln Financial Field, Filadelfia",    time: "12:00", utcOffset: -4 },
  { id: 30, matchday: 2, date: "2026-06-19", home: "SCO", away: "MAR", stadium: "Gillette Stadium, Boston",               time: "15:00", utcOffset: -4 },
  { id: 49, matchday: 3, date: "2026-06-24", home: "SCO", away: "BRA", stadium: "Hard Rock Stadium, Miami",               time: "20:00", utcOffset: -4 },
  { id: 50, matchday: 3, date: "2026-06-24", home: "MAR", away: "HAI", stadium: "Mercedes-Benz Stadium, Atlanta",         time: "20:00", utcOffset: -4 }
];

// ── Grupo D ──────────────────────────────────────────────────────────────
export const GROUP_D_FIXTURES = [
  { id: 4,  matchday: 1, date: "2026-06-12", home: "USA", away: "PAR", stadium: "SoFi Stadium, Los Ángeles",              time: "21:00", utcOffset: -7 },
  { id: 6,  matchday: 1, date: "2026-06-13", home: "AUS", away: "TUR", stadium: "Estadio BC Place, Vancouver",            time: "15:00", utcOffset: -7 },
  { id: 31, matchday: 2, date: "2026-06-19", home: "TUR", away: "PAR", stadium: "Levi's Stadium, San Francisco",          time: "18:00", utcOffset: -7 },
  { id: 32, matchday: 2, date: "2026-06-19", home: "USA", away: "AUS", stadium: "Lumen Field, Seattle",                   time: "21:00", utcOffset: -7 },
  { id: 59, matchday: 3, date: "2026-06-25", home: "TUR", away: "USA", stadium: "SoFi Stadium, Los Ángeles",              time: "20:00", utcOffset: -7 },
  { id: 60, matchday: 3, date: "2026-06-25", home: "PAR", away: "AUS", stadium: "Levi's Stadium, San Francisco",          time: "20:00", utcOffset: -7 }
];

// ── Grupo E ──────────────────────────────────────────────────────────────
export const GROUP_E_FIXTURES = [
  { id: 9,  matchday: 1, date: "2026-06-14", home: "GER", away: "CUW", stadium: "NRG Stadium, Houston",                   time: "12:00", utcOffset: -5 },
  { id: 10, matchday: 1, date: "2026-06-14", home: "CIV", away: "ECU", stadium: "Lincoln Financial Field, Filadelfia",    time: "15:00", utcOffset: -4 },
  { id: 33, matchday: 2, date: "2026-06-20", home: "GER", away: "CIV", stadium: "BMO Field, Toronto",                     time: "12:00", utcOffset: -4 },
  { id: 34, matchday: 2, date: "2026-06-20", home: "ECU", away: "CUW", stadium: "Arrowhead Stadium, Kansas City",         time: "15:00", utcOffset: -5 },
  { id: 55, matchday: 3, date: "2026-06-25", home: "CUW", away: "CIV", stadium: "Lincoln Financial Field, Filadelfia",    time: "15:00", utcOffset: -4 },
  { id: 56, matchday: 3, date: "2026-06-25", home: "ECU", away: "GER", stadium: "MetLife Stadium, Nueva Jersey",          time: "15:00", utcOffset: -4 }
];

// ── Grupo F ──────────────────────────────────────────────────────────────
export const GROUP_F_FIXTURES = [
  { id: 11, matchday: 1, date: "2026-06-14", home: "NED", away: "JPN", stadium: "AT&T Stadium, Dallas",                   time: "18:00", utcOffset: -5 },
  { id: 12, matchday: 1, date: "2026-06-14", home: "SWE", away: "TUN", stadium: "Estadio BBVA, Monterrey",                time: "21:00", utcOffset: -5 },
  { id: 35, matchday: 2, date: "2026-06-20", home: "NED", away: "SWE", stadium: "NRG Stadium, Houston",                   time: "18:00", utcOffset: -5 },
  { id: 36, matchday: 2, date: "2026-06-20", home: "TUN", away: "JPN", stadium: "Estadio BBVA, Monterrey",                time: "21:00", utcOffset: -5 },
  { id: 57, matchday: 3, date: "2026-06-25", home: "JPN", away: "SWE", stadium: "Arrowhead Stadium, Kansas City",         time: "17:00", utcOffset: -5 },
  { id: 58, matchday: 3, date: "2026-06-25", home: "TUN", away: "NED", stadium: "AT&T Stadium, Dallas",                   time: "17:00", utcOffset: -5 }
];

// ── Grupo G ──────────────────────────────────────────────────────────────
export const GROUP_G_FIXTURES = [
  { id: 15, matchday: 1, date: "2026-06-15", home: "IRN", away: "NZL", stadium: "SoFi Stadium, Los Ángeles",              time: "18:00", utcOffset: -7 },
  { id: 16, matchday: 1, date: "2026-06-15", home: "BEL", away: "EGY", stadium: "Lumen Field, Seattle",                   time: "21:00", utcOffset: -7 },
  { id: 39, matchday: 2, date: "2026-06-21", home: "BEL", away: "IRN", stadium: "SoFi Stadium, Los Ángeles",              time: "18:00", utcOffset: -7 },
  { id: 40, matchday: 2, date: "2026-06-21", home: "NZL", away: "EGY", stadium: "Estadio BC Place, Vancouver",            time: "21:00", utcOffset: -7 },
  { id: 63, matchday: 3, date: "2026-06-26", home: "EGY", away: "IRN", stadium: "Lumen Field, Seattle",                   time: "17:00", utcOffset: -7 },
  { id: 64, matchday: 3, date: "2026-06-26", home: "NZL", away: "BEL", stadium: "Estadio BC Place, Vancouver",            time: "17:00", utcOffset: -7 }
];

// ── Grupo H ──────────────────────────────────────────────────────────────
export const GROUP_H_FIXTURES = [
  { id: 13, matchday: 1, date: "2026-06-15", home: "KSA", away: "URU", stadium: "Hard Rock Stadium, Miami",               time: "12:00", utcOffset: -4 },
  { id: 14, matchday: 1, date: "2026-06-15", home: "ESP", away: "CPV", stadium: "Mercedes-Benz Stadium, Atlanta",         time: "15:00", utcOffset: -4 },
  { id: 37, matchday: 2, date: "2026-06-21", home: "URU", away: "CPV", stadium: "Hard Rock Stadium, Miami",               time: "12:00", utcOffset: -4 },
  { id: 38, matchday: 2, date: "2026-06-21", home: "ESP", away: "KSA", stadium: "Mercedes-Benz Stadium, Atlanta",         time: "15:00", utcOffset: -4 },
  { id: 65, matchday: 3, date: "2026-06-26", home: "CPV", away: "KSA", stadium: "NRG Stadium, Houston",                   time: "20:00", utcOffset: -5 },
  { id: 66, matchday: 3, date: "2026-06-26", home: "URU", away: "ESP", stadium: "Estadio Chivas, Guadalajara",            time: "20:00", utcOffset: -5 }
];

// ── Grupo I ──────────────────────────────────────────────────────────────
export const GROUP_I_FIXTURES = [
  { id: 17, matchday: 1, date: "2026-06-16", home: "FRA", away: "SEN", stadium: "MetLife Stadium, Nueva Jersey",          time: "12:00", utcOffset: -4 },
  { id: 18, matchday: 1, date: "2026-06-16", home: "IRQ", away: "NOR", stadium: "Gillette Stadium, Boston",               time: "15:00", utcOffset: -4 },
  { id: 41, matchday: 2, date: "2026-06-22", home: "NOR", away: "SEN", stadium: "MetLife Stadium, Nueva Jersey",          time: "15:00", utcOffset: -4 },
  { id: 42, matchday: 2, date: "2026-06-22", home: "FRA", away: "IRQ", stadium: "Lincoln Financial Field, Filadelfia",    time: "18:00", utcOffset: -4 },
  { id: 61, matchday: 3, date: "2026-06-26", home: "NOR", away: "FRA", stadium: "Gillette Stadium, Boston",               time: "15:00", utcOffset: -4 },
  { id: 62, matchday: 3, date: "2026-06-26", home: "SEN", away: "IRQ", stadium: "BMO Field, Toronto",                     time: "15:00", utcOffset: -4 }
];

// ── Grupo J ──────────────────────────────────────────────────────────────
export const GROUP_J_FIXTURES = [
  { id: 19, matchday: 1, date: "2026-06-16", home: "ARG", away: "ALG", stadium: "Arrowhead Stadium, Kansas City",         time: "18:00", utcOffset: -5 },
  { id: 20, matchday: 1, date: "2026-06-16", home: "AUT", away: "JOR", stadium: "Levi's Stadium, San Francisco",          time: "21:00", utcOffset: -7 },
  { id: 43, matchday: 2, date: "2026-06-22", home: "ARG", away: "AUT", stadium: "AT&T Stadium, Dallas",                   time: "12:00", utcOffset: -5 },
  { id: 44, matchday: 2, date: "2026-06-22", home: "JOR", away: "ALG", stadium: "Levi's Stadium, San Francisco",          time: "21:00", utcOffset: -7 },
  { id: 69, matchday: 3, date: "2026-06-27", home: "ALG", away: "AUT", stadium: "Arrowhead Stadium, Kansas City",         time: "17:00", utcOffset: -5 },
  { id: 70, matchday: 3, date: "2026-06-27", home: "JOR", away: "ARG", stadium: "AT&T Stadium, Dallas",                   time: "17:00", utcOffset: -5 }
];

// ── Grupo K ──────────────────────────────────────────────────────────────
export const GROUP_K_FIXTURES = [
  { id: 23, matchday: 1, date: "2026-06-17", home: "POR", away: "COD", stadium: "NRG Stadium, Houston",                   time: "18:00", utcOffset: -5 },
  { id: 24, matchday: 1, date: "2026-06-17", home: "UZB", away: "COL", stadium: "Estadio Azteca, Ciudad de México",       time: "21:00", utcOffset: -5 },
  { id: 47, matchday: 2, date: "2026-06-23", home: "POR", away: "UZB", stadium: "NRG Stadium, Houston",                   time: "18:00", utcOffset: -5 },
  { id: 48, matchday: 2, date: "2026-06-23", home: "COL", away: "COD", stadium: "Estadio Chivas, Guadalajara",            time: "21:00", utcOffset: -5 },
  { id: 71, matchday: 3, date: "2026-06-27", home: "COL", away: "POR", stadium: "Hard Rock Stadium, Miami",               time: "20:00", utcOffset: -4 },
  { id: 72, matchday: 3, date: "2026-06-27", home: "COD", away: "UZB", stadium: "Mercedes-Benz Stadium, Atlanta",         time: "20:00", utcOffset: -4 }
];

// ── Grupo L ──────────────────────────────────────────────────────────────
export const GROUP_L_FIXTURES = [
  { id: 21, matchday: 1, date: "2026-06-17", home: "GHA", away: "PAN", stadium: "BMO Field, Toronto",                     time: "12:00", utcOffset: -4 },
  { id: 22, matchday: 1, date: "2026-06-17", home: "ENG", away: "CRO", stadium: "AT&T Stadium, Dallas",                   time: "15:00", utcOffset: -5 },
  { id: 45, matchday: 2, date: "2026-06-23", home: "ENG", away: "GHA", stadium: "Gillette Stadium, Boston",               time: "12:00", utcOffset: -4 },
  { id: 46, matchday: 2, date: "2026-06-23", home: "PAN", away: "CRO", stadium: "BMO Field, Toronto",                     time: "15:00", utcOffset: -4 },
  { id: 67, matchday: 3, date: "2026-06-27", home: "PAN", away: "ENG", stadium: "MetLife Stadium, Nueva Jersey",          time: "15:00", utcOffset: -4 },
  { id: 68, matchday: 3, date: "2026-06-27", home: "CRO", away: "GHA", stadium: "Lincoln Financial Field, Filadelfia",    time: "15:00", utcOffset: -4 }
];
