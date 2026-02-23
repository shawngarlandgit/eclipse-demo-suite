import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============================================================================
// CSV PARSING HELPERS
// ============================================================================

/**
 * Parse CSV string into array of objects
 * Handles quoted fields and various delimiters
 */
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];

  // Parse header row
  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header.trim()] = values[idx]?.trim() || "";
      });
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Parse date string to Unix timestamp
 * Handles formats: MM/DD/YYYY, YYYY-MM-DD, etc.
 */
function parseDateToTimestamp(dateStr: string | undefined): number | undefined {
  if (!dateStr || dateStr === "" || dateStr === "N/A") return undefined;

  try {
    // Try MM/DD/YYYY format first
    const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const [, month, day, year] = slashMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime();
    }

    // Try YYYY-MM-DD format
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return new Date(dateStr).getTime();
    }

    // Try general parsing
    const parsed = Date.parse(dateStr);
    return isNaN(parsed) ? undefined : parsed;
  } catch {
    return undefined;
  }
}

/**
 * Normalize status string to schema enum
 */
function normalizeStatus(status: string): "active" | "suspended" | "revoked" | "expired" | "conditional" | "pending" {
  const normalized = status.toLowerCase().trim();
  if (normalized.includes("active")) return "active";
  if (normalized.includes("suspend")) return "suspended";
  if (normalized.includes("revoke")) return "revoked";
  if (normalized.includes("expire")) return "expired";
  if (normalized.includes("condition")) return "conditional";
  if (normalized.includes("pending")) return "pending";
  return "active"; // Default
}

// ============================================================================
// MEDICAL CAREGIVER SYNC
// ============================================================================

export const syncMedicalCaregivers = internalMutation({
  args: { csvData: v.string() },
  handler: async (ctx, args) => {
    const rows = parseCSV(args.csvData);
    const now = Date.now();
    let synced = 0;
    let updated = 0;
    let errors: string[] = [];

    for (const row of rows) {
      try {
        // Map CSV columns to schema fields (adjust based on actual CSV structure)
        const registrationNumber = row["Registration Number"] || row["Reg #"] || row["License"];
        if (!registrationNumber) continue;

        const caregiverData = {
          registrationNumber: registrationNumber.toUpperCase().trim(),
          registrationType: registrationNumber.substring(0, 3), // "CGR", "RIC", "CGE"
          name: row["Name"] || row["Business Name"] || undefined,
          businessType: row["Business Type"] || row["Type"] || undefined,
          town: row["Town"] || row["City"] || undefined,
          county: row["County"] || undefined,
          status: normalizeStatus(row["Status"] || "active") as "active" | "suspended" | "revoked" | "expired",
          issuedAt: parseDateToTimestamp(row["Issue Date"] || row["Issued"]),
          expiresAt: parseDateToTimestamp(row["Expiration Date"] || row["Expires"]),
        };

        // Check if exists
        const existing = await ctx.db
          .query("maineMedicalCaregivers")
          .withIndex("by_registration", (q) => q.eq("registrationNumber", caregiverData.registrationNumber))
          .first();

        if (existing) {
          await ctx.db.patch(existing._id, {
            ...caregiverData,
            lastSyncedAt: now,
          });
          updated++;
        } else {
          await ctx.db.insert("maineMedicalCaregivers", {
            ...caregiverData,
            hasViolations: false,
            syncSource: "maine_ocp_csv",
            lastSyncedAt: now,
            createdAt: now,
          });
          synced++;
        }
      } catch (error) {
        errors.push(`Error processing row: ${JSON.stringify(row).substring(0, 100)}`);
      }
    }

    console.log(`Caregiver sync complete: ${synced} new, ${updated} updated, ${errors.length} errors`);

    return { synced, updated, errors: errors.slice(0, 10), totalRows: rows.length };
  },
});

// ============================================================================
// MEDICAL DISPENSARY SYNC
// ============================================================================

