# pylon
Feature Guard Package For SaaS Aaplications


## SuperAdmin Setup Flow: Theoretical Model Relationships

### **Step 1: Define Features (Foundation)**
**Model: `Feature`**
```
Critical Columns:
- id (UUID)
- name (UNIQUE) → "form_create", "bulk_email", "display_stats"
- meterType → COUNT | ON_OFF
- timeframe → MONTHLY | YEARLY | FOREVER | null
- unit → "forms", "emails", "access"
- description → "Monthly form creation limit"
```

**Purpose:** Catalog of all possible billable features in the system.

---

### **Step 2: Create Pricing Packages (Product Tiers)**
**Model: `PricingPackage`**
```
Critical Columns:
- id (UUID) 
- name → "Freemium", "Starter", "Pro"
- priceMonthly → 0, 29, 99
```

**Purpose:** Define the subscription tiers available to organizations.

---

### **Step 3: Connect Features to Packages (Feature Gates)**
**Model: `PricingPackageFeature`** (Junction Table)
```
Critical Columns:
- pricingPackageId (FK to PricingPackage)
- featureId (FK to Feature)
- status → true | false (is feature enabled in this package?)
- limitValue → 3, 50, 500, null (max usage for COUNT features)
```

**Purpose:** Define exactly what features each pricing package includes and their limits.

---

### **Step 4: Assign Organizations to Packages**
**Model: `Organization`**
```
Critical Columns:
- id (UUID)
- pricingPackageId (FK to PricingPackage)
```

**Purpose:** Connect each customer organization to their subscription tier.

---

### **Step 5: Automatic Metering Creation (Runtime)**
**Model: `Metering`**
```
Critical Columns:
- organizationId (FK to Organization) 
- featureId (FK to Feature)
- currentValue → 0, 1, 2, 3... (current usage count)
- periodStart → 2024-01-01 (start of current period)
- periodEnd → 2024-02-01 (end of current period)
```

**Purpose:** Track real-time usage per organization per feature. Created automatically when first used.

---

## Complete Setup Flow Diagram:

```
[Feature] (1) ←--- [PricingPackageFeature] (n) ---→ (1) [PricingPackage] (1) ---→ (n) [Organization]
     ↓                                                              ↓
     └-------------------→ (n) [Metering] (1) ←---------------------┘
                         (usage tracking)
```

## SuperAdmin Setup Sequence:

### **PHASE 1: System Foundation**
1. **Create Features:**
   ```
   Feature 1: name="form_create", meterType=COUNT, timeframe=MONTHLY, unit="forms"
   Feature 2: name="bulk_email", meterType=COUNT, timeframe=MONTHLY, unit="emails"  
   Feature 3: name="display_stats", meterType=ON_OFF, timeframe=null, unit="access"
   ```

### **PHASE 2: Product Packaging**
2. **Create Pricing Packages:**
   ```
   Package 1: name="Freemium", priceMonthly=0
   Package 2: name="Starter", priceMonthly=29  
   Package 3: name="Pro", priceMonthly=99
   ```

3. **Assign Features to Packages:**
   ```
   Freemium + form_create → status=true, limitValue=3
   Freemium + bulk_email → status=false, limitValue=0
   Freemium + display_stats → status=false, limitValue=0
   
   Starter + form_create → status=true, limitValue=50
   Starter + bulk_email → status=true, limitValue=300
   Starter + display_stats → status=true, limitValue=1
   
   Pro + form_create → status=true, limitValue=500
   Pro + bulk_email → status=true, limitValue=5000  
   Pro + display_stats → status=true, limitValue=1
   ```

### **PHASE 3: Customer Onboarding**
4. **Assign Organizations to Packages:**
   ```
   Organization "Acme Inc" → Starter package
   Organization "Startup LLC" → Freemium package
   ```

### **PHASE 4: Runtime (Automatic)**
5. **Metering auto-creation:**
   - When Acme Inc creates first form → `Metering` record created: `org=Acme, feature=form_create, currentValue=1`
   - When Startup LLC tries bulk email → Blocked (status=false in Freemium)

---

## Critical Field Relationships:

| Step | Model | Critical Fields | Purpose |
|------|-------|-----------------|---------|
| 1 | `Feature` | `name`, `meterType`, `timeframe` | Define what can be metered |
| 2 | `PricingPackage` | `name`, `priceMonthly` | Define product tiers |
| 3 | `PricingPackageFeature` | `status`, `limitValue` | Set package-specific limits |
| 4 | `Organization` | `pricingPackageId` | Assign customer to tier |
| 5 | `Metering` | `currentValue`, `periodStart/End` | Track real usage |

This gives SuperAdmin complete control over the feature economy while keeping the runtime simple for developers.

# Pylon Commands Reference

## Pylon Route Management

### Create Pylon Route
Creates a role-based route with Pylon dashboard layout structure.

**Syntax:**
```bash
semantq make:route <routeName> <role> --pylon
```

**Examples:**
```bash
# Create a plan route for project-manager role
semantq make:route plan project-manager --pylon

# Create a user-add route for admin role (short flag)
semantq make:route user-add admin -p

# Create with server handlers
semantq make:route master-plan project-manager --pylon -A
```

