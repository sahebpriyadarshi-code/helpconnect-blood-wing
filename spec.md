# HelpConnect Blood Wing - Technical Specification

## Version: 1.0
## Last Updated: January 9, 2026

---

## 1. EXECUTIVE SUMMARY

HelpConnect Blood Wing is a decentralized emergency blood coordination system built on the Internet Computer blockchain. It uses advanced auto-matching algorithms to rapidly connect blood donors with recipients in critical need.

### Key Achievements
- ✅ Fixed Donor Dashboard with proper authorization
- ✅ Implemented auto-matching algorithm (139 lines of code)
- ✅ Added blood type compatibility rules
- ✅ Created 4 reusable React Query hooks
- ✅ Cleaned up repository (removed .mdm file)

---

## 2. SYSTEM ARCHITECTURE

### 2.1 Technology Stack

```
Frontend:          React 18+ + TypeScript + Tailwind CSS
State Management:  React Query
Backend:           Motoko (Internet Computer Canister)
Database:          Stable Memory (Internet Computer)
Deployment:        Internet Computer (ICP) Mainnet
Communication:     Candid Interface Definition Language
```

### 2.2 System Components

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  - User Interface                                   │
│  - Form Management                                  │
│  - Real-time Notifications                          │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Candid Agent
                   │
┌──────────────────▼──────────────────────────────────┐
│              Internet Computer Canister             │
│                   (Motoko Backend)                  │
│                                                     │
│  ├── Blood Type Module                             │
│  ├── Auto-Matching Algorithm                       │
│  ├── Donor Registry                                │
│  ├── Request Management                            │
│  ├── Authorization Module                          │
│  └── Notification System                           │
└──────────────────┬──────────────────────────────────┘
                   │
                   │
┌──────────────────▼──────────────────────────────────┐
│         Internet Computer Stable Memory             │
│         (Persistent Data Storage)                  │
└──────────────────────────────────────────────────────┘
```

---

## 3. FEATURE SPECIFICATIONS

### 3.1 Blood Type Compatibility Rules

#### Blood Type Matrix

```
Donor Type → Recipient Type

O- (Universal Donor)
  Can donate to: O-, O+, A-, A+, B-, B+, AB-, AB+

O+ (Common Donor)
  Can donate to: O+, A+, B+, AB+

A-
  Can donate to: A-, A+, AB-, AB+

A+ (Common Donor)
  Can donate to: A+, AB+

B-
  Can donate to: B-, B+, AB-, AB+

B+ (Common Donor)
  Can donate to: B+, AB+

AB- (Rarest Type)
  Can donate to: AB-, AB+

AB+ (Universal Recipient)
  Can donate to: AB+ only
```

### 3.2 Donor Registration

**Required Fields:**
- Full Name (string)
- Email (string, validated)
- Phone Number (string)
- Blood Type (enum: O+, O-, A+, A-, B+, B-, AB+, AB-)
- Location (city, state/country)
- Date of Birth (date)
- Health Status (boolean)
- Last Donation Date (optional date)

**Process Flow:**
1. User fills registration form
2. Email verification sent
3. Profile creation in Motoko canister
4. Authorization token generated
5. Dashboard access granted

### 3.3 Blood Request Creation

**Required Fields:**
- Blood Type Needed (enum)
- Urgency Level (critical, high, medium, low)
- Quantity Needed (units)
- Hospital/Location (string)
- Patient Info (name, age)
- Contact Information (phone, email)

**Status Workflow:**
```
Created → Pending → Searching → Searching → Matched → Fulfilled → Completed
                                         └─ No Match → Expired
```

### 3.4 Auto-Matching Algorithm

#### Algorithm Steps

1. **Extract Request**: Get blood type requirement from request
2. **Find Compatible Donors**: Query all donors with compatible blood types
3. **Calculate Scores**:
   - Location proximity (weighted: 40%)
   - Availability (weighted: 30%)
   - Donation history (weighted: 20%)
   - Health status (weighted: 10%)
4. **Rank Results**: Sort by compatibility score (descending)
5. **Notify Donors**: Send notifications to top 5 matches
6. **Track Status**: Monitor acceptance/rejection

#### Compatibility Scoring

```python
compatibility_score = (
  (location_proximity * 0.4) +
  (availability_factor * 0.3) +
  (donation_history * 0.2) +
  (health_status * 0.1)
) * 100

Location Proximity:
  Same city: 100
  Within 10km: 80
  Within 25km: 60
  Within 50km: 40
  Beyond 50km: 20

Availability Factor:
  Available now: 100
  Available today: 80
  Available this week: 60
  Available later: 40

Donation History:
  Recent donor: 100
  Regular donor: 80
  Occasional donor: 60
  New donor: 40

Health Status:
  Excellent: 100
  Good: 80
  Acceptable: 60
  Needs verification: 40
```

---

## 4. API SPECIFICATIONS

### 4.1 Donor Management Endpoints

#### Register Donor
```
POST /api/donors/register

Request Body:
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "bloodType": "O+|O-|A+|A-|B+|B-|AB+|AB-",
  "location": {"city": "string", "state": "string"},
  "dateOfBirth": "YYYY-MM-DD",
  "healthStatus": "boolean"
}

Response:
{
  "success": "true",
  "donorId": "string (UUID)",
  "message": "Donor registered successfully"
}
```

#### Get Donor Profile
```
GET /api/donors/:donorId

