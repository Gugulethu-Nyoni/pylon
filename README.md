# Pylon: SaaS Feature Guard, Metering, and Billing Module Documentation

**Package:** `@semantq/pylon`

Pylon is the robust, opinionated module for the SemantqQL framework, providing enterprise-grade **SaaS feature gating, usage metering, and billing logic**. It is designed to work seamlessly with your existing Prisma data models, offering both **CRUD-based metering** and flexible **Non-CRUD feature management**.

## Installation

From your project root: run: `cd semantqQL` and run: `npm i @semantq/pylon`

This will install the Pylon module in your app backend server. 

## I. Core Concepts & Architecture

Pylon operates on a clear separation of concerns:

1.  **Entitlement (Static):** Defines *what* features are available and the *limits* for an organization's selected **Pricing Package**. This is static data managed by the Superadmin.
2.  **Usage (Dynamic):** Tracks the *real-time consumption* against those limits. This is dynamic data managed by Pylon's internal service.
3.  **Guard (Enforcement):** Middleware that intercepts requests to validate both Entitlement and Usage before allowing access to an application resource.

### Data Flow Overview

The core feature validation relies on three main data sources:

| Data Source | Location | Purpose |
| :--- | :--- | :--- |
| **Feature Entitlement** | `PricingPackageFeature` & `Feature` tables | Defines the *limit* for the organization's plan. |
| **Metering (Usage Tracking)** | `Metering` table | Stores the *current consumption* for all metered features. |
| **Custom Overrides** | `Organization.settings` & `User.userSettings` | Allows Enterprise customization and user-level restrictions. |

## II. Setup and Model Manifest Generation

Pylon's initial setup generates a list of meterable resources from your Prisma schema.

### 1\. Generating the Model Manifest

The `npm run init` process executes `createModelManifest`, which inspects your `schema.prisma` and creates a manifest of billable models, excluding core system models (like `User`, `AuthLog`, Pylon tables, etc.).

**Action:**

`cd semantqQL` from your project root (on the terminal) and run this command:

```bash
npm run init
```

**Output:** A file is generated at `lib/models_manifest.js`, which serves as the source of truth for features that can be metered by CRUD actions.

**Example Manifest (Simplified):**

```javascript
export default {
    "Post": {
    "id": 1,
    "name": "Post"
  },
  "PostStat": {
    "id": 2,
    "name": "PostStat"
  },
  "Comment": {
    "id": 3,
    "name": "Comment"
  }
};

```

### 2\. Superadmin Feature Management

The Superadmin uses this manifest to create feature entries in the **`Feature`** table for both CRUD and Non-CRUD items.

| Feature Type | How Pylon Uses It | Example Feature Name |
| :--- | :--- | :--- |
| **CRUD** | Pylon combines the **Model Name** and the **Action** (`create`, `read`, `update`, `delete`). | `Form_create` |
| **Non-CRUD** | Pylon uses the unique **Feature Name** defined by the Superadmin. | `submission_analytics` |


## III. Backend Integration: Feature Guarding and Metering

Pylon handles the heavy lifting of server-side feature enforcement using middleware.

### 1\. Guarding CRUD Model Routes (Server-Side)

The `semantq make:resource` command is the standard way to scaffold MVCSR resources with built-in Pylon integration.

**Command Syntax:**

```bash
semantq make:resource [ModelName] -pylon 
// Example: semantq make:resource Form -pylon
```

**Resulting Route Guard:**
The generated routes file (`/routes/form.js`) will automatically include the Pylon guard middleware.

```javascript
// Example: forms/routes.js
import pylonService from '@semantq/pylon/services/pylonService.js'; 

// POST Route for creating a new form
router.post('/forms', 
    authenticateToken, 
    pylonService.featureGuard('Form', 'create'), // <-- Pylon Middleware
    formController.createForm
);
```

**`pylonService.featureGuard(model, action)`:**

