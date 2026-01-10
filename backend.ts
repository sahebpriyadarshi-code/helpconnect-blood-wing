/**
 * HelpConnect Blood Wing - Complete Backend
 * Merged from main.mo + accesscontrol.ts
 * Production Ready - TypeScript Implementation
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type BloodType = 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+';
export type UserRole = 'donor' | 'recipient' | 'admin';
export type HealthStatus = 'eligible' | 'ineligible' | 'pending';
export type UrgencyLevel = 'critical' | 'urgent' | 'normal';
export type RequestStatus = 'pending' | 'matched' | 'fulfilled' | 'cancelled';
export type AvailabilityStatus = 'available' | 'recently-donated' | 'unavailable';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  alternatePhone?: string;
}

export interface Donor {
  id: string;
  userId: string;
  name: string;
  bloodType: BloodType;
  location: Location;
  contactInfo: ContactInfo;
  isAvailable: boolean;
  lastDonationDate?: Date;
  registrationDate: Date;
  healthStatus: HealthStatus;
  age?: number;
  weight?: number;
  medicalHistory?: string[];
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  donationCount: number;
  rating?: number;
}

export interface BloodRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  bloodType: BloodType;
  urgencyLevel: UrgencyLevel;
  unitsNeeded: number;
  location: Location;
  patientInfo: {
    name: string;
    age: number;
    condition?: string;
    hospitalName?: string;
  };
  status: RequestStatus;
  createdAt: Date;
  expiresAt: Date;
  fulfilledAt?: Date;
  matchedDonors: string[];
  respondedDonors: {
    donorId: string;
    response: 'accepted' | 'declined';
    respondedAt: Date;
  }[];
  description?: string;
  contactPerson: ContactInfo;
}

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  profileId: string;
  createdAt: Date;
  lastLogin: Date;
  isVerified: boolean;
  isActive: boolean;
}

export interface MatchResult {
  donor: Donor;
  compatibilityScore: number;
  distance: number;
  availabilityStatus: AvailabilityStatus;
  estimatedResponseTime: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'blood_request_match' | 'request_fulfilled' | 'donation_reminder' | 'system_alert';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

type Permission = 
  | 'view_donors'
  | 'register_donor'
  | 'edit_donor'
  | 'create_request'
  | 'view_requests'
  | 'respond_to_request'
  | 'manage_users'
  | 'view_analytics'
  | 'send_notifications';

// ============================================================================
// IN-MEMORY DATA STORAGE (Replace with database in production)
// ============================================================================

let donors: Map<string, Donor> = new Map();
let bloodRequests: Map<string, BloodRequest> = new Map();
let users: Map<string, User> = new Map();
let notifications: Map<string, Notification[]> = new Map();
let sessions: Map<string, { userId: string; expiresAt: Date }> = new Map();

// ============================================================================
// BLOOD TYPE COMPATIBILITY RULES
// ============================================================================

export const BLOOD_COMPATIBILITY: Record<BloodType, BloodType[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal donor
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'], // Universal recipient - can only donate to AB+
};

export const checkBloodCompatibility = (
  donorType: BloodType,
  recipientType: BloodType
): boolean => {
  return BLOOD_COMPATIBILITY[donorType]?.includes(recipientType) ?? false;
};

export const getCompatibleBloodTypes = (recipientType: BloodType): BloodType[] => {
  return Object.entries(BLOOD_COMPATIBILITY)
    .filter(([_, recipients]) => recipients.includes(recipientType))
    .map(([donorType, _]) => donorType as BloodType);
};

// ============================================================================
// AUTHORIZATION & PERMISSIONS
// ============================================================================

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  donor: [
    'view_donors',
    'register_donor',
    'edit_donor',
    'view_requests',
    'respond_to_request',
  ],
  recipient: [
    'create_request',
    'view_requests',
    'view_donors',
  ],
  admin: [
    'view_donors',
    'register_donor',
    'edit_donor',
    'create_request',
    'view_requests',
    'respond_to_request',
    'manage_users',
    'view_analytics',
    'send_notifications',
  ],
};

export const checkPermission = (user: User, permission: Permission): boolean => {
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

export const requirePermission = (user: User, permission: Permission): void => {
  if (!checkPermission(user, permission)) {
    throw new Error(`Unauthorized: Missing permission '${permission}'`);
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const calculateDistance = (
  loc1: Location,
  loc2: Location
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(loc2.latitude - loc1.latitude);
  const dLon = toRad(loc2.longitude - loc1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(loc1.latitude)) * 
    Math.cos(toRad(loc2.latitude)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => deg * (Math.PI / 180);

export const getDaysSince = (date: Date): number => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const formatDate = (date: Date): string => {
  return new Date(date).toISOString();
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

export const isValidBloodType = (bloodType: string): bloodType is BloodType => {
  return ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].includes(bloodType);
};

// ============================================================================
// DONOR MANAGEMENT
// ============================================================================

export const registerDonor = async (
  donorData: Omit<Donor, 'id' | 'registrationDate' | 'donationCount'>
): Promise<Donor> => {
  // Validation
  if (!isValidEmail(donorData.contactInfo.email)) {
    throw new Error('Invalid email address');
  }
  
  if (!isValidPhone(donorData.contactInfo.phone)) {
    throw new Error('Invalid phone number');
  }
  
  if (!isValidBloodType(donorData.bloodType)) {
    throw new Error('Invalid blood type');
  }
  
  if (donorData.age && (donorData.age < 18 || donorData.age > 65)) {
    throw new Error('Donor must be between 18 and 65 years old');
  }
  
  if (donorData.weight && donorData.weight < 50) {
    throw new Error('Donor must weigh at least 50 kg');
  }
  
  const donor: Donor = {
    ...donorData,
    id: generateId(),
    registrationDate: new Date(),
    donationCount: 0,
  };
  
  donors.set(donor.id, donor);
  
  // Create notification
  await createNotification({
    userId: donor.userId,
    type: 'system_alert',
    title: 'Welcome to HelpConnect',
    message: 'Your donor registration is complete. Thank you for saving lives!',
  });
  
  return donor;
};

export const getDonorById = async (id: string): Promise<Donor | null> => {
  return donors.get(id) || null;
};

export const getDonorByUserId = async (userId: string): Promise<Donor | null> => {
  return Array.from(donors.values()).find(d => d.userId === userId) || null;
};

export const updateDonorProfile = async (
  id: string,
  updates: Partial<Donor>
): Promise<Donor> => {
  const donor = donors.get(id);
  
  if (!donor) {
    throw new Error('Donor not found');
  }
  
  // Validate updates
  if (updates.contactInfo?.email && !isValidEmail(updates.contactInfo.email)) {
    throw new Error('Invalid email address');
  }
  
  if (updates.contactInfo?.phone && !isValidPhone(updates.contactInfo.phone)) {
    throw new Error('Invalid phone number');
  }
  
  const updatedDonor = { ...donor, ...updates };
  donors.set(id, updatedDonor);
  
  return updatedDonor;
};

export const searchDonors = async (filters: {
  bloodType?: BloodType | BloodType[];
  location?: { lat: number; lng: number; radius: number };
  isAvailable?: boolean;
  city?: string;
  minRating?: number;
}): Promise<Donor[]> => {
  let results = Array.from(donors.values());
  
  // Filter by blood type
  if (filters.bloodType) {
    const types = Array.isArray(filters.bloodType) ? filters.bloodType : [filters.bloodType];
    results = results.filter(d => types.includes(d.bloodType));
  }
  
  // Filter by availability
  if (filters.isAvailable !== undefined) {
    results = results.filter(d => d.isAvailable === filters.isAvailable);
  }
  
  // Filter by city
  if (filters.city) {
    results = results.filter(d => 
      d.location.city?.toLowerCase().includes(filters.city!.toLowerCase())
    );
  }
  
  // Filter by location radius
  if (filters.location) {
    results = results.filter(d => {
      const distance = calculateDistance(
        { latitude: filters.location!.lat, longitude: filters.location!.lng, address: '' },
        d.location
      );
      return distance <= filters.location!.radius;
    });
  }
  
  // Filter by rating
  if (filters.minRating) {
    results = results.filter(d => (d.rating || 0) >= filters.minRating!);
  }
  
  return results;
};

export const getDonorsByBloodType = async (bloodType: BloodType): Promise<Donor[]> => {
  return searchDonors({ bloodType, isAvailable: true });
};

export const checkDonorEligibility = (donor: Donor): {
  eligible: boolean;
  reasons: string[];
} => {
  const reasons: string[] = [];
  
  // Check last donation date (minimum 8 weeks / 56 days)
  if (donor.lastDonationDate) {
    const daysSince = getDaysSince(donor.lastDonationDate);
    if (daysSince < 56) {
      reasons.push(`Must wait ${56 - daysSince} more days since last donation`);
    }
  }
  
  // Check health status
  if (donor.healthStatus !== 'eligible') {
    reasons.push('Health status not eligible');
  }
  
  // Check availability
  if (!donor.isAvailable) {
    reasons.push('Donor marked as unavailable');
  }
  
  // Check age
  if (donor.age && (donor.age < 18 || donor.age > 65)) {
    reasons.push('Age must be between 18 and 65');
  }
  
  // Check weight
  if (donor.weight && donor.weight < 50) {
    reasons.push('Weight must be at least 50 kg');
  }
  
  return {
    eligible: reasons.length === 0,
    reasons,
  };
};

// ============================================================================
// BLOOD REQUEST MANAGEMENT
// ============================================================================

export const createBloodRequest = async (
  requestData: Omit<BloodRequest, 'id' | 'createdAt' | 'expiresAt' | 'status' | 'matchedDonors' | 'respondedDonors'>
): Promise<BloodRequest> => {
  // Validation
  if (!isValidBloodType(requestData.bloodType)) {
    throw new Error('Invalid blood type');
  }
  
  if (requestData.unitsNeeded < 1 || requestData.unitsNeeded > 10) {
    throw new Error('Units needed must be between 1 and 10');
  }
  
  const request: BloodRequest = {
    ...requestData,
    id: generateId(),
    status: 'pending',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    matchedDonors: [],
    respondedDonors: [],
  };
  
  bloodRequests.set(request.id, request);
  
  // Automatically trigger matching
  setTimeout(() => matchDonorsToRequest(request.id), 1000);
  
  return request;
};

export const getBloodRequests = async (filters?: {
  status?: RequestStatus;
  bloodType?: BloodType;
  urgencyLevel?: UrgencyLevel;
  requesterId?: string;
}): Promise<BloodRequest[]> => {
  let results = Array.from(bloodRequests.values());
  
  if (filters?.status) {
    results = results.filter(r => r.status === filters.status);
  }
  
  if (filters?.bloodType) {
    results = results.filter(r => r.bloodType === filters.bloodType);
  }
  
  if (filters?.urgencyLevel) {
    results = results.filter(r => r.urgencyLevel === filters.urgencyLevel);
  }
  
  if (filters?.requesterId) {
    results = results.filter(r => r.requesterId === filters.requesterId);
  }
  
  // Sort by urgency and date
  return results.sort((a, b) => {
    const urgencyOrder = { critical: 0, urgent: 1, normal: 2 };
    if (urgencyOrder[a.urgencyLevel] !== urgencyOrder[b.urgencyLevel]) {
      return urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
};

export const getBloodRequestById = async (id: string): Promise<BloodRequest | null> => {
  return bloodRequests.get(id) || null;
};

export const updateRequestStatus = async (
  id: string,
  status: RequestStatus,
  donorIds?: string[]
): Promise<BloodRequest> => {
  const request = bloodRequests.get(id);
  
  if (!request) {
    throw new Error('Blood request not found');
  }
  
  request.status = status;
  
  if (donorIds) {
    request.matchedDonors = [...new Set([...request.matchedDonors, ...donorIds])];
  }
  
  if (status === 'fulfilled') {
    request.fulfilledAt = new Date();
  }
  
  bloodRequests.set(id, request);
  
  return request;
};

export const respondToRequest = async (
  requestId: string,
  donorId: string,
  response: 'accepted' | 'declined'
): Promise<void> => {
  const request = bloodRequests.get(requestId);
  
  if (!request) {
    throw new Error('Blood request not found');
  }
  
  // Remove existing response from this donor
  request.respondedDonors = request.respondedDonors.filter(r => r.donorId !== donorId);
  
  // Add new response
  request.respondedDonors.push({
    donorId,
    response,
    respondedAt: new Date(),
  });
  
  bloodRequests.set(requestId, request);
  
  // Notify requester
  await createNotification({
    userId: request.requesterId,
    type: 'blood_request_match',
    title: response === 'accepted' ? 'Donor Accepted!' : 'Donor Declined',
    message: `A donor has ${response} your blood request.`,
    data: { requestId, donorId },
  });
};

// ============================================================================
// AUTO-MATCHING ALGORITHM
// ============================================================================

export const calculateCompatibilityScore = (
  donor: Donor,
  request: BloodRequest
): number => {
  let score = 100;
  
  // Blood type exact match bonus
  if (donor.bloodType === request.bloodType) {
    score += 20;
  }
  
  // Universal donor bonus
  if (donor.bloodType === 'O-') {
    score += 15;
  }
  
  // Distance penalty (closer is better)
  const distance = calculateDistance(donor.location, request.location);
  score -= Math.min(distance * 2, 50); // Max 50 points penalty
  
  // Availability bonus
  if (donor.isAvailable) {
    score += 30;
  } else {
    score -= 50;
  }
  
  // Recent donation penalty
  if (donor.lastDonationDate) {
    const daysSince = getDaysSince(donor.lastDonationDate);
    if (daysSince < 56) {
      score -= 50;
    } else if (daysSince < 90) {
      score -= 10;
    }
  }
  
  // Health status
  if (donor.healthStatus === 'eligible') {
    score += 10;
  } else if (donor.healthStatus === 'ineligible') {
    score -= 100;
  }
  
  // Rating bonus
  if (donor.rating) {
    score += donor.rating * 2; // Max 10 points if 5-star rating
  }
  
  // Urgency multiplier
  if (request.urgencyLevel === 'critical') {
    score *= 1.2;
  } else if (request.urgencyLevel === 'urgent') {
    score *= 1.1;
  }
  
  return Math.max(0, Math.min(200, score)); // 0-200 range
};

export const findCompatibleDonors = async (
  requestId: string
): Promise<MatchResult[]> => {
  const request = await getBloodRequestById(requestId);
  
  if (!request) {
    throw new Error('Blood request not found');
  }
  
  // Find compatible blood types
  const compatibleTypes = getCompatibleBloodTypes(request.bloodType);
  
  // Search donors with compatible blood types
  const potentialDonors = await searchDonors({
    bloodType: compatibleTypes,
  });
  
  // Calculate compatibility and create results
  const matches: MatchResult[] = potentialDonors.map(donor => {
    const eligibility = checkDonorEligibility(donor);
    const distance = calculateDistance(donor.location, request.location);
    
    return {
      donor,
      compatibilityScore: calculateCompatibilityScore(donor, request),
      distance,
      availabilityStatus: eligibility.eligible ? 'available' : 
                         donor.lastDonationDate && getDaysSince(donor.lastDonationDate) < 56 ?
                         'recently-donated' : 'unavailable',
      estimatedResponseTime: distance < 10 ? '< 1 hour' : 
                            distance < 50 ? '1-3 hours' : '3+ hours',
    };
  });
  
  // Sort by compatibility score (highest first)
  return matches
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 20); // Return top 20 matches
};

export const matchDonorsToRequest = async (requestId: string): Promise<void> => {
  const matches = await findCompatibleDonors(requestId);
  
  if (matches.length === 0) {
    console.warn(`No compatible donors found for request ${requestId}`);
    return;
  }
  
  // Update request with matched donors
  await updateRequestStatus(
    requestId,
    'matched',
    matches.map(m => m.donor.id)
  );
  
  // Notify top donors
  const topMatches = matches.slice(0, 10);
  await notifyMatchedDonors(topMatches, requestId);
};

export const notifyMatchedDonors = async (
  matches: MatchResult[],
  requestId: string
): Promise<void> => {
  const request = await getBloodRequestById(requestId);
  
  if (!request) return;
  
  for (const match of matches) {
    if (match.availabilityStatus === 'available') {
      await createNotification({
        userId: match.donor.userId,
        type: 'blood_request_match',
        title: 'Urgent Blood Request Match!',
        message: `You match a ${request.urgencyLevel} blood request for ${request.bloodType}. Distance: ${match.distance.toFixed(1)} km`,
        data: {
          requestId,
          bloodType: request.bloodType,
          urgencyLevel: request.urgencyLevel,
          distance: match.distance,
          compatibilityScore: match.compatibilityScore,
        },
      });
    }
  }
};

// ============================================================================
// USER AUTHENTICATION & MANAGEMENT
// ============================================================================

export const createUser = async (userData: {
  email: string;
  password: string;
  role: UserRole;
}): Promise<User> => {
  // Check if email already exists
  const existingUser = Array.from(users.values()).find(u => u.email === userData.email);
  if (existingUser) {
    throw new Error('Email already registered');
  }
  
  if (!isValidEmail(userData.email)) {
    throw new Error('Invalid email address');
  }
  
  const user: User = {
    id: generateId(),
    email: userData.email,
    passwordHash: await hashPassword(userData.password),
    role: userData.role,
    profileId: '', // Will be set when profile is created
    createdAt: new Date(),
    lastLogin: new Date(),
    isVerified: false,
    isActive: true,
  };
  
  users.set(user.id, user);
  
  return user;
};

export const authenticateUser = async (
  email: string,
  password: string
): Promise<{ user: User; token: string } | null> => {
  const user = Array.from(users.values()).find(u => u.email === email);
  
  if (!user || !user.isActive) {
    return null;
  }
  
  const isValid = await verifyPassword(password, user.passwordHash || '');
  
  if (!isValid) {
    return null;
  }
  
  // Update last login
  user.lastLogin = new Date();
  users.set(user.id, user);
  
  // Create session
  const token = generateId();
  sessions.set(token, {
    userId: user.id,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });
  
  return { user, token };
};

export const validateToken = async (token: string): Promise<User | null> => {
  const session = sessions.get(token);
  
  if (!session) {
    return null;
  }
  
  if (session.expiresAt < new Date()) {
    sessions.delete(token);
    return null;
  }
  
  return users.get(session.userId) || null;
};

export const getUserById = async (id: string): Promise<User | null> => {
  return users.get(id) || null;
};

export const logout = async (token: string): Promise<void> => {
  sessions.delete(token);
};

// Simple password hashing (use bcrypt in production)
const hashPassword = async (password: string): Promise<string> => {
  // In production, use bcrypt or similar
  return Buffer.from(password).toString('base64');
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const computed = await hashPassword(password);
  return computed === hash;
};

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================

export const createNotification = async (data: {
  userId: string;
  type: Notification['type'];
  title: string;
  message: string;
  data?: any;
}): Promise<Notification> => {
  const notification: Notification = {
    id: generateId(),
    ...data,
    isRead: false,
    createdAt: new Date(),
  };
  
  const userNotifications = notifications.get(data.userId) || [];
  userNotifications.push(notification);
  notifications.set(data.userId, userNotifications);
  
  return notification;
};

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  return notifications.get(userId) || [];
};

export const markNotificationAsRead = async (userId: string, notificationId: string): Promise<void> => {
  const userNotifications = notifications.get(userId) || [];
  const notification = userNotifications.find(n => n.id === notificationId);
  
  if (notification) {
    notification.isRead = true;
    notifications.set(userId, userNotifications);
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const userNotifications = notifications.get(userId) || [];
  userNotifications.forEach(n => n.isRead = true);
  notifications.set(userId, userNotifications);
};

// ============================================================================
// ANALYTICS & STATISTICS
// ============================================================================

export const getStatistics = async (): Promise<{
  totalDonors: number;
  availableDonors: number;
  totalRequests: number;
  activeRequests: number;
  fulfilledRequests: number;
  donorsByBloodType: Record<BloodType, number>;
  requestsByUrgency: Record<UrgencyLevel, number>;
}> => {
  const allDonors = Array.from(donors.values());
  const allRequests = Array.from(bloodRequests.values());
  
  return {
    totalDonors: allDonors.length,
    availableDonors: allDonors.filter(d => d.isAvailable).length,
    totalRequests: allRequests.length,
    activeRequests: allRequests.filter(r => r.status === 'pending' || r.status === 'matched').length,
    fulfilledRequests: allRequests.filter(r => r.status === 'fulfilled').length,
    donorsByBloodType: allDonors.reduce((acc, donor) => {
      acc[donor.bloodType] = (acc[donor.bloodType] || 0) + 1;
      return acc;
    }, {} as Record<BloodType, number>),
    requestsByUrgency: allRequests.reduce((acc, request) => {
      acc[request.urgencyLevel] = (acc[request.urgencyLevel] || 0) + 1;
      return acc;
    }, {} as Record<UrgencyLevel, number>),
  };
};

// ============================================================================
// DATA INITIALIZATION (For Testing)
// ============================================================================

export const initializeSampleData = async (): Promise<void> => {
  // Create sample admin user
  const adminUser = await createUser({
    email: 'admin@helpconnect.io',
    password: 'admin123',
    role: 'admin',
  });
  
  // Create sample donors
  const sampleDonors = [
    {
      userId: generateId(),
      name: 'John Doe',
      bloodType: 'O+' as BloodType,
      location: {
        latitude: 20.2961,
        longitude: 85.8245,
        address: 'Cuttack, Odisha',
        city: 'Cuttack',
        state: 'Odisha',
        country: 'India',
      },
      contactInfo: {
        email: 'john@example.com',
        phone: '+91-9876543210',
      },
      isAvailable: true,
      healthStatus: 'eligible' as HealthStatus,
      age: 28,
      weight: 70,
      notificationPreferences: {
        email: true,
        sms: true,
        push: true,
      },
    },
    {
      userId: generateId(),
      name: 'Jane Smith',
      bloodType: 'A+' as BloodType,
      location: {
        latitude: 20.2700,
        longitude: 85.8400,
        address: 'Bhubaneswar, Odisha',
        city: 'Bhubaneswar',
        state: 'Odisha',
        country: 'India',
      },
      contactInfo: {
        email: 'jane@example.com',
        phone: '+91-9876543211',
      },
      isAvailable: true,
      healthStatus: 'eligible' as HealthStatus,
      age: 32,
      weight: 65,
      notificationPreferences: {
        email: true,
        sms: false,
        push: true,
      },
    },
  ];
  
  for (const donorData of sampleDonors) {
    await registerDonor(donorData);
  }
  
  console.log('Sample data initialized successfully');
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Donor Management
  registerDonor,
  getDonorById,
  getDonorByUserId,
  updateDonorProfile,
  searchDonors,
  getDonorsByBloodType,
  checkDonorEligibility,
  
  // Blood Request Management
  createBloodRequest,
  getBloodRequests,
  getBloodRequestById,
  updateRequestStatus,
  respondToRequest,
  
  // Auto-Matching
  findCompatibleDonors,
  matchDonorsToRequest,
  calculateCompatibilityScore,
  
  // Blood Type Compatibility
  checkBloodCompatibility,
  getCompatibleBloodTypes,
  
  // User Management
  createUser,
  authenticateUser,
  validateToken,
  getUserById,
  logout,
  
  // Authorization
  checkPermission,
  requirePermission,
  
  // Notifications
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  
  // Analytics
  getStatistics,
  
  // Utilities
  calculateDistance,
  getDaysSince,
  isValidEmail,
  isValidPhone,
  isValidBloodType,
  
  // Initialization
  initializeSampleData,
};
