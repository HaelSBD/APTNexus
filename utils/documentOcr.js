const SKIP_NAME =
  /\b(MALAYSIA|WARGANEGARA|LELAKI|PEREMPUAN|LESEN|MEMANDU|PENGENALAN|IDENTITY|CARD|CLASS|NEGERI|ALAMAT|ADDRESS|BIRTH|LAHIR|KAD|NAMA|NAME|NO|LICENSE|LICENCE|DRIVING|MYKAD|MYKAS|JPN|AGAMA|ISLAM|BUDDHA|HINDU|KRISTIAN|CHRISTIAN|MALE|FEMALE|WARGA|IDENTIFICATION|GOVERNMENT|CITIZEN|RELIGION|SEX|JANTINA|COLOUR|COLOR|KAD\s*PENGENALAN)\b/;

const ADDRESS_LINE =
  /\b(JALAN|JLN|LORONG|LRG|TAMAN|TMN|KAMPUNG|KAMPONG|KG|PERSIARAN|PSN|LEBUH|LEBUHRAYA|BANDAR|DAERAH|POSKOD|POSTCODE|POST\s*CODE|BLOK|TINGKAT|LANTAI|SEKSYEN|SECTION|FELDA|ROAD|STREET|AVENUE|LANE|GARDEN|SARAWAK|SABAH|SELANGOR|JOHOR|KEDAH|KELANTAN|MELAKA|MALACCA|PAHANG|PERAK|PERLIS|PENANG|PINANG|TERENGGANU|SEMBILAN|PUTRAJAYA|LABUAN|KUALA|LUMPUR|KUCHING|KINABALU|SANDAKAN|TAWAU|MIRI|SIBU|BINTULU|SEREMBAN|KLANG|KAJANG|PETALING|GEORGE|IPOH|SHAH|ALAM)\b/;

const TITLE_PREFIX = /^(MR|MRS|MS|MISS|DR|DATO|DATUK|DATIN|TUN|ENCIK|PUAN|CIK)\.?\s+/i;

const MYKAD_STATE = /^(0[1-9]|1[0-6]|[2-5][0-9]|7[14]|8[2-9]|9[0-3])$/;

export function normalizeIc(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 12) return String(value || "").replace(/\s+/g, "").toUpperCase();
  return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
}

const PLACE_OF_BIRTH = {
  "01": "Johor",
  "02": "Kedah",
  "03": "Kelantan",
  "04": "Melaka",
  "05": "Negeri Sembilan",
  "06": "Pahang",
  "07": "Pulau Pinang",
  "08": "Perak",
  "09": "Perlis",
  "10": "Selangor",
  "11": "Terengganu",
  "12": "Sabah",
  "13": "Sarawak",
  "14": "Kuala Lumpur",
  "15": "Labuan",
  "16": "Putrajaya",
};

export function describeMyKad(icNumber) {
  const digits = String(icNumber || "").replace(/\D/g, "");
  if (digits.length !== 12) {
    return { gender: "", dob: "", placeOfBirth: "" };
  }
  const yymmdd = digits.slice(0, 6);
  const state = digits.slice(6, 8);
  const yearTwo = Number(yymmdd.slice(0, 2));
  const year = yearTwo <= 30 ? 2000 + yearTwo : 1900 + yearTwo;
  const month = yymmdd.slice(2, 4);
  const day = yymmdd.slice(4, 6);
  const last = Number(digits.slice(-1));
  return {
    gender: Number.isNaN(last) ? "" : last % 2 === 1 ? "Male" : "Female",
    dob: isValidMyKadDob(yymmdd) ? `${day}-${month}-${year}` : "",
    placeOfBirth: PLACE_OF_BIRTH[state] || (Number(state) >= 21 && Number(state) <= 59 ? "Born outside Malaysia" : ""),
  };
}

export function parseIcDocument(text) {
  const raw = String(text || "").replace(/\r/g, "");
  const documentType = detectMalaysianDocument(raw);
  const icNumber = pickMyKad(raw);
  return {
    visitorName: extractName(raw, icNumber),
    icNumber,
    documentType,
    documentLabel: documentType === "licence" ? "Driving licence" : "MyKad",
    licenceClass: documentType === "licence" ? extractLicenceClass(raw) : "",
  };
}