export const syncMedicalDispensaries = internalMutation({
  args: { csvData: v.string() },
  handler: async (ctx, args) => {
    const rows = parseCSV(args.csvData);
    const now = Date.now();
    let synced = 0;
    let updated = 0;
    let errors: string[] = [];

    for (const row of rows) {
      try {
        const registrationNumber = row["Registration Number"] || row["Reg #"] || row["License"];
        const businessName = row["Business Name"] || row["Name"] || row["DBA"];
        if (!registrationNumber || !businessName) continue;

        const dispensaryData = {
          registrationNumber: registrationNumber.toUpperCase().trim(),
          businessName: businessName.trim(),
          dba: row["DBA"] || row["Trade Name"] || undefined,
          address: row["Address"] || row["Street Address"] || undefined,
          city: (row["City"] || row["Town"] || "Unknown").trim(),
          county: row["County"] || undefined,
          zipCode: row["Zip"] || row["Zip Code"] || row["ZIP"] || undefined,
          status: normalizeStatus(row["Status"] || "active") as "active" | "conditional" | "pending" | "suspended" | "revoked",
          issuedAt: parseDateToTimestamp(row["Issue Date"] || row["Issued"]),
          expiresAt: parseDateToTimestamp(row["Expiration Date"] || row["Expires"]),
          email: row["Email"] || row["Contact Email"] || undefined,
          phone: row["Phone"] || row["Contact Phone"] || undefined,
          website: row["Website"] || row["URL"] || undefined,
        };

        // Parse officers if present
        const officers: Array<{ name: string; title?: string }> = [];
        if (row["Officers"] || row["Owner"]) {
          const officerStr = row["Officers"] || row["Owner"];
          // Simple parsing - officers might be comma or semicolon separated
          const names = officerStr.split(/[,;]/).map(s => s.trim()).filter(Boolean);
          for (const name of names) {
            officers.push({ name });
          }
        }

        const existing = await ctx.db
          .query("maineMedicalDispensaries")
          .withIndex("by_registration", (q) => q.eq("registrationNumber", dispensaryData.registrationNumber))
          .first();

        if (existing) {
          await ctx.db.patch(existing._id, {
            ...dispensaryData,
            officers: officers.length > 0 ? officers : existing.officers,
            lastSyncedAt: now,
          });
          updated++;
        } else {
          await ctx.db.insert("maineMedicalDispensaries", {
            ...dispensaryData,
            officers: officers.length > 0 ? officers : undefined,
            hasViolations: false,
            lastSyncedAt: now,
            createdAt: now,
          });
          synced++;
        }
      } catch (error) {
        errors.push(`Error processing row: ${JSON.stringify(row).substring(0, 100)}`);
      }
    }

    console.log(`Dispensary sync complete: ${synced} new, ${updated} updated, ${errors.length} errors`);

    // Schedule prospect linking after sync
    await ctx.scheduler.runAfter(0, internal.maineDataInternal.linkProspectsToOcpData, {});

    return { synced, updated, errors: errors.slice(0, 10), totalRows: rows.length };
  },
});

// ============================================================================
// ADULT USE LICENSEE SYNC
// ============================================================================

export const syncAdultUseLicensees = internalMutation({
  args: { csvData: v.string() },
  handler: async (ctx, args) => {
    const rows = parseCSV(args.csvData);
    const now = Date.now();
    let synced = 0;
    let updated = 0;
    let errors: string[] = [];

    for (const row of rows) {
      try {
        const licenseNumber = row["License Number"] || row["License"] || row["Reg #"];
        const businessName = row["Business Name"] || row["Name"];
        if (!licenseNumber || !businessName) continue;

        // Extract license type from number (e.g., "AMS235" -> "AMS")
        const licenseType = licenseNumber.match(/^[A-Z]+/)?.[0] || "AMS";

        const licenseeData = {
          licenseNumber: licenseNumber.toUpperCase().trim(),
          licenseType,
          businessName: businessName.trim(),
          dba: row["DBA"] || row["Trade Name"] || undefined,
          city: (row["City"] || row["Town"] || "Unknown").trim(),
          county: row["County"] || undefined,
          status: normalizeAdultUseStatus(row["Status"] || "active"),
          issuedAt: parseDateToTimestamp(row["Issue Date"] || row["Issued"]),
          expiresAt: parseDateToTimestamp(row["Expiration Date"] || row["Expires"]),
        };

        const existing = await ctx.db
          .query("maineAdultUseLicensees")
          .withIndex("by_license", (q) => q.eq("licenseNumber", licenseeData.licenseNumber))
          .first();

        if (existing) {
          await ctx.db.patch(existing._id, {
            ...licenseeData,
            lastSyncedAt: now,
          });
          updated++;
        } else {
          await ctx.db.insert("maineAdultUseLicensees", {
            ...licenseeData,
            hasViolations: false,
            lastSyncedAt: now,
            createdAt: now,
          });
          synced++;
        }
      } catch (error) {
        errors.push(`Error processing row: ${JSON.stringify(row).substring(0, 100)}`);
      }
    }

    console.log(`Adult use sync complete: ${synced} new, ${updated} updated, ${errors.length} errors`);

    return { synced, updated, errors: errors.slice(0, 10), totalRows: rows.length };
  },
});

