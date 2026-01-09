export type Principal = string;
export type Nat = number;   // Use only non‑negative integers
export type Int = number;   // JavaScript number


export type UserPermission = "user" | "admin";

export type UserRoleAC =
  | "admin"
  | "user";

export interface AccessControlState {
  admins: Set<Principal>;
  users: Set<Principal>;
}

export const accessControlState: AccessControlState = {
  admins: new Set<Principal>(),
  users: new Set<Principal>()
};

export function initializeAccessControl(caller: Principal): void {
  // First caller becomes admin and user.
  accessControlState.admins.add(caller);
  accessControlState.users.add(caller);
}

export type UserRole = UserRoleAC;

export function getUserRole(caller: Principal): UserRole {
  if (accessControlState.admins.has(caller)) return "admin";
  if (accessControlState.users.has(caller)) return "user";
  // Default to user if unknown; adapt to your needs
  return "user";
}

export function assignRole(
  caller: Principal,
  user: Principal,
  role: UserRole
): void {
  if (!isAdmin(caller)) {
    throw new Error("Unauthorized: Only admins can assign roles");
  }
  if (role === "admin") {
    accessControlState.admins.add(user);
    accessControlState.users.add(user);
  } else if (role === "user") {
    accessControlState.users.add(user);
  }
}

export function isAdmin(caller: Principal): boolean {
  return accessControlState.admins.has(caller);
}

export function hasPermission(
  caller: Principal,
  permission: UserPermission
): boolean {
  if (permission === "admin") {
    return isAdmin(caller);
  }
  // "user" permission
  return accessControlState.users.has(caller) || isAdmin(caller);
}

// -----------------------------
// Domain enums and helpers
// -----------------------------

export type BloodType =
  | "O_positive"
  | "O_negative"
  | "A_positive"
  | "A_negative"
  | "B_positive"
  | "B_negative"
  | "AB_positive"
  | "AB_negative";

export function bloodTypeToText(bt: BloodType): string {
  switch (bt) {
    case "O_positive":
      return "O+";
    case "O_negative":
      return "O-";
    case "A_positive":
      return "A+";
    case "A_negative":
      return "A-";
    case "B_positive":
      return "B+";
    case "B_negative":
      return "B-";
    case "AB_positive":
      return "AB+";
    case "AB_negative":
      return "AB-";
  }
}

export type RequestStatus =
  | "pending"
  | "searching"
  | "donor_contacted"
  | "matched"
  | "fulfilled"
  | "expired";

export function requestStatusToText(status: RequestStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "searching":
      return "Searching";
    case "donor_contacted":
      return "Donor Contacted";
    case "matched":
      return "Matched";
    case "fulfilled":
      return "Fulfilled";
    case "expired":
      return "Expired";
  }
}

export type DonorRoleType = "requester" | "donor" | "both";

export interface HealthChecklist {
  noChronicIllness: boolean;
  noRecentSurgery: boolean;
  eligibleToDonate: boolean;
  notes: string;
}

// -----------------------------
// Core entities
// -----------------------------

export interface Donor {
  id: string;
  name: string;
  bloodType: BloodType;
  location: string;
  contactInfo: string;
  healthChecklist: HealthChecklist;
  donationHistory: string[];
  availability: boolean;
  owner: Principal;
}

export interface BloodRequest {
  id: string;
  recipientName: string;
  bloodType: BloodType;
  location: string;
  urgency: string;
  contactInfo: string;
  status: RequestStatus;
  timeCreated: Int;
  unitsRequired: Nat;
  owner: Principal;
}

export interface Match {
  id: string;
  requestId: string;
  donorId: string;
}

export interface DonorInterest {
  id: string;
  requestId: string;
  donorId: string;
  timestamp: Int;
}

export interface UserProfile {
  name: string;
  role: DonorRoleType;
  contactInfo: string;
}

export interface DonorSummary {
  firstName: string;
  bloodType: BloodType;
  location: string;
  donorId: string;
}

export interface DonorContactResponse {
  donorSummary: DonorSummary;
  contactInfo: string;
}

export interface PublicBloodRequest {
  id: string;
  recipientName: string;
  bloodType: BloodType;
  location: string;
  urgency: string;
  status: RequestStatus;
  timeCreated: Int;
  unitsRequired: Nat;
}

// -----------------------------
// In‑memory storage
// -----------------------------

