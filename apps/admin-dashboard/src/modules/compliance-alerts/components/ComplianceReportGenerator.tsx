/**
 * ComplianceReportGenerator Component
 * Generates compliance reports for regulatory audits
 */

import { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Button,
  Select,
  FormControl,
  FormLabel,
  Input,
  Text,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Divider,
  useToast,
  Alert,
  AlertIcon,
  Badge,
  Spinner,
  SimpleGrid,
  Icon,
} from "@chakra-ui/react";
import {
  DocumentArrowDownIcon,
  DocumentTextIcon,
  TableCellsIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface ComplianceReportGeneratorProps {
  dispensaryId?: Id<"dispensaries">;
}

type ReportType = "full_audit" | "resolutions" | "flagged_products" | "advisories";

interface ReportConfig {
  id: ReportType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const REPORT_TYPES: ReportConfig[] = [
  {
    id: "full_audit",
    label: "Full Compliance Audit",
    description: "Complete audit trail with all advisories, matches, and resolutions",
    icon: DocumentTextIcon,
  },
  {
    id: "resolutions",
    label: "Resolution Summary",
    description: "Summary of all resolved compliance issues with actions taken",
    icon: CheckCircleIcon,
  },
  {
    id: "flagged_products",
    label: "Flagged Products Report",
    description: "Current list of products flagged by compliance alerts",
    icon: ExclamationTriangleIcon,
  },
  {
    id: "advisories",
    label: "OCP Advisories Log",
    description: "Complete log of all OCP advisories received",
    icon: TableCellsIcon,
  },
];

export function ComplianceReportGenerator({ dispensaryId }: ComplianceReportGeneratorProps) {
  const toast = useToast();
  const [reportType, setReportType] = useState<ReportType>("full_audit");
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isGenerating, setIsGenerating] = useState(false);

  // Get report data based on type
  const advisories = useQuery(api.ocpAdvisories.list, {
    status: undefined,
    severity: undefined,
    limit: 100,
  });

  const flaggedProducts = useQuery(
    api.ocpAdvisories.getMatchesForDispensary,
    dispensaryId
      ? {
          dispensaryId,
          status: undefined,
          limit: 100,
        }
      : "skip"
  );

  const selectedConfig = REPORT_TYPES.find((r) => r.id === reportType);

  const generateCSV = (data: any[], headers: string[], filename: string) => {
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header.toLowerCase().replace(/ /g, "_")] ?? "";
          // Escape CSV special characters
          const stringValue = String(value);
          if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleGenerateReport = async () => {
    if (!dispensaryId && reportType !== "advisories") {
      toast({
        title: "Dispensary Required",
        description: "Please select a dispensary to generate this report",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    setIsGenerating(true);

    try {
      const dateRange = `${startDate}_to_${endDate}`;
      const timestamp = format(new Date(), "yyyyMMdd_HHmmss");

      switch (reportType) {
        case "advisories": {
          if (!advisories?.advisories) {
            throw new Error("No advisory data available");
          }

          const data = advisories.advisories
            .filter((a) => {
              const issued = new Date(a.issuedAt);
              return (
                issued >= startOfDay(new Date(startDate)) &&
                issued <= endOfDay(new Date(endDate))
              );
            })
            .map((a) => ({
              ocp_id: a.ocpAdvisoryId,
              title: a.title,
              severity: a.severity,
              status: a.status,
              issued_date: format(new Date(a.issuedAt), "yyyy-MM-dd"),
              description: a.description,
              contaminants: a.contaminants?.join("; ") ?? "",
              affected_products: a.affectedProducts?.join("; ") ?? "",
              affected_strains: a.affectedStrains?.join("; ") ?? "",
              source_url: a.sourceUrl ?? "",
            }));

          generateCSV(
            data,
            [
              "OCP_ID",
              "Title",
              "Severity",
              "Status",
              "Issued_Date",
              "Description",
              "Contaminants",
              "Affected_Products",
              "Affected_Strains",
              "Source_URL",
            ],
            `ocp_advisories_${dateRange}_${timestamp}.csv`
          );
          break;
        }

        case "flagged_products": {
          if (!flaggedProducts) {
            throw new Error("No flagged product data available");
          }

          const data = flaggedProducts.map((match) => ({
            product_name: match.product?.name ?? "Unknown",
            brand: match.product?.brand ?? "",
            batch_number: match.product?.batchNumber ?? "",
            advisory_id: match.advisory?.ocpAdvisoryId ?? "",
            advisory_title: match.advisory?.title ?? "",
            severity: match.advisory?.severity ?? "",
            match_type: match.matchType,
            match_value: match.matchedValue,
            confidence: `${Math.round(match.matchConfidence * 100)}%`,
            status: match.status,
            flagged_date: format(new Date(match.flaggedAt), "yyyy-MM-dd HH:mm"),
            quantity_affected: match.quantityAffected ?? 0,
          }));

          generateCSV(
            data,
            [
              "Product_Name",
              "Brand",
              "Batch_Number",
              "Advisory_ID",
              "Advisory_Title",
              "Severity",
              "Match_Type",
              "Match_Value",
              "Confidence",
              "Status",
              "Flagged_Date",
              "Quantity_Affected",
            ],
            `flagged_products_${dateRange}_${timestamp}.csv`
          );
          break;
        }

        case "resolutions": {
          if (!flaggedProducts) {
            throw new Error("No resolution data available");
          }

          const resolved = flaggedProducts.filter(
            (m) => m.status === "resolved" || m.status === "false_positive"
          );

          const data = resolved.map((match) => ({
            product_name: match.product?.name ?? "Unknown",
            advisory_id: match.advisory?.ocpAdvisoryId ?? "",
            advisory_title: match.advisory?.title ?? "",
            resolution_action: match.resolutionAction ?? "",
            resolution_notes: match.resolutionNotes ?? "",
            resolved_date: match.resolvedAt
              ? format(new Date(match.resolvedAt), "yyyy-MM-dd HH:mm")
              : "",
            quantity_affected: match.quantityAffected ?? 0,
            quantity_resolved: match.quantityResolved ?? 0,
            status: match.status,
          }));

          generateCSV(
            data,
            [
              "Product_Name",
              "Advisory_ID",
              "Advisory_Title",
              "Resolution_Action",
              "Resolution_Notes",
              "Resolved_Date",
              "Quantity_Affected",
              "Quantity_Resolved",
              "Status",
            ],
            `resolutions_${dateRange}_${timestamp}.csv`
          );
          break;
        }

        case "full_audit": {
          // Generate comprehensive audit report with multiple sections
          const auditData: string[] = [];
          auditData.push("COMPLIANCE AUDIT REPORT");
          auditData.push(`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`);
          auditData.push(`Date Range: ${startDate} to ${endDate}`);
          auditData.push("");
          auditData.push("=".repeat(80));
          auditData.push("");

          // Summary section
          auditData.push("SUMMARY");
          auditData.push("-".repeat(40));
          auditData.push(`Total Advisories: ${advisories?.advisories?.length ?? 0}`);
          auditData.push(`Total Flagged Products: ${flaggedProducts?.length ?? 0}`);
          auditData.push(
            `Resolved: ${flaggedProducts?.filter((m) => m.status === "resolved").length ?? 0}`
          );
          auditData.push(
            `Pending: ${flaggedProducts?.filter((m) => m.status === "pending").length ?? 0}`
          );
          auditData.push(
            `False Positives: ${flaggedProducts?.filter((m) => m.status === "false_positive").length ?? 0}`
          );
          auditData.push("");

          // Advisories section
          auditData.push("=".repeat(80));
          auditData.push("OCP ADVISORIES");
          auditData.push("-".repeat(40));

          if (advisories?.advisories) {
            for (const advisory of advisories.advisories) {
              auditData.push(`[${advisory.ocpAdvisoryId}] ${advisory.title}`);
              auditData.push(`  Severity: ${advisory.severity.toUpperCase()}`);
              auditData.push(`  Status: ${advisory.status}`);
              auditData.push(`  Issued: ${format(new Date(advisory.issuedAt), "yyyy-MM-dd")}`);
              if (advisory.contaminants?.length) {
                auditData.push(`  Contaminants: ${advisory.contaminants.join(", ")}`);
              }
              auditData.push("");
            }
          }

          // Flagged products section
          auditData.push("=".repeat(80));
          auditData.push("FLAGGED PRODUCTS");
          auditData.push("-".repeat(40));

          if (flaggedProducts) {
            for (const match of flaggedProducts) {
              auditData.push(`Product: ${match.product?.name ?? "Unknown"}`);
              auditData.push(`  Advisory: ${match.advisory?.ocpAdvisoryId ?? ""}`);
              auditData.push(`  Status: ${match.status}`);
              auditData.push(
                `  Flagged: ${format(new Date(match.flaggedAt), "yyyy-MM-dd HH:mm")}`
              );
              if (match.resolvedAt) {
                auditData.push(
                  `  Resolved: ${format(new Date(match.resolvedAt), "yyyy-MM-dd HH:mm")}`
                );
                auditData.push(`  Resolution: ${match.resolutionAction ?? "N/A"}`);
              }
              auditData.push("");
            }
          }

          // Download as text file
          const blob = new Blob([auditData.join("\n")], {
            type: "text/plain;charset=utf-8;",
          });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `compliance_audit_${dateRange}_${timestamp}.txt`;
          link.click();
          URL.revokeObjectURL(link.href);
          break;
        }
      }

      toast({
        title: "Report Generated",
        description: `Your ${selectedConfig?.label} has been downloaded`,
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Report Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Report Type Selection */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {REPORT_TYPES.map((config) => (
            <Card
              key={config.id}
              variant="outline"
              cursor="pointer"
              onClick={() => setReportType(config.id)}
              borderColor={reportType === config.id ? "blue.500" : "gray.200"}
              borderWidth={reportType === config.id ? 2 : 1}
              bg={reportType === config.id ? "blue.50" : "white"}
              _hover={{ borderColor: "blue.300" }}
              transition="all 0.2s"
            >
              <CardBody>
                <HStack spacing={4}>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg={reportType === config.id ? "blue.100" : "gray.100"}
                  >
                    <Icon
                      as={config.icon}
                      boxSize={6}
                      color={reportType === config.id ? "blue.600" : "gray.600"}
                    />
                  </Box>
                  <Box flex={1}>
                    <HStack>
                      <Text fontWeight="semibold">{config.label}</Text>
                      {reportType === config.id && (
                        <Badge colorScheme="blue" size="sm">
                          Selected
                        </Badge>
                      )}
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                      {config.description}
                    </Text>
                  </Box>
                </HStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        <Divider />

        {/* Date Range Selection */}
        <Card variant="outline">
          <CardHeader pb={2}>
            <Heading size="sm">Date Range</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <HStack spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Start Date</FormLabel>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  size="sm"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">End Date</FormLabel>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  size="sm"
                />
              </FormControl>
              <VStack spacing={1} align="flex-start" pt={6}>
                <HStack spacing={2}>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setStartDate(format(subDays(new Date(), 7), "yyyy-MM-dd"));
                      setEndDate(format(new Date(), "yyyy-MM-dd"));
                    }}
                  >
                    Last 7 Days
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setStartDate(format(subDays(new Date(), 30), "yyyy-MM-dd"));
                      setEndDate(format(new Date(), "yyyy-MM-dd"));
                    }}
                  >
                    Last 30 Days
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setStartDate(format(subDays(new Date(), 90), "yyyy-MM-dd"));
                      setEndDate(format(new Date(), "yyyy-MM-dd"));
                    }}
                  >
                    Last 90 Days
                  </Button>
                </HStack>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        {/* Data Availability Info */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="medium">Report Data Available</Text>
            <Text fontSize="sm">
              {advisories?.advisories?.length ?? 0} advisories and{" "}
              {flaggedProducts?.length ?? 0} product matches will be included based on current
              filters.
            </Text>
          </Box>
        </Alert>

        {/* Generate Button */}
        <Button
          colorScheme="blue"
          size="lg"
          leftIcon={isGenerating ? <Spinner size="sm" /> : <DocumentArrowDownIcon width={20} />}
          onClick={handleGenerateReport}
          isLoading={isGenerating}
          loadingText="Generating Report..."
        >
          Generate {selectedConfig?.label}
        </Button>

        <Text fontSize="xs" color="gray.500" textAlign="center">
          Reports are generated as CSV files for easy import into spreadsheet applications. Full
          Audit reports are generated as formatted text files.
        </Text>
      </VStack>
    </Box>
  );
}
