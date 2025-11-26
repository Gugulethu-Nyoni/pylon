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

## To Do
- Add resource based and user level permissions
- Create perms js to be imported in every component for scalability 
- Enable organisational name (after payment or before)
- Add paypal payment gateway
- Add paystack gateway
- Add Yoco gateway
- Add payment settings 
- Add different payment gateways
- Pull features from roles in AddUser 