function normalizeAdultUseStatus(status: string): "active" | "conditional" | "conditional_jurisdiction_approved" | "pending_conditional" | "suspended" | "revoked" {
  const normalized = status.toLowerCase().trim();
  if (normalized.includes("active") && !normalized.includes("condition")) return "active";
  if (normalized.includes("conditional") && normalized.includes("jurisdiction")) return "conditional_jurisdiction_approved";
  if (normalized.includes("pending") && normalized.includes("conditional")) return "pending_conditional";
  if (normalized.includes("conditional")) return "conditional";
  if (normalized.includes("suspend")) return "suspended";
  if (normalized.includes("revoke")) return "revoked";
  return "active";
}

// ============================================================================
// VIOLATIONS SYNC
// Matches OCP table: https://www.maine.gov/dafs/ocp/open-data/medical-use/compliance-data
// Columns: Date | Registrant | Registration Number | Action | Settled Fine Amount | Final Action Documentation
// ============================================================================

/**
 * Parse OCP violation data from scraped table or n8n webhook
 * Input format matches OCP table exactly
 */
export const syncViolations = internalMutation({
  args: {
    violations: v.array(v.object({
      date: v.string(), // "M/D/YYYY" format from OCP table
      registrant: v.string(), // Full name e.g., "Deena E. Burgess"
      registrationNumber: v.string(), // e.g., "CGR27692", "CGE2388", "RIC20101"
      action: v.string(), // "Suspended" or "Revoked"
      settledFineAmount: v.string(), // "N/A" or "$16,500.00"
      documentType: v.string(), // "Suspension" or "Settlement Agreement"
      documentUrl: v.optional(v.string()), // Full URL if scraped, otherwise we construct it
    })),
    programType: v.optional(v.union(v.literal("medical"), v.literal("adult_use"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let synced = 0;
    let skipped = 0;
    let errors: string[] = [];

    for (const vio of args.violations) {
      try {
        const registrationNumber = vio.registrationNumber.toUpperCase().trim();
        const violationDate = parseOCPDate(vio.date);

        if (!violationDate) {
          errors.push(`Invalid date format: ${vio.date}`);
          continue;
        }

        // Parse fine amount - "N/A" or "$16,500.00"
        let settledFineAmount: number | undefined = undefined;
        if (vio.settledFineAmount && vio.settledFineAmount !== "N/A") {
          const cleaned = vio.settledFineAmount.replace(/[$,]/g, "");
          const parsed = parseFloat(cleaned);
          if (!isNaN(parsed)) {
            settledFineAmount = parsed;
          }
        }

        // Construct document URL if not provided
        let documentUrl = vio.documentUrl;
        if (!documentUrl && vio.registrant) {
          documentUrl = constructOCPDocumentUrl(
            registrationNumber,
            vio.registrant,
            vio.documentType
          );
        }

        // Check for duplicate by registration + date + action
        const existing = await ctx.db
          .query("maineComplianceViolations")
          .withIndex("by_registration", (q) => q.eq("registrationNumber", registrationNumber))
          .filter((q) =>
            q.and(
              q.eq(q.field("violationDate"), violationDate),
              q.eq(q.field("action"), vio.action)
            )
          )
          .first();

        if (existing) {
          skipped++;
          continue;
        }

        await ctx.db.insert("maineComplianceViolations", {
          registrationNumber,
          registrantName: vio.registrant.trim(),
          programType: args.programType || "medical", // Default to medical (MMCP)
          violationDate,
          action: vio.action.trim(), // "Suspended" or "Revoked"
          settledFineAmount,
          documentType: vio.documentType.trim(), // "Suspension" or "Settlement Agreement"
          documentUrl,
          syncedAt: now,
          createdAt: now,
        });
        synced++;
      } catch (error) {
        errors.push(`Error processing: ${vio.registrationNumber} - ${error}`);
      }
    }

    // Cross-reference violations with licensees
    if (synced > 0) {
      await ctx.scheduler.runAfter(0, internal.maineDataInternal.crossReferenceViolations, {});
    }

    console.log(`Violation sync complete: ${synced} new, ${skipped} duplicates, ${errors.length} errors`);
    return { synced, skipped, errors: errors.slice(0, 10) };
  },
});

/**
 * Parse OCP date format (M/D/YYYY) to Unix timestamp
 */
function parseOCPDate(dateStr: string): number | undefined {
  if (!dateStr) return undefined;

  // Match M/D/YYYY or MM/DD/YYYY
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, month, day, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.getTime();
  }

  return undefined;
}

/**
 * Construct OCP document URL based on document type
 * Settlement: https://www.maine.gov/dafs/ocp/sites/.../CGR26995%2C%20Dunham%20-%20Settlement.pdf
 * Suspension: https://www.maine.gov/dafs/ocp/sites/.../Brynes%2C%20CGE2389_Redacted.pdf
 */
function constructOCPDocumentUrl(
  registrationNumber: string,
  registrantName: string,
  documentType: string
): string {
  const baseUrl = "https://www.maine.gov/dafs/ocp/sites/maine.gov.dafs.ocp/files/inline-files/";

  // Extract last name from full name (e.g., "Deena E. Burgess" -> "Burgess")
  const nameParts = registrantName.trim().split(/\s+/);
  const lastName = nameParts[nameParts.length - 1];

  if (documentType.toLowerCase().includes("settlement")) {
    // Settlement format: {RegNumber}, {LastName} - Settlement.pdf
    return `${baseUrl}${encodeURIComponent(`${registrationNumber}, ${lastName} - Settlement`)}.pdf`;
  } else {
    // Suspension format: {LastName}, {RegNumber}_Redacted.pdf
    return `${baseUrl}${encodeURIComponent(`${lastName}, ${registrationNumber}`)}_Redacted.pdf`;
  }
}

// ============================================================================
// CROSS-REFERENCE VIOLATIONS
// ============================================================================

export const crossReferenceViolations = internalMutation({
  args: {},
  handler: async (ctx) => {
    const violations = await ctx.db.query("maineComplianceViolations").collect();

    // Group violations by registration number
    const violationsByReg = new Map<string, typeof violations>();
    for (const v of violations) {
      const regNum = v.registrationNumber;
      if (!violationsByReg.has(regNum)) {
        violationsByReg.set(regNum, []);
      }
      violationsByReg.get(regNum)!.push(v);
    }

    let updatedCaregivers = 0;
    let updatedDispensaries = 0;
    let updatedAdultUse = 0;

    // Update caregivers
    for (const [regNum, vios] of violationsByReg) {
      const caregiver = await ctx.db
        .query("maineMedicalCaregivers")
        .withIndex("by_registration", (q) => q.eq("registrationNumber", regNum))
        .first();

      if (caregiver) {
        await ctx.db.patch(caregiver._id, {
          hasViolations: true,
          violationCount: vios.length,
          lastViolationDate: Math.max(...vios.map(v => v.violationDate)),
        });
        updatedCaregivers++;
        continue;
      }

      // Check dispensaries
      const dispensary = await ctx.db
        .query("maineMedicalDispensaries")
        .withIndex("by_registration", (q) => q.eq("registrationNumber", regNum))
        .first();

      if (dispensary) {
        await ctx.db.patch(dispensary._id, {
          hasViolations: true,
          violationCount: vios.length,
        });
        updatedDispensaries++;
        continue;
      }

      // Check adult use
      const adultUse = await ctx.db
        .query("maineAdultUseLicensees")
        .withIndex("by_license", (q) => q.eq("licenseNumber", regNum))
        .first();

      if (adultUse) {
        await ctx.db.patch(adultUse._id, {
          hasViolations: true,
          violationCount: vios.length,
        });
        updatedAdultUse++;
      }
    }

    console.log(`Cross-reference complete: ${updatedCaregivers} caregivers, ${updatedDispensaries} dispensaries, ${updatedAdultUse} adult use`);

    return { updatedCaregivers, updatedDispensaries, updatedAdultUse };
  },
});

// ============================================================================
// LINK PROSPECTS TO OCP DATA
// ============================================================================

export const linkProspectsToOcpData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const prospects = await ctx.db.query("coldEmailProspects").collect();
    const dispensaries = await ctx.db.query("maineMedicalDispensaries").collect();

    let linked = 0;
    let enriched = 0;

    for (const prospect of prospects) {
      let match: typeof dispensaries[0] | null = null;
      let matchConfidence: "high" | "medium" | "low" = "low";

      // 1. Email exact match (highest confidence)
      if (prospect.email && prospect.email.trim()) {
        match = dispensaries.find(d =>
          d.email?.toLowerCase() === prospect.email!.toLowerCase()
        ) || null;
        if (match) matchConfidence = "high";
      }

      // 2. Phone exact match (if no email match)
      if (!match && prospect.phone) {
        match = dispensaries.find(d => d.phone === prospect.phone) || null;
        if (match) matchConfidence = "high";
      }

      // 3. License number match (if provided)
      if (!match && prospect.licenseNumber) {
        match = dispensaries.find(d =>
          d.registrationNumber === prospect.licenseNumber
        ) || null;
        if (match) matchConfidence = "high";
      }

      // 4. Fuzzy match on business name (lowest confidence)
      if (!match) {
        const prospectName = prospect.dispensaryName.toLowerCase().trim();
        const fuzzyMatches = dispensaries.filter(d => {
          const dispName = d.businessName.toLowerCase().trim();
          // Require substantial match (80%+ overlap)
          const minLen = Math.min(dispName.length, prospectName.length);
          const maxLen = Math.max(dispName.length, prospectName.length);
          return (dispName.includes(prospectName) || prospectName.includes(dispName)) &&
                 maxLen / minLen < 1.3;
        });

        if (fuzzyMatches.length === 1) {
          match = fuzzyMatches[0];
          matchConfidence = "medium";
          console.log(`Fuzzy match: ${prospect.dispensaryName} → ${match.businessName}`);
        }
      }

      if (match) {
        // Link dispensary to prospect
        if (!match.coldEmailProspectId) {
          await ctx.db.patch(match._id, {
            coldEmailProspectId: prospect._id,
          });
          linked++;
        }

        // Enrich prospect with license info
        await ctx.db.patch(prospect._id, {
          licenseNumber: match.registrationNumber,
          licenseStatus: match.status,
          licenseExpiration: match.expiresAt ? new Date(match.expiresAt).toISOString().split("T")[0] : undefined,
          hasComplianceIssues: match.hasViolations,
          matchConfidence,
          updatedAt: Date.now(),
        });
        enriched++;
      }
    }

    console.log(`Prospect linking complete: ${linked} dispensaries linked, ${enriched} prospects enriched`);

    return { linked, enriched };
  },
});