function detectMalaysianDocument(text) {
  const upper = String(text || "").toUpperCase();
  const licenceHits = countHits(upper, [
    /LESEN\s*MEMANDU/,
    /DRIVING\s+LICEN[CS]E/,
    /\bJPJ\b/,
    /TAMAT\s*TEMPOH/,
    /VALID\s*UNTIL/,
    /MOTORKAR/,
    /MOTORSIKAL/,
    /COMPETENT\s+DRIVING/,
    /\bCLASS\s*[:\-]?\s*(A1?|B2?|DA?|C|E|F)\b/,
  ]);
  const icHits = countHits(upper, [
    /KAD\s*PENGENALAN/,
    /\bMYKAD\b/,
    /\bMYKAS\b/,
    /IDENTITY\s+CARD/,
    /WARGANEGARA/,
    /\bJPN\b/,
    /IDENTIFICATION/,
  ]);
  if (licenceHits > icHits) return "licence";
  if (icHits > licenceHits) return "ic";
  if (licenceHits > 0) return "licence";
  return "ic";
}

function extractLicenceClass(text) {
  const match = String(text || "").toUpperCase().match(/\bCLASS\s*[:\-]?\s*(A1|B2|DA|A|B|C|D|E|F)\b/);
  return match?.[1] || "";
}

function countHits(text, patterns) {
  return patterns.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0);
}

export function parseCarPlate(text) {
  const upper = String(text || "")
    .toUpperCase()
    .replace(/\b(PLATE|NUMBER|NO|CAR|VEHICLE|MALAYSIA|PUTRAJAYA|POLICE)\b/g, " ");
  const spaced = upper.replace(/[^A-Z0-9\n ]+/g, " ").replace(/\s+/g, " ").trim();
  const glued = spaced.replace(/[^A-Z0-9]+/g, "");
  const fromSpaced = spaced.match(/\b[A-Z]{1,3}\s*[0-9OIL]{1,4}\s*[A-Z]?\b/g) || [];
  const fromGlued = findGluedPlates(glued);
  const variants = [spaced, glued, ...fromSpaced, ...fromGlued];
  if (/^[0O][A-Z]{2}\d/.test(glued)) variants.push(`Q${glued.slice(1)}`);
  const candidates = variants
    .map((item) => formatPlate(item))
    .filter(Boolean)
    .filter((item) => !SKIP_NAME.test(item));
  const best = candidates.sort((a, b) => scorePlate(b) - scorePlate(a))[0] || "";
  return { plateNumber: best };
}

function findGluedPlates(glued) {
  const found = [];
  for (let i = 0; i < glued.length; i += 1) {
    if (i > 0 && /[A-Z]/.test(glued[i - 1])) continue;
    const chunk = glued.slice(i, i + 8);
    const match = chunk.match(/^([A-Z]{1,3})([0-9OIL]{1,4})([A-Z]?)/);
    if (match) found.push(match[0]);
  }
  return found;
}

function formatPlate(value) {
  let compact = String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  compact = compact.replace(/^[0]+(?=[A-Z])/, "Q");
  if (compact.length < 3 || compact.length > 8) return "";
  const match = compact.match(/^([A-Z]{1,3})([0-9OIL]{1,4})([A-Z])?$/);
  if (!match) return "";
  const prefix = match[1];
  const digits = match[2].replace(/O/g, "0").replace(/[IL]/g, "1");
  if (!/^\d{1,4}$/.test(digits)) return "";
  return [prefix, digits, match[3] || ""].filter(Boolean).join(" ");
}

function scorePlate(value) {
  const compact = value.replace(/\s/g, "");
  const match = compact.match(/^([A-Z]{1,3})(\d{1,4})([A-Z])?$/);
  if (!match) return 0;
  let score = 8 + compact.length;
  if (match[1].length === 3 && match[2].length === 4 && !match[3]) score += 10;
  else if (match[1].length >= 2 && match[2].length >= 3) score += 6;
  if (match[3]) score += 2;
  return score;
}

