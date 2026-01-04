import List "mo:core/List";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Nat "mo:core/Nat";

import AccessControl "authorization/access-control";

actor {
  module BloodType {
    public func toText(bloodType : BloodType) : Text {
      switch (bloodType) {
        case (#O_positive) { "O+" };
        case (#O_negative) { "O-" };
        case (#A_positive) { "A+" };
        case (#A_negative) { "A-" };
        case (#B_positive) { "B+" };
        case (#B_negative) { "B-" };
        case (#AB_positive) { "AB+" };
        case (#AB_negative) { "AB-" };
      };
    };

    public type BloodType = {
      #O_positive;
      #O_negative;
      #A_positive;
      #A_negative;
      #B_positive;
      #B_negative;
      #AB_positive;
      #AB_negative;
    };
  };

  module RequestStatus {
    public func toText(status : RequestStatus) : Text {
      switch (status) {
        case (#pending) { "Pending" };
        case (#searching) { "Searching" };
        case (#donor_contacted) { "Donor Contacted" };
        case (#matched) { "Matched" };
        case (#fulfilled) { "Fulfilled" };
        case (#expired) { "Expired" };
      };
    };

    public type RequestStatus = {
      #pending;
      #searching;
      #donor_contacted;
      #matched;
      #fulfilled;
      #expired;
    };
  };

  module DonorRole {
    public type Role = {
      #requester;
      #donor;
      #both;
    };
  };

  module HealthChecklist {
    public type Checklist = {
      noChronicIllness : Bool;
      noRecentSurgery : Bool;
      eligibleToDonate : Bool;
      notes : Text;
    };
  };

  module Donor {
    public func compare(donor1 : Donor, donor2 : Donor) : Order.Order {
      Text.compare(donor1.name, donor2.name);
    };
  };

  module BloodRequest {
    public func compare(request1 : BloodRequest, request2 : BloodRequest) : Order.Order {
      Text.compare(request1.recipientName, request2.recipientName);
    };
  };

  module Match {
    public func compare(match1 : Match, match2 : Match) : Order.Order {
      switch (Text.compare(match1.requestId, match2.requestId)) {
        case (#equal) { Text.compare(match1.donorId, match2.donorId) };
        case (order) { order };
      };
    };
  };

  module DonorInterest {
    public func compare(interest1 : DonorInterest, interest2 : DonorInterest) : Order.Order {
      switch (Text.compare(interest1.requestId, interest2.requestId)) {
        case (#equal) { Text.compare(interest1.donorId, interest2.donorId) };
        case (order) { order };
      };
    };
  };

  public type Donor = {
    id : Text;
    name : Text;
    bloodType : BloodType.BloodType;
    location : Text;
    contactInfo : Text;
    healthChecklist : HealthChecklist.Checklist;
    donationHistory : [Text];
    availability : Bool;
    owner : Principal;
  };

  public type BloodRequest = {
    id : Text;
    recipientName : Text;
    bloodType : BloodType.BloodType;
    location : Text;
    urgency : Text;
    contactInfo : Text;
    status : RequestStatus.RequestStatus;
    timeCreated : Int;
    unitsRequired : Nat;
    owner : Principal;
  };

  public type Match = {
    id : Text;
    requestId : Text;
    donorId : Text;
  };

  public type DonorInterest = {
    id : Text;
    requestId : Text;
    donorId : Text;
    timestamp : Int;
  };

  public type UserProfile = {
    name : Text;
    role : DonorRole.Role;
    contactInfo : Text;
  };

  public type DonorSummary = {
    firstName : Text;
    bloodType : BloodType.BloodType;
    location : Text;
    donorId : Text;
  };

  public type DonorContactResponse = {
    donorSummary : DonorSummary;
    contactInfo : Text;
  };

  public type PublicBloodRequest = {
    id : Text;
    recipientName : Text;
    bloodType : BloodType.BloodType;
    location : Text;
    urgency : Text;
    status : RequestStatus.RequestStatus;
    timeCreated : Int;
    unitsRequired : Nat;
  };

  let accessControlState = AccessControl.initState();
  let donors = Map.empty<Text, Donor>();
  let bloodRequests = Map.empty<Text, BloodRequest>();
  let matches = Map.empty<Text, Match>();
  let donorInterests = Map.empty<Text, DonorInterest>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  //------------------------------
  // Access Control Functions
  //------------------------------
  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  //------------------------------
  // User Profile Management
  //------------------------------
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  //------------------------------
  // Donor Management
  //------------------------------
  public shared ({ caller }) func createOrUpdateDonor(id : Text, name : Text, bloodType : BloodType.BloodType, location : Text, contactInfo : Text, healthChecklist : HealthChecklist.Checklist, availability : Bool) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create or update donor profiles");
    };

    switch (donors.get(id)) {
      case (?existingDonor) {
        if (existingDonor.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own donor profile");
        };
      };
      case (null) { () };
    };

    let donor : Donor = {
      id;
      name;
      bloodType;
      location;
      contactInfo;
      healthChecklist;
      donationHistory = [];
      availability;
      owner = caller;
    };
    donors.add(id, donor);
  };

  public query ({ caller }) func getDonor(id : Text) : async Donor {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view donor profiles");
    };

    switch (donors.get(id)) {
      case (?donor) {
        if (donor.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own donor profile");
        };
        donor;
      };
      case (null) {
        Runtime.trap("Donor not found");
      };
    };
  };

  public query ({ caller }) func getAllDonors() : async [Donor] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view all donors");
    };
    donors.values().toArray().sort();
  };

  public query ({ caller }) func getDonorsByBloodType(bloodType : BloodType.BloodType) : async [Donor] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can query donors by blood type");
    };
    donors.values().toArray().filter(
      func(donor) {
        donor.bloodType == bloodType;
      }
    ).sort();
  };

  public shared ({ caller }) func updateDonorAvailability(donorId : Text, available : Bool) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update donor availability");
    };

    switch (donors.get(donorId)) {
      case (?donor) {
        if (donor.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own donor availability");
        };

        let updatedDonor : Donor = {
          id = donor.id;
          name = donor.name;
          bloodType = donor.bloodType;
          location = donor.location;
          contactInfo = donor.contactInfo;
          healthChecklist = donor.healthChecklist;
          donationHistory = donor.donationHistory;
          availability = available;
          owner = donor.owner;
        };
        donors.add(donor.id, updatedDonor);
      };
      case (null) {
        Runtime.trap("Donor not found");
      };
    };
  };

  //------------------------------
  // Blood Request Management
  //------------------------------
  public shared ({ caller }) func createBloodRequest(id : Text, recipientName : Text, bloodType : BloodType.BloodType, location : Text, urgency : Text, contactInfo : Text, unitsRequired : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create blood requests");
    };

    let bloodRequest : BloodRequest = {
      id;
      recipientName;
      bloodType;
      location;
      urgency;
      contactInfo;
      status = #pending;
      timeCreated = Time.now();
      unitsRequired;
      owner = caller;
    };
    bloodRequests.add(id, bloodRequest);
  };

  public shared ({ caller }) func updateBloodRequestStatus(requestId : Text, status : RequestStatus.RequestStatus) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update blood request status");
    };

    switch (bloodRequests.get(requestId)) {
      case (?bloodRequest) {
        if (bloodRequest.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own blood request status");
        };

        let updatedRequest : BloodRequest = {
          id = bloodRequest.id;
          recipientName = bloodRequest.recipientName;
          bloodType = bloodRequest.bloodType;
          location = bloodRequest.location;
          urgency = bloodRequest.urgency;
          contactInfo = bloodRequest.contactInfo;
          unitsRequired = bloodRequest.unitsRequired;
          timeCreated = bloodRequest.timeCreated;
          status;
          owner = bloodRequest.owner;
        };
        bloodRequests.add(bloodRequest.id, updatedRequest);
      };
      case (null) {
        Runtime.trap("Blood request not found");
      };
    };
  };

  public query ({ caller }) func getBloodRequest(requestId : Text) : async BloodRequest {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view blood request details");
    };

    switch (bloodRequests.get(requestId)) {
      case (?bloodRequest) {
        // Allow access to: request owner, admins, or donors who expressed interest
        let isOwner = bloodRequest.owner == caller;
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);

        // Check if caller is a donor who expressed interest
        let hasExpressedInterest = donorInterests.values().toArray().find(
          func(interest) {
            interest.requestId == requestId and (
              switch (donors.get(interest.donorId)) {
                case (?donor) { donor.owner == caller };
                case (null) { false };
              }
            );
          }
        ) != null;

        if (not (isOwner or isAdmin or hasExpressedInterest)) {
          Runtime.trap("Unauthorized: Can only view your own requests or requests you expressed interest in");
        };

        bloodRequest;
      };
      case (null) {
        Runtime.trap("Blood request not found");
      };
    };
  };

  public query ({ caller }) func getAllBloodRequests() : async [PublicBloodRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view blood requests");
    };

    // Return public version without sensitive contact information
    bloodRequests.values().toArray().map(
      func(request) {
        {
          id = request.id;
          recipientName = request.recipientName;
          bloodType = request.bloodType;
          location = request.location;
          urgency = request.urgency;
          status = request.status;
          timeCreated = request.timeCreated;
          unitsRequired = request.unitsRequired;
        };
      }
    );
  };

  //------------------------------
  // Match Management
  //------------------------------
  public shared ({ caller }) func createMatch(requestId : Text, donorId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create matches");
    };

    switch (donors.get(donorId)) {
      case (?donor) {
        if (donor.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only create matches with your own donor profile");
        };
      };
      case (null) {
        Runtime.trap("Donor not found");
      };
    };

    switch (bloodRequests.get(requestId)) {
      case (?request) {
        switch (request.status) {
          case (#fulfilled) {
            Runtime.trap("Cannot match: Blood request already fulfilled");
          };
          case (#expired) {
            Runtime.trap("Cannot match: Blood request expired");
          };
          case (_) {};
        };
      };
      case (null) {
        Runtime.trap("Blood request not found");
      };
    };

    let matchId = requestId # "_" # donorId;
    let match : Match = {
      id = matchId;
      requestId;
      donorId;
    };
    matches.add(matchId, match);
  };

  public query ({ caller }) func getMatch(matchId : Text) : async Match {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view matches");
    };

    switch (matches.get(matchId)) {
      case (?match) {
        // Verify caller is involved in the match (either as donor owner or request owner)
        let isDonorOwner = switch (donors.get(match.donorId)) {
          case (?donor) { donor.owner == caller };
          case (null) { false };
        };

        let isRequestOwner = switch (bloodRequests.get(match.requestId)) {
          case (?request) { request.owner == caller };
          case (null) { false };
        };

        let isAdmin = AccessControl.isAdmin(accessControlState, caller);

        if (not (isDonorOwner or isRequestOwner or isAdmin)) {
          Runtime.trap("Unauthorized: Can only view matches you are involved in");
        };

        match;
      };
      case (null) {
        Runtime.trap("Match not found");
      };
    };
  };

  public query ({ caller }) func getAllMatches() : async [Match] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view all matches");
    };
    matches.values().toArray().sort();
  };

  //------------------------------
  // Filtering and Compatibility
  //------------------------------
  public query ({ caller }) func getBloodRequestsByStatus(status : RequestStatus.RequestStatus) : async [PublicBloodRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can query blood requests");
    };

    bloodRequests.values().toArray().filter(
      func(request) {
        request.status == status;
      }
    ).map(
      func(request) {
        {
          id = request.id;
          recipientName = request.recipientName;
          bloodType = request.bloodType;
          location = request.location;
          urgency = request.urgency;
          status = request.status;
          timeCreated = request.timeCreated;
          unitsRequired = request.unitsRequired;
        };
      }
    );
  };

  public query ({ caller }) func getDonorsByAvailability(available : Bool) : async [Donor] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can query donors by availability");
    };
    donors.values().toArray().filter(
      func(donor) {
        donor.availability == available;
      }
    ).sort();
  };

  public query ({ caller }) func getCompatibleDonorBloodTypes(recipientBloodType : BloodType.BloodType) : async [BloodType.BloodType] {
    // This is informational data, no sensitive information exposed
    switch (recipientBloodType) {
      case (#O_positive) {
        [
          #O_positive,
          #O_negative,
        ];
      };
      case (#O_negative) { [#O_negative] };
      case (#A_positive) {
        [
          #A_positive,
          #A_negative,
          #O_positive,
          #O_negative,
        ];
      };
      case (#B_positive) {
        [
          #B_positive,
          #B_negative,
          #O_positive,
          #O_negative,
        ];
      };
      case (#AB_positive) {
        [
          #O_negative,
          #O_positive,
          #A_negative,
          #A_positive,
          #B_negative,
          #B_positive,
          #AB_positive,
          #AB_negative,
        ];
      };
      case (#A_negative) {
        [#O_negative, #A_negative];
      };
      case (#B_negative) {
        [#O_negative, #B_negative];
      };
      case (#AB_negative) {
        [#O_negative, #A_negative, #B_negative, #AB_negative];
      };
    };
  };

  //------------------------------
  // Enhanced Matching Visibility
  //------------------------------
  public query ({ caller }) func findCompatibleDonors(bloodType : BloodType.BloodType) : async [Donor] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can query all compatible donors");
    };

    let compatibleBloodTypes = switch (bloodType) {
      case (#O_positive) {
        [
          #O_positive,
          #O_negative,
        ];
      };
      case (#O_negative) { [#O_negative] };
      case (#A_positive) {
        [
          #A_positive,
          #A_negative,
          #O_positive,
          #O_negative,
        ];
      };
      case (#B_positive) {
        [
          #B_positive,
          #B_negative,
          #O_positive,
          #O_negative,
        ];
      };
      case (#AB_positive) {
        [
          #O_negative,
          #O_positive,
          #A_negative,
          #A_positive,
          #B_negative,
          #B_positive,
          #AB_positive,
          #AB_negative,
        ];
      };
      case (#A_negative) {
        [#O_negative, #A_negative];
      };
      case (#B_negative) {
        [#O_negative, #B_negative];
      };
      case (#AB_negative) {
        [#O_negative, #A_negative, #B_negative, #AB_negative];
      };
    };
    donors.values().toArray().filter(
      func(donor) {
        compatibleBloodTypes.find(
          func(bt) {
            bt == donor.bloodType;
          }
        ) != null;
      }
    ).sort();
  };

  public query ({ caller }) func findDonorsNearby(bloodType : BloodType.BloodType, city : Text) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can search for donors");
    };

    // Return only count for privacy, not actual donor details
    let count = donors.values().foldLeft(
      0,
      func(acc, donor) {
        if (donor.bloodType == bloodType and donor.location == city) {
          acc + 1;
        } else {
          acc;
        };
      },
    );
    count;
  };

  public query ({ caller }) func getRequestsForDonor(donorId : Text) : async [PublicBloodRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view requests for donors");
    };

    switch (donors.get(donorId)) {
      case (?donor) {
        if (donor.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view requests for your own donor profile");
        };

        bloodRequests.values().toArray().filter(
          func(request) {
            request.bloodType == donor.bloodType and request.location == donor.location;
          }
        ).map(
          func(request) {
            {
              id = request.id;
              recipientName = request.recipientName;
              bloodType = request.bloodType;
              location = request.location;
              urgency = request.urgency;
              status = request.status;
              timeCreated = request.timeCreated;
              unitsRequired = request.unitsRequired;
            };
          }
        );
      };
      case (null) {
        Runtime.trap("Donor not found");
      };
    };
  };

  public query ({ caller }) func getAvailableRequestsForDonor(donorId : Text) : async [PublicBloodRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view available requests");
    };

    switch (donors.get(donorId)) {
      case (?donor) {
        if (donor.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view requests for your own donor profile");
        };

        bloodRequests.values().toArray().filter(
          func(request) {
            request.bloodType == donor.bloodType and request.location == donor.location and request.status != #fulfilled and request.status != #expired and request.status != #matched
          }
        ).map(
          func(request) {
            {
              id = request.id;
              recipientName = request.recipientName;
              bloodType = request.bloodType;
              location = request.location;
              urgency = request.urgency;
              status = request.status;
              timeCreated = request.timeCreated;
              unitsRequired = request.unitsRequired;
            };
          }
        );
      };
      case (null) {
        Runtime.trap("Donor not found");
      };
    };
  };

  //------------------------------
  // Donor Interest Flow
  //------------------------------
  public shared ({ caller }) func createDonorInterest(requestId : Text, donorId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can express donor interest");
    };

    switch (donors.get(donorId)) {
      case (?donor) {
        if (donor.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only express interest with your own donor profile");
        };
      };
      case (null) {
        Runtime.trap("Donor does not exist");
      };
    };

    let existing = donorInterests.values().find(
      func(interest) { interest.requestId == requestId and interest.donorId == donorId }
    );
    if (existing != null) {
      Runtime.trap("Interest already recorded for this request");
    };

    switch (bloodRequests.get(requestId)) {
      case (?request) {
        let newInterest : DonorInterest = {
          id = requestId # "_" # donorId;
          requestId;
          donorId;
          timestamp = Time.now();
        };

        if (request.status == #searching) {
          let updatedRequest : BloodRequest = {
            id = request.id;
            recipientName = request.recipientName;
            bloodType = request.bloodType;
            location = request.location;
            urgency = request.urgency;
            contactInfo = request.contactInfo;
            unitsRequired = request.unitsRequired;
            timeCreated = request.timeCreated;
            status = #donor_contacted;
            owner = request.owner;
          };
          bloodRequests.add(request.id, updatedRequest);
        };

        donorInterests.add(newInterest.id, newInterest);
      };
      case (null) {
        Runtime.trap("Request does not exist");
      };
    };
  };

  public query ({ caller }) func getDonorInterestsByRequest(requestId : Text) : async [DonorInterest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view donor interests");
    };

    switch (bloodRequests.get(requestId)) {
      case (?request) {
        if (request.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view interests for your own requests");
        };
      };
      case (null) {
        Runtime.trap("Blood request not found");
      };
    };

    donorInterests.values().toArray().filter(
      func(interest) {
        interest.requestId == requestId;
      }
    ).sort();
  };

  public query ({ caller }) func countDonorInterests(requestId : Text) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view donor interest counts");
    };

    switch (bloodRequests.get(requestId)) {
      case (?request) {
        if (request.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view interest count for your own requests");
        };
      };
      case (null) {
        Runtime.trap("Blood request not found");
      };
    };

    let count = donorInterests.values().foldLeft(
      0,
      func(acc, interest) {
        if (interest.requestId == requestId) { acc + 1 } else { acc };
      },
    );
    count;
  };

  //------------------------------
  // My Blood Requests Page Enhancements
  //------------------------------
  public query ({ caller }) func getInterestedDonorsForRequest(requestId : Text) : async [DonorSummary] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view interested donors");
    };

    switch (bloodRequests.get(requestId)) {
      case (?request) {
        if (request.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view interested donors for your own requests");
        };
      };
      case (null) {
        Runtime.trap("Blood request not found");
      };
    };

    let interests = donorInterests.values().toArray().filter(
      func(interest) { interest.requestId == requestId }
    );

    let result = List.empty<DonorSummary>();
    for (interest in interests.values()) {
      switch (donors.get(interest.donorId)) {
        case (?donor) {
          let summary : DonorSummary = {
            firstName = donor.name;
            bloodType = donor.bloodType;
            location = donor.location;
            donorId = donor.id;
          };
          result.add(summary);
        };
        case (null) { () };
      };
    };
    result.toArray();
  };

  //------------------------------
  // Manual Donor Selection Logic
  //------------------------------
  public shared ({ caller }) func confirmDonorMatch(requestId : Text, donorId : Text) : async DonorContactResponse {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can confirm donor matches");
    };

    switch (bloodRequests.get(requestId)) {
      case (?request) {
        if (request.owner != caller) {
          Runtime.trap("Unauthorized: Only the requester can contact donors for this request");
        };

        switch (donors.get(donorId)) {
          case (?donor) {
            let eligibleDonors = donorInterests.values().toArray().find(
              func(interest) { interest.requestId == requestId and interest.donorId == donorId }
            );
            if (eligibleDonors == null) {
              Runtime.trap("Donor has not expressed interest in this request");
            };

            let updatedRequest : BloodRequest = {
              id = request.id;
              recipientName = request.recipientName;
              bloodType = request.bloodType;
              location = request.location;
              urgency = request.urgency;
              contactInfo = request.contactInfo;
              status = #matched;
              timeCreated = request.timeCreated;
              unitsRequired = request.unitsRequired;
              owner = request.owner;
            };
            bloodRequests.add(request.id, updatedRequest);

            let summary : DonorSummary = {
              firstName = donor.name;
              bloodType = donor.bloodType;
              location = donor.location;
              donorId = donor.id;
            };

            {
              donorSummary = summary;
              contactInfo = donor.contactInfo;
            };
          };
          case (null) {
            Runtime.trap("Donor not found");
          };
        };
      };
      case (null) {
        Runtime.trap("Blood request not found");
      };
    };
  };
};

