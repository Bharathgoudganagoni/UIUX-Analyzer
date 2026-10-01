// Demo data for showcase mode
// Clearly labeled as demo - not live AI results

export const DEMO_ANALYSIS = {
  summary:
    "This interface has several opportunities for improvement. The primary concerns are weak visual hierarchy, inconsistent spacing, and potential accessibility gaps. The color palette lacks sufficient contrast in key areas, and the navigation structure could be simplified for better user flow.",
  categories: {
    layout: {
      issues: [
        {
          title: "Unbalanced grid structure",
          description: "The main content area uses inconsistent column widths, creating visual imbalance that makes the interface feel unstructured.",
          whyItMatters: "A well-structured grid creates visual rhythm and makes content easier to scan. Inconsistencies interrupt the natural reading flow and signal lack of design intentionality.",
          recommendation: "Adopt a consistent 12-column grid system with defined gutters. Ensure all content blocks align to the same column boundaries.",
          severity: "medium",
        },
        {
          title: "Insufficient content breathing room",
          description: "Content sections appear cramped with minimal margin between distinct functional areas.",
          whyItMatters: "White space is not wasted space — it guides the eye and groups related content. Without it, users struggle to distinguish sections.",
          recommendation: "Increase section padding to at least 48px vertically. Use negative space deliberately to separate functional groups.",
          severity: "high",
        },
      ],
    },
    typography: {
      issues: [
        {
          title: "Weak heading hierarchy",
          description: "Heading levels appear visually similar, making it difficult to distinguish H1 from H2 and H3 elements.",
          whyItMatters: "Typography hierarchy guides users through content in a logical order. Without clear differentiation, users cannot quickly identify the most important information.",
          recommendation: "Establish a clear type scale (e.g., 48px / 32px / 24px / 18px) with distinct weight variations. Use a ratio like 1.25 or 1.333 for consistent scaling.",
          severity: "high",
        },
        {
          title: "Body text readability",
          description: "Body copy appears to use a font size below recommended minimums for web readability.",
          whyItMatters: "Text below 16px on body copy significantly reduces readability, particularly for users with visual impairments.",
          recommendation: "Set body copy to a minimum of 16px. Use a line-height of 1.5–1.7 for comfortable reading. Ensure sufficient contrast against the background.",
          severity: "medium",
        },
      ],
    },
    color: {
      issues: [
        {
          title: "Primary action lacks sufficient contrast",
          description: "The primary call-to-action button may not meet WCAG 2.1 AA contrast requirements against its background.",
          whyItMatters: "Low contrast buttons are difficult to read for users with visual impairments and reduce click-through rates for all users.",
          recommendation: "Ensure a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text. Use a tool like the WebAIM Contrast Checker to verify.",
          severity: "high",
        },
        {
          title: "Inconsistent semantic color usage",
          description: "Success, warning, and error states use colors that are visually similar, making it hard to distinguish feedback types.",
          whyItMatters: "Users rely on color semantics to understand system feedback quickly. Inconsistent usage increases cognitive load and errors.",
          recommendation: "Define a clear semantic color system: green for success, amber for warnings, red for errors. Ensure each is perceptually distinct.",
          severity: "medium",
        },
      ],
    },
    spacing: {
      issues: [
        {
          title: "Inconsistent spacing units",
          description: "Spacing values appear arbitrary rather than following a consistent spacing scale.",
          whyItMatters: "Consistent spacing creates visual harmony and predictability. Arbitrary values make the design feel amateur and are harder to maintain.",
          recommendation: "Adopt an 8px base spacing system. Use multiples of 8 (8, 16, 24, 32, 48, 64) for all margins and padding values.",
          severity: "medium",
        },
      ],
    },
    hierarchy: {
      issues: [
        {
          title: "Primary CTA has weak visual prominence",
          description: "The main call-to-action does not stand out sufficiently from secondary actions, potentially causing users to miss it.",
          whyItMatters: "Users need to identify the primary action immediately. Weak hierarchy forces users to evaluate every element, increasing cognitive load.",
          recommendation: "Increase visual weight of the primary CTA through size, color contrast, and surrounding white space. Secondary actions should be visually subordinate.",
          severity: "high",
        },
      ],
    },
    accessibility: {
      issues: [
        {
          title: "Interactive elements may lack focus indicators",
          description: "Focus styles for keyboard navigation appear to be suppressed or insufficient.",
          whyItMatters: "Keyboard users and users with motor impairments rely on visible focus indicators to navigate. Removing them creates a significant accessibility barrier.",
          recommendation: "Implement visible focus styles for all interactive elements. Use outline or box-shadow with sufficient color and thickness (min 2px).",
          severity: "high",
        },
        {
          title: "Images may be missing alternative text",
          description: "Several images appear to lack descriptive alt attributes.",
          whyItMatters: "Screen reader users cannot understand image content without alt text. This is a WCAG 2.1 Level A failure.",
          recommendation: "Add descriptive alt text to all informational images. Decorative images should have empty alt attributes (alt='').",
          severity: "high",
        },
      ],
    },
  },
  recommendations: [
    "Establish a comprehensive design system with consistent tokens for color, spacing, and typography",
    "Conduct a full WCAG 2.1 AA accessibility audit using automated and manual testing",
    "Redesign the information hierarchy to make the primary user goal immediately clear",
    "Implement responsive breakpoints with mobile-first approach",
  ],
  redesignInstructions: [
    "Apply 8px base spacing system throughout",
    "Increase heading scale contrast and visual weight",
    "Improve primary CTA visual prominence",
    "Ensure all interactive elements meet WCAG focus requirements",
    "Apply consistent semantic color system",
  ],
};