// ============================================================================
// FLAG EXPIRING LICENSES
// ============================================================================

export const flagExpiringLicenses = internalMutation({
  args: { daysThreshold: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.daysThreshold || 30;
    const now = Date.now();
    const futureDate = now + (days * 24 * 60 * 60 * 1000);
    let flaggedDispensaries = 0;
    let flaggedProspects = 0;

    // Get dispensaries expiring soon
    const dispensaries = await ctx.db.query("maineMedicalDispensaries").collect();
    const expiringDispensaries = dispensaries.filter(d =>
      d.expiresAt &&
      d.expiresAt > now &&
      d.expiresAt < futureDate &&
      d.status !== "revoked"
    );

    for (const disp of expiringDispensaries) {
      const daysUntilExpiration = Math.ceil((disp.expiresAt! - now) / (24 * 60 * 60 * 1000));

      // If linked to prospect, flag for sales outreach
      if (disp.coldEmailProspectId) {
        await ctx.db.patch(disp.coldEmailProspectId, {
          licenseExpirationAlert: true,
          licenseExpiresInDays: daysUntilExpiration,
          updatedAt: now,
        });
        flaggedProspects++;
      }

      console.log(`Alert: ${disp.businessName} license expiring in ${daysUntilExpiration} days`);
      flaggedDispensaries++;
    }

    // Clear expired alerts (licenses that have been renewed or are past expiration)
    const prospectsWithAlerts = await ctx.db
      .query("coldEmailProspects")
      .withIndex("by_license_alert", (q) => q.eq("licenseExpirationAlert", true))
      .collect();

    let clearedAlerts = 0;
    for (const prospect of prospectsWithAlerts) {
      const dispensary = await ctx.db
        .query("maineMedicalDispensaries")
        .withIndex("by_prospect", (q) => q.eq("coldEmailProspectId", prospect._id))
        .first();

      if (dispensary && dispensary.expiresAt) {
        if (dispensary.expiresAt < now || dispensary.expiresAt > futureDate) {
          await ctx.db.patch(prospect._id, {
            licenseExpirationAlert: false,
            licenseExpiresInDays: undefined,
            updatedAt: now,
          });
          clearedAlerts++;
        }
      }
    }

    console.log(`Flagged ${flaggedDispensaries} dispensaries, ${flaggedProspects} prospects, cleared ${clearedAlerts} alerts`);

    return { flaggedDispensaries, flaggedProspects, clearedAlerts };
  },
});

