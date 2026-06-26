export interface ParsedLead {
  name: string;
  phone: string;
}

/**
 * Parse pasted text into structured { name, phone } leads.
 * Handles multiple formats and deduplicates by phone number.
 */
export function parsePaste(text: string): ParsedLead[] {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const leads: ParsedLead[] = [];
  const phoneRe = /(\+?[\d\s\-().]{7,20})/g;
  const seen = new Set<string>();
  for (const line of lines) {
    const phones = line.match(phoneRe);
    if (!phones) continue;
    const phone = phones[0].replace(/\s+/g, " ").trim();
    const normalised = phone.replace(/\D/g, "");
    if (seen.has(normalised) || normalised.length < 7) continue;
    seen.add(normalised);
    const name = line.replace(phoneRe, "").replace(/[-—–·,|]+/g, " ").trim() || "Unknown";
    leads.push({ name, phone });
  }
  return leads;
}