**What it creates:**
- `src/routes/<role>/<routeName>/@page.smq` - Main route page with component imports
- `src/routes/<role>/<routeName>/@layout.smq` - Dashboard layout with CSS imports


**Key Features:**
- Automatically converts route names to PascalCase (e.g., `user-add` → `UserAdd`)
- Sets up dashboard container with Sidebar, Header, and Footer imports
- Includes dashboard CSS and required external stylesheets
- Enables authentication by default in config

### Remove Route
Removes an existing route directory and all its contents.

**Syntax:**
```bash
semantq remove:route <routeName>
```

**Options:**
- `-y, --yes`: Skip confirmation prompt

**Example:**
```bash
# Remove a route with confirmation
semantq remove:route contact

# Remove without confirmation
semantq remove:route about -y
```

**Notes:**
- Works for both regular routes and Pylon routes
- Shows all files that will be removed before deletion
- Requires confirmation unless `-y` flag is used

---

## Pylon Component Management

### Create Pylon Component
Creates a Pylon-enabled component with feature guarding and permission-based UI.

**Syntax:**
```bash
semantq make:component <componentName> --pylon
```

**Examples:**
```bash
# Create a basic Pylon component
semantq make:component Plan --pylon

# Create nested Pylon component
semantq make:component admin/User --pylon
```

**What it creates:**
- `src/components/pylon/<componentName>.smq` (or nested path)
- Includes complete permission system with `can()`, `canAny()`, `canAll()` functions
- Formique configuration for CRUD operations
- AnyGrid integration with permission-controlled features
- Loading states and error handling
- Accordion-based UI for create/view operations

**Key Features:**
- Automatic permission mapping from user settings
- State management with `$state` and `$effect`
- Integrated Formique forms with validation
- AnyGrid data tables with export permissions
- Role-based access control
- Automatic data refresh on record creation

### Remove Component
Removes a component file from the project.

**Syntax:**
```bash
semantq remove:component <componentName>
```

**Options:**
- `-p, --pylon`: Remove from Pylon components directory
- `-y, --yes`: Skip confirmation prompt

**Examples:**
```bash
# Remove regular component
semantq remove:component Button

# Remove Pylon component
semantq remove:component Plan --pylon

# Remove without confirmation
semantq remove:component User -p -y
```

**Notes:**
- Defaults to regular components directory
- Use `--pylon` flag for Pylon components
- Shows alternative location suggestions if not found

---

## Pylon Resource Management

### Create Pylon Resource
Generates a complete backend resource with Pylon feature guarding.

**Syntax:**
```bash
semantq make:resource <resourceName> --pylon
```

**Examples:**
```bash
# Create Pylon resource for User model
semantq make:resource User --pylon

# Create regular resource (non-Pylon)
semantq make:resource Product
```

**What it creates:**
- **Model**: Database model with Pylon permission fields
- **Controller**: CRUD operations with permission checks
- **Service**: Business logic layer
- **Routes**: API endpoints with middleware

**Key Features:**
- Database adapter-aware (MySQL, MongoDB, SQLite, Supabase)
- Automatic Pylon permission integration in controllers
- Feature flag system for SaaS capabilities
- Role-based access middleware
- Consistent naming conventions

### Remove Resource
Removes all backend resource files for a given resource.

**Syntax:**
```bash
semantq remove:resource <resourceName>
```

**Options:**
- `-y, --yes`: Skip confirmation prompt

**Example:**
```bash
# Remove User resource with confirmation
semantq remove:resource User

# Remove without confirmation
semantq remove:resource Product -y
```

**What it removes:**
- Model files across all database adapters
- Controller file
- Service file
- Route file

**Notes:**
- Only removes files that exist
- Shows list of files before deletion
- Requires server directory (`semantqQL`) to exist

---

## Common Workflow Example

### Complete Pylon Feature Creation
```bash
# 1. Create the backend resource
semantq make:resource Invoice --pylon

# 2. Create the Pylon component
semantq make:component Invoice --pylon

# 3. Create the route for admin role
semantq make:route invoice admin --pylon
```

This creates:
- Backend: `Invoice` model, controller, service, routes
- Frontend: `Invoice.smq` Pylon component with permission UI
- Route: `/admin/invoice` dashboard route

### Cleanup Example
```bash
# Remove everything
semantq remove:resource Invoice -y
semantq remove:component Invoice --pylon -y
semantq remove:route invoice -y
```

## Notes & Best Practices

1. **Naming Conventions:**
   - Routes: lowercase, hyphenated (e.g., `user-add`)
   - Components: PascalCase (e.g., `UserAdd`)
   - Resources: Singular, PascalCase (e.g., `User`)

2. **Directory Structure:**
   - Pylon components: `src/components/pylon/`
   - Pylon routes: `src/routes/<role>/`
   - Resources: `semantqQL/` (models, controllers, services, routes)

3. **Permission System:**
   - Uses `user.userSettings` Set for permission checks
   - Supports CRUD operations (`create`, `read`, `update`, `delete`)
   - Includes DataGrid features (`datagrid_csvexport`, `datagrid_excelexport`)

4. **File Generation:**
   - All commands check for existing files first
   - Provide helpful error messages for conflicts
   - Include clear "next steps" after creation

   ## TO Do
- Add Pricing Table Friendly formatting of features
- structure for non crud features