// ============================================================================
// SEED DATA FUNCTIONS
// ============================================================================

/**
 * Seed Maine regulations table with static data
 */
export const seedRegulations = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const MAINE_REGULATIONS = [
      // Medical Use - Possession
      { category: "possession", programType: "medical" as const, name: "Patient Harvested Limit", value: "8 pounds", numericValue: 8, unit: "pounds" },
      { category: "possession", programType: "medical" as const, name: "Patient Concentrate Limit", value: "No specific limit", numericValue: undefined, unit: undefined },

      // Medical Use - Cultivation
      { category: "cultivation", programType: "medical" as const, name: "Mature Plants", value: "6 plants", numericValue: 6, unit: "plants" },
      { category: "cultivation", programType: "medical" as const, name: "Immature Plants", value: "12 plants", numericValue: 12, unit: "plants" },
      { category: "cultivation", programType: "medical" as const, name: "Seedlings", value: "Unlimited", numericValue: undefined, unit: undefined },

      // Adult Use - Possession
      { category: "possession", programType: "adult_use" as const, name: "Purchase Limit", value: "2.5 ounces or 5 grams concentrate", numericValue: 2.5, unit: "ounces" },

      // Adult Use - Cultivation
      { category: "cultivation", programType: "adult_use" as const, name: "Mature Plants", value: "3 plants", numericValue: 3, unit: "plants" },
      { category: "cultivation", programType: "adult_use" as const, name: "Immature Plants", value: "12 plants", numericValue: 12, unit: "plants" },

      // Taxes
      { category: "tax", programType: "adult_use" as const, name: "Excise Tax", value: "15%", numericValue: 15, unit: "percent" },
      { category: "tax", programType: "adult_use" as const, name: "Sales Tax", value: "10%", numericValue: 10, unit: "percent" },
      { category: "tax", programType: "medical" as const, name: "Sales Tax", value: "5.5%", numericValue: 5.5, unit: "percent" },
      { category: "tax", programType: "medical" as const, name: "Edibles Tax", value: "8%", numericValue: 8, unit: "percent" },

      // Licensing
      { category: "licensing", programType: "adult_use" as const, name: "Application Fee", value: "$500", numericValue: 500, unit: "dollars" },
      { category: "licensing", programType: "adult_use" as const, name: "License Fee", value: "$5,000", numericValue: 5000, unit: "dollars" },
      { category: "licensing", programType: "both" as const, name: "IIC Required", value: "Yes - Individual Identification Card for all employees", numericValue: undefined, unit: undefined },
    ];

    let inserted = 0;
    let skipped = 0;

    for (const reg of MAINE_REGULATIONS) {
      // Check for existing
      const existing = await ctx.db
        .query("maineRegulations")
        .withIndex("by_category", (q) => q.eq("category", reg.category))
        .filter((q) =>
          q.and(
            q.eq(q.field("name"), reg.name),
            q.eq(q.field("programType"), reg.programType)
          )
        )
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      await ctx.db.insert("maineRegulations", {
        ...reg,
        sourceUrl: "https://www.maine.gov/dafs/ocp/",
        lastVerified: now,
        createdAt: now,
      });
      inserted++;
    }

    return { inserted, skipped };
  },
});