const donors = new Map<string, Donor>();
const bloodRequests = new Map<string, BloodRequest>();
const matches = new Map<string, Match>();
const donorInterests = new Map<string, DonorInterest>();
const userProfiles = new Map<Principal, UserProfile>();

// -----------------------------
// Helper: current time
// -----------------------------
function nowInt(): Int {
  return Date.now();
}

// -----------------------------
// User Profile Management
// -----------------------------

export async function getCallerUserProfile(
  caller: Principal
): Promise<UserProfile | null> {
  if (!hasPermission(caller, "user")) {
    throw new Error("Unauthorized: Only users can view profiles");
  }
  return userProfiles.get(caller) ?? null;
}

export async function getUserProfileTS(
  caller: Principal,
  user: Principal
): Promise<UserProfile | null> {
  if (caller !== user && !isAdmin(caller)) {
    throw new Error("Unauthorized: Can only view your own profile");
  }
  return userProfiles.get(user) ?? null;
}

export async function saveCallerUserProfile(
  caller: Principal,
  profile: UserProfile
): Promise<void> {
  if (!hasPermission(caller, "user")) {
    throw new Error("Unauthorized: Only users can save profiles");
  }
  userProfiles.set(caller, profile);
}

// -----------------------------
// Donor Management
// -----------------------------

export async function createOrUpdateDonor(
  caller: Principal,
  id: string,
  name: string,
  bloodType: BloodType,
  location: string,
  contactInfo: string,
  healthChecklist: HealthChecklist,
  availability: boolean
): Promise<void> {
  if (!hasPermission(caller, "user")) {
    throw new Error(
      "Unauthorized: Only users can create or update donor profiles"
    );
  }

  const existingDonor = donors.get(id);
  if (existingDonor) {
    if (existingDonor.owner !== caller && !isAdmin(caller)) {
      throw new Error(
        "Unauthorized: Can only update your own donor profile"
      );
    }
  }

  const donor: Donor = {
    id,
    name,
    bloodType,
    location,
    contactInfo,
    healthChecklist,
    donationHistory: existingDonor?.donationHistory ?? [],
    availability,
    owner: existingDonor?.owner ?? caller
  };
  donors.set(id, donor);
}

export async function getDonorTS(
  caller: Principal,
  id: string
): Promise<Donor> {
  if (!hasPermission(caller, "user")) {
    throw new Error("Unauthorized: Only users can view donor profiles");
  }

  const donor = donors.get(id);
  if (!donor) {
    throw new Error("Donor not found");
  }
  if (donor.owner !== caller && !isAdmin(caller)) {
    throw new Error("Unauthorized: Can only view your own donor profile");
  }
  return donor;
}

