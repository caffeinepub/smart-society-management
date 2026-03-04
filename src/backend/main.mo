import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Types
  public type UserProfile = {
    name : Text;
    unitId : ?Nat; // Optional unit association
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // PROPERTIES Module Types
  type Tower = {
    id : Nat;
    name : Text;
    totalFloors : Nat;
  };

  type Unit = {
    id : Nat;
    towerId : Nat;
    unitNumber : Text;
    floor : Nat;
    ownerName : Text;
    ownerId : ?Principal; // Link to user
    isOccupied : Bool;
    monthlyMaintenance : Nat;
  };

  // BILLING Module Types
  public type BillBreakdown = {
    serviceCharges : Nat;
    nonOccupancyCharges : Nat;
    liftMaintenance : Nat;
    parkingCharges : Nat;
    sinkingFund : Nat;
    otherCharges : Nat;
    houseTax : Nat;
    repairMaintenance : Nat;
    interest : Nat;
  };

  public type Bill = {
    id : Nat;
    unitId : Nat;
    unitNumber : Text;
    amount : Nat;
    dueDate : Text;
    month : Nat;
    year : Nat;
    status : Text; // Pending, Paid, Overdue
    previousDue : Nat;
    grandTotal : Nat;
    breakdown : BillBreakdown;
    societyId : Nat;
  };

  type Payment = {
    id : Nat;
    billId : Nat;
    amount : Nat;
    paidAt : Text;
    paymentMethod : Text;
  };

  type FinancialSummary = {
    totalBilled : Nat;
    totalCollected : Nat;
    pendingDues : Nat;
  };

  // SECURITY Module Types
  type Visitor = {
    id : Nat;
    name : Text;
    phone : Text;
    purpose : Text;
    hostUnit : Text;
    hostUnitId : Nat;
    checkInTime : Text;
    checkOutTime : ?Text;
    status : Text; // Active, CheckedOut
  };

  // COMMUNICATION Module Types
  type Notice = {
    id : Nat;
    title : Text;
    content : Text;
    category : Text;
    postedBy : Text;
    postedAt : Text;
    isActive : Bool;
  };

  type Complaint = {
    id : Nat;
    title : Text;
    description : Text;
    category : Text;
    unitNumber : Text;
    residentName : Text;
    residentId : Principal;
    status : Text; // Open, InProgress, Resolved
    priority : Text; // Low, Medium, High
    createdAt : Text;
    resolution : ?Text;
  };

  type PollOption = {
    id : Nat;
    text : Text;
    votes : Nat;
  };

  type Poll = {
    id : Nat;
    question : Text;
    options : [PollOption];
    createdBy : Text;
    createdAt : Text;
    isActive : Bool;
  };

  // STAFF Module Types
  type Staff = {
    id : Nat;
    name : Text;
    role : Text;
    phone : Text;
    salary : Nat;
    joiningDate : Text;
    isActive : Bool;
  };

  type Attendance = {
    id : Nat;
    staffId : Nat;
    date : Text;
    status : Text; // Present, Absent, HalfDay
  };

  type SalaryRecord = {
    id : Nat;
    staffId : Nat;
    month : Nat;
    year : Nat;
    amount : Nat;
    paidOn : Text;
    status : Text; // Paid, Pending
  };

  // SOCIETY Module Types
  type SocietyInfo = {
    name : Text;
    address : Text;
    city : Text;
    registrationNumber : Text;
    contactPhone : Text;
  };

  // State Variables
  let towers = Map.empty<Nat, Tower>();
  let units = Map.empty<Nat, Unit>();
  let bills = Map.empty<Nat, Bill>();
  let payments = Map.empty<Nat, Payment>();
  let visitors = Map.empty<Nat, Visitor>();
  let notices = Map.empty<Nat, Notice>();
  let complaints = Map.empty<Nat, Complaint>();
  let polls = Map.empty<Nat, Poll>();
  let pollVotes = Map.empty<Principal, Map.Map<Nat, Nat>>(); // user -> (pollId -> optionId)
  let staff = Map.empty<Nat, Staff>();
  let attendance = Map.empty<Nat, Attendance>();
  let salaryRecords = Map.empty<Nat, SalaryRecord>();
  var societyInfo : ?SocietyInfo = null;

  var nextTowerId = 0;
  var nextUnitId = 0;
  var nextBillId = 0;
  var nextPaymentId = 0;
  var nextVisitorId = 0;
  var nextNoticeId = 0;
  var nextComplaintId = 0;
  var nextPollId = 0;
  var nextStaffId = 0;
  var nextAttendanceId = 0;
  var nextSalaryRecordId = 0;

  // Helper function to get unit owner
  func getUnitOwner(unitId : Nat) : ?Principal {
    switch (units.get(unitId)) {
      case (?unit) { unit.ownerId };
      case (null) { null };
    };
  };

  // Helper function to check if caller owns unit
  func isUnitOwner(caller : Principal, unitId : Nat) : Bool {
    switch (getUnitOwner(unitId)) {
      case (?owner) { Principal.equal(caller, owner) };
      case (null) { false };
    };
  };

  // USER PROFILE FUNCTIONS
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not Principal.equal(caller, user) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // PROPERTIES MODULE

  public shared ({ caller }) func createTower(name : Text, totalFloors : Nat) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create towers");
    };

    let tower : Tower = {
      id = nextTowerId;
      name;
      totalFloors;
    };
    towers.add(nextTowerId, tower);
    let id = nextTowerId;
    nextTowerId += 1;
    id;
  };

  public shared ({ caller }) func updateTower(id : Nat, name : Text, totalFloors : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update towers");
    };

    switch (towers.get(id)) {
      case (?tower) {
        let updatedTower : Tower = { id; name; totalFloors };
        towers.add(id, updatedTower);
      };
      case (null) {
        Runtime.trap("Tower not found");
      };
    };
  };

  public shared ({ caller }) func deleteTower(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete towers");
    };

    towers.remove(id);
  };

  public query ({ caller }) func getTowers() : async [Tower] {
    // Anyone can view towers
    towers.values().toArray();
  };

  public shared ({ caller }) func createUnit(
    towerId : Nat,
    unitNumber : Text,
    floor : Nat,
    ownerName : Text,
    ownerId : ?Principal,
    isOccupied : Bool,
    monthlyMaintenance : Nat,
  ) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create units");
    };

    let unit : Unit = {
      id = nextUnitId;
      towerId;
      unitNumber;
      floor;
      ownerName;
      ownerId;
      isOccupied;
      monthlyMaintenance;
    };
    units.add(nextUnitId, unit);
    let id = nextUnitId;
    nextUnitId += 1;
    id;
  };

  public shared ({ caller }) func updateUnit(
    id : Nat,
    towerId : Nat,
    unitNumber : Text,
    floor : Nat,
    ownerName : Text,
    ownerId : ?Principal,
    isOccupied : Bool,
    monthlyMaintenance : Nat,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update units");
    };

    switch (units.get(id)) {
      case (?unit) {
        let updatedUnit : Unit = {
          id;
          towerId;
          unitNumber;
          floor;
          ownerName;
          ownerId;
          isOccupied;
          monthlyMaintenance;
        };
        units.add(id, updatedUnit);
      };
      case (null) {
        Runtime.trap("Unit not found");
      };
    };
  };

  public shared ({ caller }) func deleteUnit(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete units");
    };

    units.remove(id);
  };

  public query ({ caller }) func getUnits() : async [Unit] {
    // Anyone can view units
    units.values().toArray();
  };

  // BILLING MODULE

  public shared ({ caller }) func createBill(
    unitId : Nat,
    unitNumber : Text,
    amount : Nat,
    dueDate : Text,
    month : Nat,
    year : Nat,
    previousDue : Nat,
    grandTotal : Nat,
    societyId : Nat,
    breakdown : BillBreakdown,
  ) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create bills");
    };

    let bill : Bill = {
      id = nextBillId;
      unitId;
      unitNumber;
      amount;
      dueDate;
      month;
      year;
      status = "Pending";
      previousDue;
      grandTotal;
      breakdown;
      societyId;
    };
    bills.add(nextBillId, bill);
    let id = nextBillId;
    nextBillId += 1;
    id;
  };

  public shared ({ caller }) func updateBill(
    id : Nat,
    unitId : Nat,
    unitNumber : Text,
    amount : Nat,
    dueDate : Text,
    month : Nat,
    year : Nat,
    previousDue : Nat,
    grandTotal : Nat,
    societyId : Nat,
    breakdown : BillBreakdown,
    status : Text,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update bills");
    };

    switch (bills.get(id)) {
      case (?_) {
        let updatedBill : Bill = {
          id;
          unitId;
          unitNumber;
          amount;
          dueDate;
          month;
          year;
          previousDue;
          grandTotal;
          breakdown;
          status;
          societyId;
        };
        bills.add(id, updatedBill);
      };
      case (null) {
        Runtime.trap("Bill not found");
      };
    };
  };

  public shared ({ caller }) func recordPayment(billId : Nat, amount : Nat, paymentMethod : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record payments");
    };

    // Verify bill exists
    switch (bills.get(billId)) {
      case (?bill) {
        // Verify user owns the unit (admins can pay any bill)
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          if (not isUnitOwner(caller, bill.unitId)) {
            Runtime.trap("Unauthorized: Can only pay bills for your own unit");
          };
        };

        let payment : Payment = {
          id = nextPaymentId;
          billId;
          amount;
          paidAt = Time.now().toText();
          paymentMethod;
        };
        payments.add(nextPaymentId, payment);

        // Update bill status
        let updatedBill : Bill = {
          bill with
          status = "Paid";
        };
        bills.add(billId, updatedBill);

        nextPaymentId += 1;
      };
      case (null) {
        Runtime.trap("Bill not found");
      };
    };
  };

  public query ({ caller }) func getBills() : async [Bill] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bills");
    };

    // Admins see all bills, users see only their own
    if (AccessControl.isAdmin(accessControlState, caller)) {
      bills.values().toArray();
    } else {
      bills.values().toArray().filter(
        func(bill : Bill) : Bool {
          isUnitOwner(caller, bill.unitId);
        }
      );
    };
  };

  public shared ({ caller }) func deleteBill(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete bills");
    };

    bills.remove(id);
  };

  public shared ({ caller }) func deleteAllBills() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete all bills");
    };

    // Remove all entries from the bills map
    for ((key, _) in bills.entries()) {
      bills.remove(key);
    };
  };

  public query ({ caller }) func getFinancialSummary() : async FinancialSummary {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view financial summary");
    };

    let totalBilled = bills.values().toArray().foldLeft(
      0,
      func(acc : Nat, bill : Bill) : Nat { acc + bill.amount },
    );

    let totalCollected = payments.values().toArray().foldLeft(
      0,
      func(acc : Nat, payment : Payment) : Nat { acc + payment.amount },
    );

    let pendingDues = bills.values().toArray().foldLeft(
      0,
      func(acc : Nat, bill : Bill) : Nat {
        if (bill.status == "Pending") { acc + bill.amount } else { acc };
      },
    );

    {
      totalBilled;
      totalCollected;
      pendingDues;
    };
  };

  // SECURITY MODULE

  public shared ({ caller }) func registerVisitor(
    name : Text,
    phone : Text,
    purpose : Text,
    hostUnit : Text,
    hostUnitId : Nat,
    checkInTime : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register visitors");
    };

    // Verify caller owns the host unit or is admin
    if (not AccessControl.isAdmin(accessControlState, caller) and not isUnitOwner(caller, hostUnitId)) {
      Runtime.trap("Unauthorized: Can only register visitors for your own unit");
    };

    let visitor : Visitor = {
      id = nextVisitorId;
      name;
      phone;
      purpose;
      hostUnit;
      hostUnitId;
      checkInTime;
      checkOutTime = null;
      status = "Active";
    };
    visitors.add(nextVisitorId, visitor);
    let id = nextVisitorId;
    nextVisitorId += 1;
    id;
  };

  public shared ({ caller }) func checkOutVisitor(id : Nat, checkOutTime : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check out visitors");
    };

    switch (visitors.get(id)) {
      case (?visitor) {
        // Verify caller owns the host unit or is admin
        if (not AccessControl.isAdmin(accessControlState, caller) and not isUnitOwner(caller, visitor.hostUnitId)) {
          Runtime.trap("Unauthorized: Can only check out visitors for your own unit");
        };

        let updatedVisitor : Visitor = {
          visitor with
          checkOutTime = ?checkOutTime;
          status = "CheckedOut";
        };
        visitors.add(id, updatedVisitor);
      };
      case (null) {
        Runtime.trap("Visitor not found");
      };
    };
  };

  public query ({ caller }) func getVisitors() : async [Visitor] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view visitors");
    };

    // Admins see all visitors, users see only their own
    if (AccessControl.isAdmin(accessControlState, caller)) {
      visitors.values().toArray();
    } else {
      visitors.values().toArray().filter(
        func(visitor : Visitor) : Bool {
          isUnitOwner(caller, visitor.hostUnitId);
        }
      );
    };
  };

  public query ({ caller }) func getActiveVisitors() : async [Visitor] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view active visitors");
    };

    // Admins see all active visitors, users see only their own
    let activeVisitors = visitors.values().toArray().filter(
      func(visitor : Visitor) : Bool {
        visitor.status == "Active";
      }
    );

    if (AccessControl.isAdmin(accessControlState, caller)) {
      activeVisitors;
    } else {
      activeVisitors.filter(
        func(visitor : Visitor) : Bool {
          isUnitOwner(caller, visitor.hostUnitId);
        }
      );
    };
  };

  // COMMUNICATION MODULE

  public shared ({ caller }) func createNotice(
    title : Text,
    content : Text,
    category : Text,
    postedBy : Text,
    postedAt : Text,
  ) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create notices");
    };

    let notice : Notice = {
      id = nextNoticeId;
      title;
      content;
      category;
      postedBy;
      postedAt;
      isActive = true;
    };
    notices.add(nextNoticeId, notice);
    let id = nextNoticeId;
    nextNoticeId += 1;
    id;
  };

  public query ({ caller }) func getNotices() : async [Notice] {
    // Anyone can view notices
    notices.values().toArray();
  };

  public shared ({ caller }) func createComplaint(
    title : Text,
    description : Text,
    category : Text,
    unitNumber : Text,
    residentName : Text,
    priority : Text,
    createdAt : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create complaints");
    };

    let complaint : Complaint = {
      id = nextComplaintId;
      title;
      description;
      category;
      unitNumber;
      residentName;
      residentId = caller;
      status = "Open";
      priority;
      createdAt;
      resolution = null;
    };
    complaints.add(nextComplaintId, complaint);
    let id = nextComplaintId;
    nextComplaintId += 1;
    id;
  };

  public shared ({ caller }) func updateComplaintStatus(id : Nat, status : Text, resolution : ?Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update complaint status");
    };

    switch (complaints.get(id)) {
      case (?complaint) {
        let updatedComplaint : Complaint = {
          complaint with
          status;
          resolution;
        };
        complaints.add(id, updatedComplaint);
      };
      case (null) {
        Runtime.trap("Complaint not found");
      };
    };
  };

  public query ({ caller }) func getComplaints() : async [Complaint] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view complaints");
    };

    // Admins see all complaints, users see only their own
    if (AccessControl.isAdmin(accessControlState, caller)) {
      complaints.values().toArray();
    } else {
      complaints.values().toArray().filter(
        func(complaint : Complaint) : Bool {
          Principal.equal(complaint.residentId, caller);
        }
      );
    };
  };

  public shared ({ caller }) func createPoll(
    question : Text,
    options : [Text],
    createdBy : Text,
    createdAt : Text,
  ) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create polls");
    };

    let pollOptions = Array.tabulate(
      options.size(),
      func(i : Nat) : PollOption {
        { id = i; text = options[i]; votes = 0 };
      },
    );

    let poll : Poll = {
      id = nextPollId;
      question;
      options = pollOptions;
      createdBy;
      createdAt;
      isActive = true;
    };
    polls.add(nextPollId, poll);
    let id = nextPollId;
    nextPollId += 1;
    id;
  };

  public shared ({ caller }) func voteOnPoll(pollId : Nat, optionId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can vote on polls");
    };

    // Check if user already voted
    switch (pollVotes.get(caller)) {
      case (?userVotes) {
        switch (userVotes.get(pollId)) {
          case (?_) {
            Runtime.trap("Already voted on this poll");
          };
          case (null) {};
        };
      };
      case (null) {};
    };

    switch (polls.get(pollId)) {
      case (?poll) {
        if (not poll.isActive) {
          Runtime.trap("Poll is not active");
        };

        // Update vote count
        let updatedOptions = poll.options.map(
          func(option : PollOption) : PollOption {
            if (option.id == optionId) {
              { option with votes = option.votes + 1 };
            } else {
              option;
            };
          },
        );

        let updatedPoll : Poll = { poll with options = updatedOptions };
        polls.add(pollId, updatedPoll);

        // Record user vote
        let userVotes = switch (pollVotes.get(caller)) {
          case (?votes) { votes };
          case (null) { Map.empty<Nat, Nat>() };
        };
        userVotes.add(pollId, optionId);
        pollVotes.add(caller, userVotes);
      };
      case (null) {
        Runtime.trap("Poll not found");
      };
    };
  };

  public query ({ caller }) func getPolls() : async [Poll] {
    // Anyone can view polls
    polls.values().toArray();
  };

  // STAFF MODULE

  public shared ({ caller }) func addStaff(
    name : Text,
    role : Text,
    phone : Text,
    salary : Nat,
    joiningDate : Text,
  ) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add staff");
    };

    let staffMember : Staff = {
      id = nextStaffId;
      name;
      role;
      phone;
      salary;
      joiningDate;
      isActive = true;
    };
    staff.add(nextStaffId, staffMember);
    let id = nextStaffId;
    nextStaffId += 1;
    id;
  };

  public query ({ caller }) func getStaff() : async [Staff] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view staff");
    };

    staff.values().toArray();
  };

  public shared ({ caller }) func markAttendance(staffId : Nat, date : Text, status : Text) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can mark attendance");
    };

    let attendanceRecord : Attendance = {
      id = nextAttendanceId;
      staffId;
      date;
      status;
    };
    attendance.add(nextAttendanceId, attendanceRecord);
    let id = nextAttendanceId;
    nextAttendanceId += 1;
    id;
  };

  public query ({ caller }) func getAttendance() : async [Attendance] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view attendance");
    };

    attendance.values().toArray();
  };

  public shared ({ caller }) func addSalaryRecord(
    staffId : Nat,
    month : Nat,
    year : Nat,
    amount : Nat,
    paidOn : Text,
    status : Text,
  ) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add salary records");
    };

    let salaryRecord : SalaryRecord = {
      id = nextSalaryRecordId;
      staffId;
      month;
      year;
      amount;
      paidOn;
      status;
    };
    salaryRecords.add(nextSalaryRecordId, salaryRecord);
    let id = nextSalaryRecordId;
    nextSalaryRecordId += 1;
    id;
  };

  public query ({ caller }) func getSalaryRecords() : async [SalaryRecord] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view salary records");
    };

    salaryRecords.values().toArray();
  };

  // SOCIETY MODULE

  public query ({ caller }) func getSocietyInfo() : async ?SocietyInfo {
    // Anyone can view society info
    societyInfo;
  };

  public shared ({ caller }) func updateSocietyInfo(
    name : Text,
    address : Text,
    city : Text,
    registrationNumber : Text,
    contactPhone : Text,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update society info");
    };

    societyInfo := ?{
      name;
      address;
      city;
      registrationNumber;
      contactPhone;
    };
  };
};