/**
 * Seed sales data with historical data from mainecannabis.org
 */
export const seedSalesData = internalMutation({
  args: {
    salesData: v.array(v.object({
      year: v.number(),
      month: v.number(),
      medicalSales: v.optional(v.number()),
      adultUseSales: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let inserted = 0;
    let updated = 0;

    for (const data of args.salesData) {
      const totalSales = (data.medicalSales || 0) + (data.adultUseSales || 0);

      // Check for existing
      const existing = await ctx.db
        .query("maineSalesData")
        .withIndex("by_year_month", (q) =>
          q.eq("year", data.year).eq("month", data.month)
        )
        .first();

      const salesRecord = {
        year: data.year,
        month: data.month,
        dataType: "blended" as const,
        medicalSales: data.medicalSales,
        adultUseSales: data.adultUseSales,
        totalSales,
        sourceUrl: "https://www.mainecannabis.org/business/sales",
        syncedAt: now,
      };

      if (existing) {
        await ctx.db.patch(existing._id, salesRecord);
        updated++;
      } else {
        await ctx.db.insert("maineSalesData", salesRecord);
        inserted++;
      }
    }

    // Calculate MoM and YoY changes
    await ctx.scheduler.runAfter(0, internal.maineDataInternal.calculateSalesChanges, {});

    return { inserted, updated };
  },
});

/**
 * Calculate month-over-month and year-over-year sales changes
 */
export const calculateSalesChanges = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allSales = await ctx.db.query("maineSalesData").collect();

    // Sort by year/month
    allSales.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    let updated = 0;

    for (let i = 0; i < allSales.length; i++) {
      const current = allSales[i];
      let monthOverMonthChange: number | undefined = undefined;
      let yearOverYearChange: number | undefined = undefined;

      // Find previous month
      const prevMonth = i > 0 ? allSales[i - 1] : null;
      if (prevMonth && prevMonth.totalSales > 0) {
        // Check if it's actually the previous month
        const isPrevMonth =
          (current.month === 1 && prevMonth.month === 12 && prevMonth.year === current.year - 1) ||
          (prevMonth.month === current.month - 1 && prevMonth.year === current.year);

        if (isPrevMonth) {
          monthOverMonthChange = ((current.totalSales - prevMonth.totalSales) / prevMonth.totalSales) * 100;
        }
      }

      // Find same month previous year
      const sameMonthPrevYear = allSales.find(s =>
        s.year === current.year - 1 && s.month === current.month
      );
      if (sameMonthPrevYear && sameMonthPrevYear.totalSales > 0) {
        yearOverYearChange = ((current.totalSales - sameMonthPrevYear.totalSales) / sameMonthPrevYear.totalSales) * 100;
      }

      // Update if changes calculated
      if (monthOverMonthChange !== undefined || yearOverYearChange !== undefined) {
        await ctx.db.patch(current._id, {
          monthOverMonthChange,
          yearOverYearChange,
        });
        updated++;
      }
    }

    return { updated };
  },
});