function collectIcCandidates(text) {
  const upper = String(text || "").toUpperCase();
  const found = new Set();

  const token = /[0-9OILSBZG]{6}[-.\s]?[0-9OILSBZG]{2}[-.\s]?[0-9OILSBZG]{4}/g;
  (upper.match(token) || []).forEach((item) => {
    const digits = toIcDigits(item);
    if (digits.length === 12) found.add(digits);
  });

  const runs = upper.replace(/[^0-9OILSBZG]+/g, " ").trim().split(/\s+/);
  runs.forEach((run) => {
    const digits = toIcDigits(run);
    for (let i = 0; i <= digits.length - 12; i += 1) found.add(digits.slice(i, i + 12));
  });

  return [...found];
}

function toIcDigits(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[OQ]/g, "0")
    .replace(/[IL]/g, "1")
    .replace(/S/g, "5")
    .replace(/B/g, "8")
    .replace(/Z/g, "2")
    .replace(/G/g, "6")
    .replace(/\D/g, "");
}

function pickMyKad(text) {
  const hyphenated = String(text || "")
    .toUpperCase()
    .match(/[0-9OILSBZG]{6}\s*[-.\s]\s*[0-9OILSBZG]{2}\s*[-.\s]\s*[0-9OILSBZG]{4}/g) || [];
  const fromHyphen = hyphenated.map(toIcDigits).filter((item) => item.length === 12);
  const candidates = [...new Set([...fromHyphen, ...collectIcCandidates(text)])];
  if (!candidates.length) return "";
  const ranked = candidates.sort((a, b) => scoreMyKad(b) - scoreMyKad(a));
  const valid = ranked.find((item) => scoreMyKad(item) >= 8);
  return valid ? normalizeIc(valid) : "";
}

function scoreMyKad(digits) {
  if (!/^\d{12}$/.test(digits)) return 0;
  let score = 1;
  if (isValidMyKadDob(digits.slice(0, 6))) score += 8;
  if (MYKAD_STATE.test(digits.slice(6, 8))) score += 4;
  return score;
}