1.  **Looks up:** The required feature (e.g., `Form_create`) based on the authenticated user's organization plan.
2.  **Checks Usage:** Consults the `Metering` table for the current consumption of the `Form_create` feature.
3.  **Checks Limits:** Compares current usage against the limit defined in the `PricingPackageFeature`.
4.  **Checks Overrides:** Applies any restrictions from `User.userSettings` or custom limits from `Organization.settings`.
5.  **DENY/ALLOW:** If denied, the request is blocked with a 403 Forbidden error; if allowed, the request proceeds to `formController.createForm`.

### 2\. Metering Non-CRUD Features (Server-Side Service)

Non-CRUD actions (like generating a report or sending a bulk email) require explicit calls to Pylon's metering service **after** a successful action, or a pre-check **before** the action.

The service uses the dedicated **`Metering`** table for performant counter management.

| Action | Pylon Method | Description |
| :--- | :--- | :--- |
| **Pre-Check** | `pylonService.canAccess(orgId, featureKey)` | Use before running a feature (e.g., check if the user can send a bulk email). |
| **Increment** | `pylonService.incrementUsage(orgId, featureKey, count)` | Use after a successful action to update the `QuotaUsage` table atomically. |

**Example: Generating a Screentime Report:**

```javascript
// forms/service/analyticsService.js

async function generateScreentimeReport(organizationId) {
    const featureKey = 'screentime_report';

    // 1. Check Entitlement and Usage BEFORE running the report
    const allowed = await pylonService.canAccess(organizationId, featureKey);

    if (!allowed) {
        throw new Error('Feature limit exceeded. Upgrade required.');
    }

    // --- Core Logic ---
    const report = await fetchAndProcessData(); 
    // ------------------

    // 2. Log and Increment Usage AFTER successful execution
    await pylonService.incrementUsage(organizationId, featureKey, 1);
    
    return report;
}
```

## IV. Frontend Integration: Non-CRUD Feature Management

For a seamless user experience, the frontend must hide or disable features the user is not entitled to. This is achieved by passing a consolidated features object to the client.

### 1\. Consolidating the Feature Object

On user login or organizational context load, Pylon consolidates all features and usage into a single JSON object (The **Account Features Object**).

This process involves:

1.  Fetching limits from `PricingPackageFeature`.
2.  Fetching real-time usage from `Metering`.
3.  Merging custom overrides from `Organization.settings` and `User.userSettings`.

**Example Output (Sent to Frontend):**

```json
{
  "analytics": {
    "screentime": {
      "enabled": true,
      "monthly_limit": 3,
      "current_month_usage": 2
    }
  },
  "dataExport": {
    "excel_export": { "enabled": false },
    "csv_export": { "enabled": true }
  }
}
```

### 2\. Modular Frontend Gating

Frontend modules (e.g., the Analytics Module, the Form Builder Module) consume this object to gate UI elements.

**A. UI Gating (Hiding/Disabling Elements):**

The goal is to produce a single, comprehensive "Features Object" by starting with the most restrictive layer (the base package) and applying more permissive/customized layers (Org/User overrides), while ensuring the strictest rule (e\*\*g.\* a user restriction) always takes precedence where limits or access are concerned.

Here is a demonstration of the consolidation logic in a functional JavaScript (Node.js/Pylon Service) format.


## Pylon Feature Consolidation Demo (Cascading Merge)

This example demonstrates how the final effective features are built for a specific user, combining the defaults, the package limits, and any organization or user overrides.

### 1\. Data Definitions (Source Data)

We define the features across four logical layers:

```javascript
// A. MASTER MODULE DEFAULTS (Highest possible limits/access)
const MASTER_ANALYTICS_DEFAULTS = {
    screentime: {
        enabled: true,
        monthly_limit: 9999, // Essentially unlimited default
        can_restrict: true,  // Metadata: indicates if this can be restricted by user/org
    },
    conversion_funnels: {
        enabled: true,
        can_restrict: true,
    },
    export_formats: {
        enabled: true,
        allowed: ['csv', 'excel', 'api'],
    }
};

// B. PRICING PACKAGE LIMITS (The baseline for the organization's plan)
// Derived from Feature.nonCrudDefinition + PricingPackageFeature.nonCrudLimitsJson
const PACKAGE_FEATURES = {
    screentime: {
        enabled: true,
        monthly_limit: 3, // Starter plan limit
    },
    conversion_funnels: {
        enabled: false, // Starter plan does not include funnels
    },
    export_formats: {
        enabled: true,
        allowed: ['csv', 'excel'],
    }
};

// C. ORGANIZATION CUSTOMIZATIONS (Custom limit increase, or configuration)
// Derived from Organization.settings
const ORG_SETTINGS_OVERRIDES = {
    // Custom negotiated limit for screentime
    screentime: {
        monthly_limit: 5, // Increase from package limit of 3
    },
    // Org-level setting to add a custom export format
    export_formats: {
        allowed: ['csv', 'excel', 'pdf'], // PDF is custom
    }
};

// D. USER RESTRICTIONS (A specific user's permissions, most restrictive)
// Derived from User.userSettings
const USER_RESTRICTIONS = {
    // User is blocked from accessing the funnels feature, even if the plan gets it
    conversion_funnels: {
        enabled: false, 
    },
    // User cannot export Excel files, even if the Org plan allows it
    export_formats: {
        allowed: ['csv'], 
    }
};

// E. REAL-TIME USAGE (Dynamic data, fetched from Metering table)
const REAL_TIME_USAGE = {
    screentime: {
        current_month_usage: 4, 
    }
};
```

### 2\. Pylon Consolidation Logic (`getEffectiveFeatures`)

The core logic uses a deep merge utility (like `lodash.merge` or similar custom recursion) to combine settings, respecting the rule hierarchy.

```javascript
/**
 * Pylon Service: Combines features from all sources to create the final, effective object.
 * Hierarchy: MASTER DEFAULTS -> PACKAGE LIMITS -> ORG OVERRIDES -> USER RESTRICTIONS
 */
function getEffectiveFeatures(master, pkg, org, user, usage) {
    let effective = {};

    // 1. Start with Package Limits (Most restrictive baseline access/limits)
    //    Note: We generally skip master defaults unless a feature is MISSING entirely.
    effective = deepMerge({}, pkg);

    // 2. Apply Organization Customizations (Mostly permissive: increase limits, add config)
    //    We merge this over the package limits.
    effective = deepMerge(effective, org);

    // 3. Apply User Restrictions (Highest precedence for *denial/restriction*)
    //    This merge must ensure a restriction (e.g., 'enabled: false') overrides a permission ('enabled: true').
    effective = deepMerge(effective, user);
    
    // 4. Inject Real-Time Usage (Dynamic, non-overriding data)
    //    We loop through the usage and inject it into the final structure.
    for (const key in usage) {
        if (effective[key]) {
            effective[key] = { ...effective[key], ...usage[key] };
        }
    }

    return effective;
}

// Execute the consolidation
const FINAL_FEATURES = getEffectiveFeatures(
    MASTER_ANALYTICS_DEFAULTS, 
    PACKAGE_FEATURES, 
    ORG_SETTINGS_OVERRIDES, 
    USER_RESTRICTIONS,
    REAL_TIME_USAGE
);

console.log(JSON.stringify(FINAL_FEATURES, null, 2));
```

### 3\. Consolidated Output (Effective Feature Set)

The final object sent to the frontend reflects the effective access and limits for this specific user:

```json
{
  "screentime": {
    "enabled": true,
    "monthly_limit": 5, // TAKEN FROM ORG SETTINGS (Override of 3)
    "current_month_usage": 4 // TAKEN FROM REAL-TIME USAGE
  },
  "conversion_funnels": {
    "enabled": false // TAKEN FROM USER RESTRICTIONS (Override of plan/default)
  },
  "export_formats": {
    "enabled": true,
    "allowed": [
      "csv" // TAKEN FROM USER RESTRICTIONS (Most restrictive rule applied)
    ]
  }
}
```

This resulting object is exactly what the frontend uses to render the UI, showing the user their limit is **5** (from the org override) and their access to `conversion_funnels` is **blocked** (from the user restriction).

**B. Critical Warning (Server Validation is Final):**
**The frontend feature object is for UI/UX only.**
**Every user request involving a billable feature is validated by the `pylonService.featureGuard()` on the server for maximum security.**