// ============================================================================
// INTERNAL QUERIES (for HTTP endpoints)
// ============================================================================

export const getProspectsByLicenseAlert = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("coldEmailProspects")
      .withIndex("by_license_alert", (q) => q.eq("licenseExpirationAlert", true))
      .collect();
  },
});

/**
 * Verify a Maine cannabis license (internal version for HTTP endpoint)
 */
export const verifyLicenseInternal = internalQuery({
  args: { registrationNumber: v.string() },
  handler: async (ctx, args) => {
    const regNum = args.registrationNumber.toUpperCase().trim();

    // Check medical dispensary first
    const dispensary = await ctx.db
      .query("maineMedicalDispensaries")
      .withIndex("by_registration", (q) => q.eq("registrationNumber", regNum))
      .first();

    if (dispensary) {
      // Get violations for this registration
      const violations = await ctx.db
        .query("maineComplianceViolations")
        .withIndex("by_registration", (q) => q.eq("registrationNumber", regNum))
        .collect();

      return {
        found: true,
        type: "medical_dispensary",
        registrationNumber: dispensary.registrationNumber,
        name: dispensary.businessName,
        dba: dispensary.dba,
        city: dispensary.city,
        address: dispensary.address,
        status: dispensary.status,
        expiresAt: dispensary.expiresAt,
        hasViolations: dispensary.hasViolations,
        violationCount: violations.length,
        violations: violations.map(v => ({
          date: v.violationDate,
          action: v.action,
          fineAmount: v.settledFineAmount,
          documentUrl: v.documentUrl,
        })),
        lastSyncedAt: dispensary.lastSyncedAt,
      };
    }

    // Check medical caregiver
    const caregiver = await ctx.db
      .query("maineMedicalCaregivers")
      .withIndex("by_registration", (q) => q.eq("registrationNumber", regNum))
      .first();

    if (caregiver) {
      const violations = await ctx.db
        .query("maineComplianceViolations")
        .withIndex("by_registration", (q) => q.eq("registrationNumber", regNum))
        .collect();

      return {
        found: true,
        type: "medical_caregiver",
        registrationNumber: caregiver.registrationNumber,
        registrationType: caregiver.registrationType,
        name: caregiver.name,
        town: caregiver.town,
        status: caregiver.status,
        expiresAt: caregiver.expiresAt,
        hasViolations: caregiver.hasViolations,
        violationCount: violations.length,
        violations: violations.map(v => ({
          date: v.violationDate,
          action: v.action,
          fineAmount: v.settledFineAmount,
          documentUrl: v.documentUrl,
        })),
        lastSyncedAt: caregiver.lastSyncedAt,
      };
    }

    // Check adult use licensee
    const adultUse = await ctx.db
      .query("maineAdultUseLicensees")
      .withIndex("by_license", (q) => q.eq("licenseNumber", regNum))
      .first();

    if (adultUse) {
      const violations = await ctx.db
        .query("maineComplianceViolations")
        .withIndex("by_registration", (q) => q.eq("registrationNumber", regNum))
        .collect();

      return {
        found: true,
        type: "adult_use",
        licenseType: adultUse.licenseType,
        licenseNumber: adultUse.licenseNumber,
        name: adultUse.businessName,
        city: adultUse.city,
        status: adultUse.status,
        expiresAt: adultUse.expiresAt,
        hasViolations: adultUse.hasViolations,
        violationCount: violations.length,
        violations: violations.map(v => ({
          date: v.violationDate,
          action: v.action,
          fineAmount: v.settledFineAmount,
          documentUrl: v.documentUrl,
        })),
        lastSyncedAt: adultUse.lastSyncedAt,
      };
    }

    return { found: false, registrationNumber: regNum };
  },
});