export async function getAllDonorsTS(caller: Principal): Promise<Donor[]> {
  if (!hasPermission(caller, "admin")) {
    throw new Error("Unauthorized: Only admins can view all donors");
  }
  return Array.from(donors.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export async function getDonorsByBloodType(
  caller: Principal,
  bloodType: BloodType
): Promise<Donor[]> {
  if (!hasPermission(caller, "admin")) {
    throw new Error(
      "Unauthorized: Only admins can query donors by blood type"
    );
  }
  return Array.from(donors.values())
    .filter((d) => d.bloodType === bloodType)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function updateDonorAvailability(
  caller: Principal,
  donorId: string,
  available: boolean
): Promise<void> {
  if (!hasPermission(caller, "user")) {
    throw new Error(
      "Unauthorized: Only users can update donor availability"
    );
  }

  const donor = donors.get(donorId);
  if (!donor) {
    throw new Error("Donor not found");
  }
  if (donor.owner !== caller && !isAdmin(caller)) {
    throw new Error(
      "Unauthorized: Can only update your own donor availability"
    );
  }

  donors.set(donorId, {
    ...donor,
    availability: available
  });
}

// -----------------------------
// Blood Request Management
// -----------------------------

export async function createBloodRequest(
  caller: Principal,
  id: string,
  recipientName: string,
  bloodType: BloodType,
  location: string,
  urgency: string,
  contactInfo: string,
  unitsRequired: Nat
): Promise<void> {
  if (!hasPermission(caller, "user")) {
    throw new Error("Unauthorized: Only users can create blood requests");
  }

  const bloodRequest: BloodRequest = {
    id,
    recipientName,
    bloodType,
    location,
    urgency,
    contactInfo,
    status: "pending",
    timeCreated: nowInt(),
    unitsRequired,
    owner: caller
  };
  bloodRequests.set(id, bloodRequest);
}

export async function updateBloodRequestStatus(
  caller: Principal,
  requestId: string,
  status: RequestStatus
): Promise<void> {
  if (!hasPermission(caller, "user")) {
    throw new Error(
      "Unauthorized: Only users can update blood request status"
    );
  }

  const bloodRequest = bloodRequests.get(requestId);
  if (!bloodRequest) {
    throw new Error("Blood request not found");
  }
  if (bloodRequest.owner !== caller && !isAdmin(caller)) {
    throw new Error(
      "Unauthorized: Can only update your own blood request status"
    );
  }

  bloodRequests.set(requestId, {
    ...bloodRequest,
    status
  });
}

export async function getBloodRequestTS(
  caller: Principal,
  requestId: string
): Promise<BloodRequest> {
  if (!hasPermission(caller, "user")) {
    throw new Error(
      "Unauthorized: Only users can view blood request details"
    );
  }

  const bloodRequest = bloodRequests.get(requestId);
  if (!bloodRequest) {
    throw new Error("Blood request not found");
  }

  const isOwner = bloodRequest.owner === caller;
  const admin = isAdmin(caller);

  const hasExpressedInterest =
    Array.from(donorInterests.values()).find((interest) => {
      if (interest.requestId !== requestId) return false;
      const donor = donors.get(interest.donorId);
      return donor ? donor.owner === caller : false;
    }) != null;

  if (!(isOwner || admin || hasExpressedInterest)) {
    throw new Error(
      "Unauthorized: Can only view your own requests or requests you expressed interest in"
    );
  }

  return bloodRequest;
}

export async function getAllBloodRequestsTS(
  caller: Principal
): Promise<PublicBloodRequest[]> {
  if (!hasPermission(caller, "user")) {
    throw new Error("Unauthorized: Only users can view blood requests");
  }

  return Array.from(bloodRequests.values()).map((request) => ({
    id: request.id,
    recipientName: request.recipientName,
    bloodType: request.bloodType,
    location: request.location,
    urgency: request.urgency,
    status: request.status,
    timeCreated: request.timeCreated,
    unitsRequired: request.unitsRequired
  }));
}

// -----------------------------
// Match Management
// -----------------------------

export async function createMatch(
  caller: Principal,
  requestId: string,
  donorId: string
): Promise<void> {
  if (!hasPermission(caller, "user")) {
    throw new Error("Unauthorized: Only users can create matches");
  }

  const donor = donors.get(donorId);
  if (!donor) {
    throw new Error("Donor not found");
  }
  if (donor.owner !== caller && !isAdmin(caller)) {
    throw new Error(
      "Unauthorized: Can only create matches with your own donor profile"
    );
  }

  const request = bloodRequests.get(requestId);
  if (!request) {
    throw new Error("Blood request not found");
  }
  if (request.status === "fulfilled") {
    throw new Error("Cannot match: Blood request already fulfilled");
  }
  if (request.status === "expired") {
    throw new Error("Cannot match: Blood request expired");
  }

  const matchId = `${requestId}_${donorId}`;
  const match: Match = {
    id: matchId,
    requestId,
    donorId
  };
  matches.set(matchId, match);
}

export async function getMatchTS(
  caller: Principal,
  matchId: string
): Promise<Match> {
  if (!hasPermission(caller, "user")) {
    throw new Error("Unauthorized: Only users can view matches");
  }

  const match = matches.get(matchId);
  if (!match) {
    throw new Error("Match not found");
  }

  const donor = donors.get(match.donorId);
  const request = bloodRequests.get(match.requestId);

  const isDonorOwner = donor ? donor.owner === caller : false;
  const isRequestOwner = request ? request.owner === caller : false;
  const admin = isAdmin(caller);

  if (!(isDonorOwner || isRequestOwner || admin)) {
    throw new Error("Unauthorized: Can only view matches you are involved in");
  }

  return match;
}

export async function getAllMatchesTS(
  caller: Principal
): Promise<Match[]> {
  if (!hasPermission(caller, "admin")) {
    throw new Error("Unauthorized: Only admins can view all matches");
  }
  return Array.from(matches.values()).sort((a, b) => {
    const byReq = a.requestId.localeCompare(b.requestId);
    return byReq !== 0 ? byReq : a.donorId.localeCompare(b.donorId);
  });
}

// -----------------------------
// Filtering and Compatibility
// -----------------------------

export function getCompatibleDonorBloodTypes(
  recipientBloodType: BloodType
): BloodType[] {
  switch (recipientBloodType) {
    case "O_positive":
      return ["O_positive", "O_negative"];
    case "O_negative":
      return ["O_negative"];
    case "A_positive":
      return ["A_positive", "A_negative", "O_positive", "O_negative"];
    case "B_positive":
      return ["B_positive", "B_negative", "O_positive", "O_negative"];
    case "AB_positive":
      return [
        "O_negative",
        "O_positive",
        "A_negative",
        "A_positive",
        "B_negative",
        "B_positive",
        "AB_positive",
        "AB_negative"
      ];
    case "A_negative":
      return ["O_negative", "A_negative"];
    case "B_negative":
      return ["O_negative", "B_negative"];
    case "AB_negative":
      return ["O_negative", "A_negative", "B_negative", "AB_negative"];
  }
}

export async function getBloodRequestsByStatus(
  caller: Principal,
  status: RequestStatus
): Promise<PublicBloodRequest[]> {
  if (!hasPermission(caller, "user")) {
    throw new Error(
      "Unauthorized: Only users can query blood requests"
    );
  }

  return Array.from(bloodRequests.values())
    .filter((r) => r.status === status)
    .map((r) => ({
      id: r.id,
      recipientName: r.recipientName,
      bloodType: r.bloodType,
      location: r.location,
      urgency: r.urgency,
      status: r.status,
      timeCreated: r.timeCreated,
      unitsRequired: r.unitsRequired
    }));
}

export async function getDonorsByAvailability(
  caller: Principal,
  available: boolean
): Promise<Donor[]> {
  if (!hasPermission(caller, "admin")) {
    throw new Error(
      "Unauthorized: Only admins can query donors by availability"
    );
  }

  return Array.from(donors.values())
    .filter((d) => d.availability === available)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function findCompatibleDonors(
  caller: Principal,
  bloodType: BloodType
): Promise<Donor[]> {
  if (!hasPermission(caller, "admin")) {
    throw new Error(
      "Unauthorized: Only admins can query all compatible donors"
    );
  }

  const compatibleTypes = getCompatibleDonorBloodTypes(bloodType);
  return Array.from(donors.values())
    .filter((donor) =>
      compatibleTypes.some((bt) => bt === donor.bloodType)
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function findDonorsNearby(
  caller: Principal,
  bloodType: BloodType,
  city: string
): Promise<Nat> {
  if (!hasPermission(caller, "user")) {
    throw new Error("Unauthorized: Only users can search for donors");
  }

  let count = 0;
  for (const donor of donors.values()) {
    if (donor.bloodType === bloodType && donor.location === city) {
      count += 1;
    }
  }
  return count;
}

export async function getRequestsForDonor(
  caller: Principal,
  donorId: string
): Promise<PublicBloodRequest[]> {
  if (!hasPermission(caller, "user")) {
    throw new Error(
      "Unauthorized: Only users can view requests for donors"
    );
  }

  const donor = donors.get(donorId);
  if (!donor) {
    throw new Error("Donor not found");
  }
  if (donor.owner !== caller && !isAdmin(caller)) {
    throw new Error(
      "Unauthorized: Can only view requests for your own donor profile"
    );
  }

  return Array.from(bloodRequests.values())
    .filter(
      (r) => r.bloodType === donor.bloodType && r.location === donor.location
    )
    .map((r) => ({
      id: r.id,
      recipientName: r.recipientName,
      bloodType: r.bloodType,
      location: r.location,
      urgency: r.urgency,
      status: r.status,
      timeCreated: r.timeCreated,
      unitsRequired: r.unitsRequired
    }));
}

export async function getAvailableRequestsForDonor(
  caller: Principal,
  donorId: string
): Promise<PublicBloodRequest[]> {
  if (!hasPermission(caller, "user")) {
    throw new Error(
      "Unauthorized: Only users can view available requests"
    );
  }

  const donor = donors.get(donorId);
  if (!donor) {
    throw new Error("Donor not found");
  }
  if (donor.owner !== caller && !isAdmin(caller)) {
    throw new Error(
      "Unauthorized: Can only view requests for your own donor profile"
    );
  }

  return Array.from(bloodRequests.values())
    .filter(
      (r) =>
        r.bloodType === donor.bloodType &&
        r.location === donor.location &&
        r.status !== "fulfilled" &&
        r.status !== "expired" &&
        r.status !== "matched"
    )
    .map((r) => ({
      id: r.id,
      recipientName: r.recipientName,
      bloodType: r.bloodType,
      location: r.location,
      urgency: r.urgency,
      status: r.status,
      timeCreated: r.timeCreated,
      unitsRequired: r.unitsRequired
    }));
}

// -----------------------------
// Donor Interest Flow
// -----------------------------

export async function createDonorInterest(
  caller: Principal,
  requestId: string,
  donorId: string
): Promise<void> {
  if (!hasPermission(caller, "user")) {
    throw new Error(
      "Unauthorized: Only users can express donor interest"
    );
  }

  const donor = donors.get(donorId);
  if (!donor) {
    throw new Error("Donor does not exist");
  }
  if (donor.owner !== caller && !isAdmin(caller)) {
    throw new Error(
      "Unauthorized: Can only express interest with your own donor profile"
    );
  }

  const existing = Array.from(donorInterests.values()).find(
    (interest) =>
      interest.requestId === requestId && interest.donorId === donorId
  );
  if (existing) {
    throw new Error("Interest already recorded for this request");
  }

  const request = bloodRequests.get(requestId);
  if (!request) {
    throw new Error("Request does not exist");
  }

  const newInterest: DonorInterest = {
    id: `${requestId}_${donorId}`,
    requestId,
    donorId,
    timestamp: nowInt()
  };

  if (request.status === "searching") {
    bloodRequests.set(request.id, {
      ...request,
      status: "donor_contacted"
    });
  }

  donorInterests.set(newInterest.id, newInterest);
}

export async function getDonorInterestsByRequest(
  caller: Principal,
  requestId: string
): Promise<DonorInterest[]> {
  if (!hasPermission(caller, "user")) {
    throw new Error(
      "Unauthorized: Only users can view donor interests"
    );
  }

  const request = bloodRequests.get(requestId);
  if (!request) {
    throw new Error("Blood request not found");
  }
  if (request.owner !== caller && !isAdmin(caller)) {
    throw new Error(
      "Unauthorized: Can only view interests for your own requests"
    );
  }

  return Array.from(donorInterests.values())
    .filter((i) => i.requestId === requestId)
    .sort((a, b) => {
      const byReq = a.requestId.localeCompare(b.requestId);
      return byReq !== 0 ? byReq : a.donorId.localeCompare(b.donorId);
    });
}

export async function countDonorInterestsTS(
  caller: Principal,
  requestId: string
): Promise<Nat> {
  if (!hasPermission(caller, "user")) {
    throw new Error(
      "Unauthorized: Only users can view donor interest counts"
    );
  }

  const request = bloodRequests.get(requestId);
  if (!request) {
    throw new Error("Blood request not found");
  }
  if (request.owner !== caller && !isAdmin(caller)) {
    throw new Error(
      "Unauthorized: Can only view interest count for your own requests"
    );
  }

  let count = 0;
  for (const interest of donorInterests.values()) {
    if (interest.requestId === requestId) count += 1;
  }
  return count;
}

// -----------------------------
// My Blood Requests Page
// -----------------------------

export async function getInterestedDonorsForRequest(
  caller: Principal,
  requestId: string
): Promise<DonorSummary[]> {
  if (!hasPermission(caller, "user")) {
    throw new Error(
      "Unauthorized: Only users can view interested donors"
    );
  }

  const request = bloodRequests.get(requestId);
  if (!request) {
    throw new Error("Blood request not found");
  }
  if (request.owner !== caller && !isAdmin(caller)) {
    throw new Error(
      "Unauthorized: Can only view interested donors for your own requests"
    );
  }

  const summaries: DonorSummary[] = [];
  for (const interest of donorInterests.values()) {
    if (interest.requestId !== requestId) continue;
    const donor = donors.get(interest.donorId);
    if (donor) {
      summaries.push({
        firstName: donor.name,
        bloodType: donor.bloodType,
        location: donor.location,
        donorId: donor.id
      });
    }
  }
  return summaries;
}

// -----------------------------
// Manual Donor Selection Logic
// -----------------------------

export async function confirmDonorMatch(
  caller: Principal,
  requestId: string,
  donorId: string
): Promise<DonorContactResponse> {
  if (!hasPermission(caller, "user")) {
    throw new Error(
      "Unauthorized: Only users can confirm donor matches"
    );
  }

  const request = bloodRequests.get(requestId);
  if (!request) {
    throw new Error("Blood request not found");
  }
  if (request.owner !== caller) {
    throw new Error(
      "Unauthorized: Only the requester can contact donors for this request"
    );
  }

  const donor = donors.get(donorId);
  if (!donor) {
    throw new Error("Donor not found");
  }

  const eligible = Array.from(donorInterests.values()).find(
    (interest) =>
      interest.requestId === requestId && interest.donorId === donorId
  );
  if (!eligible) {
    throw new Error("Donor has not expressed interest in this request");
  }

  bloodRequests.set(request.id, {
    ...request,
    status: "matched"
  });

  const summary: DonorSummary = {
    firstName: donor.name,
    bloodType: donor.bloodType,
    location: donor.location,
    donorId: donor.id
  };

  return {
    donorSummary: summary,
    contactInfo: donor.contactInfo
  };
}

// -----------------------------
// Auto‑Matching Functions
// -----------------------------

export async function getCompatibleDonorsInLocation(
  caller: Principal,
  bloodType: BloodType,
  location: string
): Promise<DonorSummary[]> {
  if (!hasPermission(caller, "user")) {
    throw new Error(
      "Unauthorized: Only users can search for donors"
    );
  }

  const result: DonorSummary[] = [];
  for (const donor of donors.values()) {
    if (
      donor.bloodType === bloodType &&
      donor.location === location &&
      donor.availability
    ) {
      result.push({
        firstName: donor.name,
        bloodType: donor.bloodType,
        location: donor.location,
        donorId: donor.id
      });
    }
  }
  return result;
}

export async function autoMatchBloodRequest(
  caller: Principal,
  requestId: string
): Promise<DonorSummary[]> {
  if (!hasPermission(caller, "user")) {
    throw new Error(
      "Unauthorized: Only users can trigger auto-matching"
    );
  }

  const request = bloodRequests.get(requestId);
  if (!request) {
    throw new Error("Blood request not found");
  }
  if (request.owner !== caller && !isAdmin(caller)) {
    throw new Error("Unauthorized: Can only auto-match your own requests");
  }

  const compatibleTypes = getCompatibleDonorBloodTypes(request.bloodType);
  const matchedDonors: DonorSummary[] = [];

  for (const donor of donors.values()) {
    const isCompatible = compatibleTypes.some(
      (bt) => bt === donor.bloodType
    );

    if (
      isCompatible &&
      donor.location === request.location &&
      donor.availability
    ) {
      const alreadyContacted =
        Array.from(donorInterests.values()).find(
          (interest) =>
            interest.requestId === requestId &&
            interest.donorId === donor.id
        ) != null;

      if (!alreadyContacted) {
        matchedDonors.push({
          firstName: donor.name,
          bloodType: donor.bloodType,
          location: donor.location,
          donorId: donor.id
        });
      }
    }
  }

  return matchedDonors;
}

export async function findBestDonorMatch(
  caller: Principal,
  requestId: string
): Promise<DonorContactResponse | null> {
  if (!hasPermission(caller, "user")) {
    throw new Error(
      "Unauthorized: Only users can find donor matches"
    );
  }

  const request = bloodRequests.get(requestId);
  if (!request) {
    return null;
  }
  if (request.owner !== caller && !isAdmin(caller)) {
    throw new Error("Unauthorized");
  }

  const compatibleTypes = getCompatibleDonorBloodTypes(request.bloodType);
  let bestDonor: Donor | null = null;
  let bestScore: Nat = 0;

  for (const donor of donors.values()) {
    const isCompatible = compatibleTypes.some(
      (bt) => bt === donor.bloodType
    );

    if (
      isCompatible &&
      donor.location === request.location &&
      donor.availability
    ) {
      const alreadyContacted =
        Array.from(donorInterests.values()).find(
          (interest) =>
            interest.requestId === requestId &&
            interest.donorId === donor.id
        ) != null;

      if (!alreadyContacted) {
        let score: Nat = 0;
        if (donor.bloodType === request.bloodType) score += 10;
        if (donor.healthChecklist.eligibleToDonate) score += 5;

        if (score > bestScore) {
          bestScore = score;
          bestDonor = donor;
        }
      }
    }
  }

  if (!bestDonor) return null;

  return {
    donorSummary: {
      firstName: bestDonor.name,
      bloodType: bestDonor.bloodType,
      location: bestDonor.location,
      donorId: bestDonor.id
    },
    contactInfo: bestDonor.contactInfo
  };
}
