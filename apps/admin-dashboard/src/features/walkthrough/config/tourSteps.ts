/**
 * Tour Steps Configuration
 * 12-step guided tour for Risk Scoring and OCP Compliance
 * Migrated from react-joyride to driver.js
 */

import type { DriveStep } from 'driver.js';

export const complianceRiskTourSteps: DriveStep[] = [
  {
    element: '[data-tour="compliance-page-header"]',
    popover: {
      title: 'Welcome to Compliance Alert Center',
      description:
        'This is your central hub for monitoring OCP (Oregon Cannabis Portal) advisories and managing compliance across your inventory. Let\'s walk through the key features.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="alert-summary-cards"]',
    popover: {
      title: 'At-a-Glance Compliance Status',
      description:
        'These cards show your current compliance health: active alerts, items pending review, affected products, and resolution metrics. Red numbers need immediate attention.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="advisory-table"]',
    popover: {
      title: 'What are OCP Advisories?',
      description:
        'OCP advisories are official alerts from regulators about recalls, contamination, or labeling issues. This table shows all advisories that may affect your inventory.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="advisory-table-row"]',
    popover: {
      title: 'Advisory Details',
      description:
        'Each row shows the advisory title, type (recall, contamination, etc.), severity level, publication date, and current status. Click any row to view full details.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="flagged-products-tab"]',
    popover: {
      title: 'Your Affected Inventory',
      description:
        'The Flagged Products tab shows inventory items that match active advisories. This is where you\'ll spend most of your time resolving compliance issues.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="resolve-button"]',
    popover: {
      title: 'Resolution Workflow',
      description:
        'Click "Resolve" to open the compliance resolution workflow. You can remove products, return to supplier, quarantine for testing, or dismiss false positives - all with full audit logging.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="audit-trail"]',
    popover: {
      title: 'Compliance Audit Trail',
      description:
        'Every action is logged for regulatory compliance. The audit trail shows who did what, when, and why - essential for inspections and record-keeping.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="risk-summary-cards"]',
    popover: {
      title: 'Supplier Risk Overview',
      description:
        'Now let\'s look at supplier risk. These cards summarize your supplier risk landscape: high-risk suppliers, recent incidents, worsening trends, and products at risk.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="supplier-risk-table"]',
    popover: {
      title: 'Supplier Risk Rankings',
      description:
        'This table ranks all your suppliers by risk score. Sort by any column to identify problem suppliers. Higher scores indicate more compliance risk.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="risk-score-card"]',
    popover: {
      title: 'Understanding Risk Scores',
      description:
        'Risk scores (0-100) are calculated from contamination incidents, recalls, labeling issues, and historical trends. The algorithm weights recent incidents more heavily.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="incident-timeline"]',
    popover: {
      title: 'Incident History',
      description:
        'The timeline shows a supplier\'s complete incident history. Look for patterns - repeated issues suggest systemic problems that may require supplier changes.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="start-demo-button"]',
    popover: {
      title: 'Tour Complete!',
      description:
        'You now understand OCP compliance and supplier risk scoring. Click "Start Demo" anytime to replay this tour. Questions? Check the documentation or contact support.',
      side: 'bottom',
      align: 'start',
    },
  },
];

export const tourConfig = {
  'compliance-risk-overview': {
    steps: complianceRiskTourSteps,
    title: 'Compliance & Risk Overview',
    description: 'Learn about OCP advisories and supplier risk scoring',
  },
};