/**
 * Get comprehensive market statistics (internal version for HTTP endpoint)
 */
export const getMarketStatsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const [dispensaries, caregivers, adultUseLicensees, salesData, violations] = await Promise.all([
      ctx.db.query("maineMedicalDispensaries").collect(),
      ctx.db.query("maineMedicalCaregivers").collect(),
      ctx.db.query("maineAdultUseLicensees").collect(),
      ctx.db.query("maineSalesData").order("desc").take(24),
      ctx.db.query("maineComplianceViolations").order("desc").take(200),
    ]);

    // Medical dispensary stats
    const medicalDispensaryStats = {
      total: dispensaries.length,
      active: dispensaries.filter(d => d.status === "active").length,
      conditional: dispensaries.filter(d => d.status === "conditional").length,
      suspended: dispensaries.filter(d => d.status === "suspended").length,
      withViolations: dispensaries.filter(d => d.hasViolations).length,
    };

    // Caregiver stats
    const caregiverStats = {
      total: caregivers.length,
      active: caregivers.filter(c => c.status === "active").length,
      suspended: caregivers.filter(c => c.status === "suspended").length,
      revoked: caregivers.filter(c => c.status === "revoked").length,
      withViolations: caregivers.filter(c => c.hasViolations).length,
    };

    // Adult use stats by license type
    const adultUseStats = {
      total: adultUseLicensees.length,
      active: adultUseLicensees.filter(l => l.status === "active").length,
      byType: {} as Record<string, number>,
    };
    for (const l of adultUseLicensees) {
      adultUseStats.byType[l.licenseType] = (adultUseStats.byType[l.licenseType] || 0) + 1;
    }

    // Sales data - calculate YTD
    const currentYear = new Date().getFullYear();
    const currentYearSales = salesData.filter(s => s.year === currentYear);

    const salesStats = {
      ytdMedical: currentYearSales.reduce((sum, s) => sum + (s.medicalSales || 0), 0),
      ytdAdultUse: currentYearSales.reduce((sum, s) => sum + (s.adultUseSales || 0), 0),
      ytdTotal: currentYearSales.reduce((sum, s) => sum + s.totalSales, 0),
      monthsReported: currentYearSales.length,
      latestMonth: salesData[0] || null,
    };

    // Violation stats
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    const recentViolations = violations.filter(v => v.violationDate > ninetyDaysAgo);

    const violationStats = {
      totalAllTime: violations.length,
      last90Days: recentViolations.length,
      byAction: {
        suspended: violations.filter(v => v.action.toLowerCase().includes("suspend")).length,
        revoked: violations.filter(v => v.action.toLowerCase().includes("revoke")).length,
      },
      totalFines: violations.reduce((sum, v) => sum + (v.settledFineAmount || 0), 0),
    };

    // Last sync times
    const lastSyncTimes = {
      dispensaries: dispensaries.length > 0 ? Math.max(...dispensaries.map(d => d.lastSyncedAt)) : null,
      caregivers: caregivers.length > 0 ? Math.max(...caregivers.map(c => c.lastSyncedAt)) : null,
      adultUse: adultUseLicensees.length > 0 ? Math.max(...adultUseLicensees.map(l => l.lastSyncedAt)) : null,
    };

    return {
      medicalDispensaryStats,
      caregiverStats,
      adultUseStats,
      salesStats,
      violationStats,
      lastSyncTimes,
      generatedAt: Date.now(),
    };
  },
});
