import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  type OldBill = {
    id : Nat;
    unitId : Nat;
    unitNumber : Text;
    amount : Nat;
    dueDate : Text;
    month : Nat;
    year : Nat;
    status : Text;
  };

  type OldActor = {
    bills : Map.Map<Nat, OldBill>;
  };

  type BillBreakdown = {
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

  type NewBill = {
    id : Nat;
    unitId : Nat;
    unitNumber : Text;
    amount : Nat;
    dueDate : Text;
    month : Nat;
    year : Nat;
    status : Text;
    previousDue : Nat;
    grandTotal : Nat;
    breakdown : BillBreakdown;
    societyId : Nat;
  };

  type NewActor = {
    bills : Map.Map<Nat, NewBill>;
  };

  public func run(old : OldActor) : NewActor {
    let newBills = old.bills.map<Nat, OldBill, NewBill>(
      func(_id, oldBill) {
        {
          oldBill with
          previousDue = 0;
          grandTotal = 0;
          societyId = 0;
          breakdown = {
            serviceCharges = 0;
            nonOccupancyCharges = 0;
            liftMaintenance = 0;
            parkingCharges = 0;
            sinkingFund = 0;
            otherCharges = 0;
            houseTax = 0;
            repairMaintenance = 0;
            interest = 0;
          };
        };
      }
    );
    { bills = newBills };
  };
};