Response:
{
  "donorId": "string",
  "name": "string",
  "bloodType": "string",
  "location": {"city": "string", "state": "string"},
  "lastDonationDate": "YYYY-MM-DD",
  "totalDonations": "number",
  "availability": "boolean",
  "rating": "number (0-5)"
}
```

### 4.2 Blood Request Endpoints

#### Create Request
```
POST /api/requests/create

Request Body:
{
  "bloodType": "string",
  "urgency": "critical|high|medium|low",
  "quantity": "number",
  "hospital": "string",
  "patientInfo": {"name": "string", "age": "number"},
  "contactEmail": "string",
  "contactPhone": "string"
}

Response:
{
  "success": "true",
  "requestId": "string (UUID)",
  "status": "created"
}
```

#### Get Matching Results
```
GET /api/matching/results/:requestId

Response:
{
  "requestId": "string",
  "matches": [
    {
      "donorId": "string",
      "donorName": "string",
      "bloodType": "string",
      "compatibilityScore": "number (0-100)",
      "location": "string",
      "availability": "boolean",
      "contactInfo": {"phone": "string", "email": "string"}
    }
  ],
  "totalMatches": "number"
}
```

---

## 5. FIXED ISSUES (January 2026)

### Issue #1: Donor Dashboard Authorization ✅ FIXED
**Status**: Resolved in PR #2
**Changes Made**:
- Added authorization checks in DonorDashboardPage.tsx
- Implemented role-based access control
- Added blood type filtering logic
- Fixed canDonate() function with proper validation

### Issue #2: Auto-Matching Algorithm ✅ FIXED
**Status**: Resolved in PR #1
**Changes Made**:
- Implemented findMatchingDonors() function
- Added calculateCompatibilityScore() algorithm
- Created getPublicDonorProfile() endpoint
- Added initializeBloodCompatibility() setup (139 lines)

### Issue #3: Query Hooks ✅ FIXED
**Status**: Resolved in PR #3
**Changes Made**:
- Created useBloodDonationMatches() hook
- Created useEligibleDonors() hook
- Created useDonationRequests() hook
- Created useAutoMatchingResults() hook
- All hooks properly typed with TypeScript

### Issue #4: Repository Cleanup ✅ FIXED
**Status**: Resolved in PR #4
**Changes Made**:
- Removed spec.mdm (225 lines)
- Consolidated documentation in spec.md
- Verified all file extensions
- Updated gitignore

---

## 6. TESTING SPECIFICATIONS

### 6.1 Unit Tests

**Blood Type Compatibility Tests**
```typescript
describe('Blood Type Compatibility', () => {
  test('O- donor can donate to all types', () => {...})
  test('AB+ recipient can only receive from AB+', () => {...})
  test('A+ donor cannot donate to B type', () => {...})
})
```

**Auto-Matching Algorithm Tests**
```typescript
describe('Auto-Matching Algorithm', () => {
  test('Finds compatible donors within location', () => {...})
  test('Calculates compatibility score correctly', () => {...})
  test('Ranks donors by score', () => {...})
})
```

### 6.2 Integration Tests

**Donor Registration Flow**
1. User registers with valid blood type
2. Email verification sent
3. Profile created in canister
4. Dashboard accessible

**Blood Request & Matching Flow**
1. Request created with blood type
2. System searches for donors
3. Notifications sent to matches
4. Donor responds
5. Status updated

---

## 7. DEPLOYMENT SPECIFICATIONS

### 7.1 Internet Computer Mainnet

**Requirements**:
- Internet Computer principal
- ICP cycles (~1-2 ICP)
- Domain (optional)

**Deployment Steps**:
1. Create production identity
2. Build canisters
3. Deploy to mainnet
4. Configure domain (DNS pointing)
5. Monitor canister performance

**Canister Specifications**:
- **main.mo Canister**: Backend logic, ~5MB limit per operation
- **Frontend Canister**: React app, optimized for web
- **Memory**: Stable memory for persistent storage

### 7.2 Performance Targets

```
Metric                      Target        Acceptable
─────────────────────────────────────────────────────
Page Load Time              < 1s          < 2s
Auto-Match Response         < 500ms       < 1s
Donor Search Query          < 200ms       < 500ms
Notification Delivery       < 5s          < 10s
API Response Time (avg)     < 100ms       < 300ms
System Availability         > 99.9%       > 99%
```

---

## 8. SECURITY SPECIFICATIONS

### 8.1 Authentication
- Internet Computer principal-based authentication
- Session tokens with expiration
- Refresh token mechanism

### 8.2 Authorization
- Role-based access control (Donor, Recipient, Admin)
- Resource-level permissions
- Data isolation per user

### 8.3 Data Protection
- End-to-end encryption for sensitive data
- HTTPS only transmission
- Stable memory encryption at rest

---

## 9. KNOWN LIMITATIONS

1. **Email Notifications**: Currently logged, requires email service integration
2. **Real-time Updates**: WebSocket not available; uses polling
3. **Geographic Precision**: Location based on city-level, not GPS
4. **Offline Support**: Requires internet connection

---

## 10. ROADMAP

### Phase 2 (Q1 2026)
- SMS notifications
- GPS-based location matching
- Hospital integration API
- Advanced analytics dashboard

### Phase 3 (Q2 2026)
- Mobile app (iOS/Android)
- Blockchain-based certificates
- Multi-language support
- Offline data sync