function isValidMyKadDob(yymmdd) {
  if (!/^\d{6}$/.test(yymmdd)) return false;
  const yearTwo = Number(yymmdd.slice(0, 2));
  const month = Number(yymmdd.slice(2, 4));
  const day = Number(yymmdd.slice(4, 6));
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const year = yearTwo <= 30 ? 2000 + yearTwo : 1900 + yearTwo;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isAddressLine(line) {
  const upper = String(line || "").toUpperCase();
  if (!upper.trim()) return false;
  if (ADDRESS_LINE.test(upper)) return true;
  if (/\b\d{5}\b/.test(upper)) return true;
  if (/\b(NO|LOT|KM)\s*\.?\s*\d/.test(upper)) return true;
  return false;
}

function isHeaderLine(line) {
  const upper = String(line || "").toUpperCase();
  return /KAD\s*PENGENALAN|MYKAD|MYKAS|WARGANEGARA|MALAYSIA|IDENTITY\s+CARD|LESEN\s*MEMANDU/.test(upper);
}

function isNameCandidate(line) {
  const value = stripTitle(String(line || "").trim());
  if (!value) return false;
  if (isAddressLine(value) || isHeaderLine(value)) return false;
  if (SKIP_NAME.test(value.toUpperCase())) return false;
  if (/\d/.test(value)) return false;
  const words = value.split(/\s+/).filter((word) => word.length > 1);
  if (words.length < 2 || words.length > 6) return false;
  if (value.replace(/\s/g, "").length < 6) return false;
  return true;
}

function stripTitle(value) {
  return String(value || "").replace(TITLE_PREFIX, "").trim();
}

const HOUSE_TOKEN = /^(GDW|LOT|NO|BLK|BLOCK|KM|UNIT)$/;

function peelNameFromAddressLine(line) {
  const raw = String(line || "").trim();
  if (!raw) return "";
  const upper = raw.toUpperCase();
  const match = upper.match(/\b(JALAN|JLN|LORONG|LRG|TAMAN|TMN|KAMPUNG|KAMPONG|PERSIARAN|LEBUH|\d{5})\b/);
  if (!match || match.index == null || match.index < 3) return "";
  const leading = upper
    .slice(0, match.index)
    .replace(/[^A-Z'\/\- ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((word) => word.length > 1 && !HOUSE_TOKEN.test(word));
  if (!leading.length) return "";
  if (leading.length === 1 && leading[0].length >= 3) return cleanName(leading[0]);
  return isNameCandidate(leading.join(" ")) ? cleanName(leading.join(" ")) : cleanName(leading[leading.length - 1]);
}

function isNameContinuation(line) {
  const value = stripTitle(String(line || "").trim());
  if (!value) return false;
  if (isHeaderLine(value)) return false;
  if (SKIP_NAME.test(value.toUpperCase())) return false;
  if (/\d/.test(value)) return false;
  if (isAddressLine(value)) return Boolean(peelNameFromAddressLine(value));
  const words = value.split(/\s+/).filter((word) => word.length > 1);
  if (!words.length || words.length > 6) return false;
  if (/\b(bin|binti|a\/l|a\/p)\b/i.test(value)) return true;
  if (words.length === 1 && words[0].length >= 3) return true;
  return isNameCandidate(value);
}

function extractName(text, icNumber = "") {
  const rawLines = String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const icDigits = String(icNumber || "").replace(/\D/g, "");
  let icIndex = -1;
  rawLines.forEach((line, index) => {
    const digits = toIcDigits(line);
    if (icDigits && digits.includes(icDigits)) icIndex = index;
    else if (icIndex < 0 && pickMyKad(line)) icIndex = index;
  });

  const addressIndex = rawLines.findIndex((line) => isAddressLine(line));
  const cleaned = rawLines.map((line) => {
    const peeled = peelNameFromAddressLine(line);
    if (peeled) return peeled;
    return cleanName(
      stripTitle(
        line
          .replace(/[0-9].*$/, (chunk) => (toIcDigits(chunk).length >= 12 ? "" : chunk))
          .replace(/[^A-Za-z'\/\- ]/g, " ")
          .replace(new RegExp(SKIP_NAME.source, "gi"), " ")
          .replace(/\s+/g, " ")
          .trim(),
      ),
    );
  });

  const afterIc = icIndex >= 0 ? cleaned.slice(icIndex + 1, addressIndex >= 0 ? addressIndex : undefined) : [];
  if (addressIndex >= 0) {
    const peeled = peelNameFromAddressLine(rawLines[addressIndex]);
    if (peeled) afterIc.push(peeled);
  }
  const beforeIc = icIndex >= 0 ? cleaned.slice(0, icIndex) : cleaned;
  const beforeAddress = addressIndex >= 0 ? cleaned.slice(0, addressIndex) : cleaned;
  const windows = [afterIc, beforeIc, beforeAddress];

  for (const window of windows) {
    const name = collectPrintedName(window);
    if (name) return name;
  }
  return "";
}

function collectPrintedName(lines) {
  const names = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    if (isAddressLine(line) || isHeaderLine(line)) {
      const peeled = peelNameFromAddressLine(line);
      if (peeled && names.length) {
        names.push(peeled);
      }
      if (names.length) break;
      if (peeled) names.push(peeled);
      continue;
    }
    if (!names.length) {
      if (isNameCandidate(line) || (/\b(bin|binti|a\/l|a\/p)\b/i.test(line) && !isAddressLine(line))) {
        names.push(line);
      }
      continue;
    }
    const continuation = peelNameFromAddressLine(line) || (isNameContinuation(line) ? line : "");
    if (!continuation) break;
    const next = cleanName([...names, continuation].join(" "));
    if (next.split(" ").length > 12 || isAddressLine(next)) break;
    names.push(continuation);
  }
  const full = cleanName(names.join(" "));
  if (!full) return "";
  if (isAddressLine(full) || isHeaderLine(full)) return "";
  const wordCount = full.split(" ").length;
  if (wordCount < 2 || wordCount > 12) return "";
  return full;
}

function cleanName(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      const key = word.toLowerCase();
      if (key === "bin" || key === "binti") return key;
      if (key === "a/l" || key === "a/p") return key.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
