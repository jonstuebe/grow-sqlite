import { describe, it, expect, beforeEach } from "vitest";
import {
  parseLegacyBackup,
  getImportPreview,
  getItemsArray,
  convertLegacyItemForDb,
  getTransactionTimestamp,
  calculateBalanceFromTransactions,
  calculateAdjustmentAmount,
  type LegacyBackupData,
} from "./import-parser";

// Fake backup data for testing (anonymized)
const FAKE_BACKUP_JSON = `{"json":{"aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa":{"id":"aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa","name":"Emergency Fund","curAmount":5000,"goal":false,"goalAmount":25000,"transactions":[{"id":"a0000001-0001-4001-0001-000000000001","type":"deposit","amount":500,"date":1700000000000},{"id":"a0000002-0002-4002-0002-000000000002","type":"deposit","amount":400,"date":1700100000000},{"id":"a0000003-0003-4003-0003-000000000003","type":"deposit","amount":350,"date":1700200000000},{"id":"a0000004-0004-4004-0004-000000000004","type":"deposit","amount":300,"date":1700300000000},{"id":"a0000005-0005-4005-0005-000000000005","type":"withdrawal","amount":200,"date":1700400000000},{"id":"a0000006-0006-4006-0006-000000000006","type":"deposit","amount":400,"date":1700500000000},{"id":"a0000007-0007-4007-0007-000000000007","type":"withdrawal","amount":175,"date":1700600000000},{"id":"a0000008-0008-4008-0008-000000000008","type":"deposit","amount":350,"date":1700700000000},{"id":"a0000009-0009-4009-0009-000000000009","type":"withdrawal","amount":150,"date":1700800000000},{"id":"a0000010-0010-4010-0010-000000000010","type":"deposit","amount":300,"date":1700900000000},{"id":"a0000011-0011-4011-0011-000000000011","type":"withdrawal","amount":150,"date":1701000000000},{"id":"a0000012-0012-4012-0012-000000000012","type":"deposit","amount":250,"date":1701100000000},{"id":"a0000013-0013-4013-0013-000000000013","type":"withdrawal","amount":125,"date":1701200000000},{"id":"a0000014-0014-4014-0014-000000000014","type":"deposit","amount":400,"date":1701300000000},{"id":"a0000015-0015-4015-0015-000000000015","type":"withdrawal","amount":125,"date":1701400000000},{"id":"a0000016-0016-4016-0016-000000000016","type":"deposit","amount":350,"date":1701500000000},{"id":"a0000017-0017-4017-0017-000000000017","type":"withdrawal","amount":125,"date":1701600000000},{"id":"a0000018-0018-4018-0018-000000000018","type":"deposit","amount":300,"date":1701700000000},{"id":"a0000019-0019-4019-0019-000000000019","type":"withdrawal","amount":150,"date":1701800000000},{"id":"a0000020-0020-4020-0020-000000000020","type":"deposit","amount":250,"date":1701900000000},{"id":"a0000021-0021-4021-0021-000000000021","type":"withdrawal","amount":150,"date":1702000000000},{"id":"a0000022-0022-4022-0022-000000000022","type":"deposit","amount":400,"date":1702100000000},{"id":"a0000023-0023-4023-0023-000000000023","type":"withdrawal","amount":125,"date":1702200000000},{"id":"a0000024-0024-4024-0024-000000000024","type":"deposit","amount":350,"date":1702300000000},{"id":"a0000025-0025-4025-0025-000000000025","type":"withdrawal","amount":125,"date":1702400000000},{"id":"a0000026-0026-4026-0026-000000000026","type":"deposit","amount":300,"date":1702500000000},{"id":"a0000027-0027-4027-0027-000000000027","type":"withdrawal","amount":100,"date":1702600000000},{"id":"a0000028-0028-4028-0028-000000000028","type":"deposit","amount":250,"date":1702700000000},{"id":"a0000029-0029-4029-0029-000000000029","type":"withdrawal","amount":100,"date":1702800000000},{"id":"a0000030-0030-4030-0030-000000000030","type":"deposit","amount":400,"date":1702900000000},{"id":"a0000031-0031-4031-0031-000000000031","type":"withdrawal","amount":100,"date":1703000000000},{"id":"a0000032-0032-4032-0032-000000000032","type":"deposit","amount":350,"date":1703100000000},{"id":"a0000033-0033-4033-0033-000000000033","type":"deposit","amount":300,"date":1703200000000},{"id":"a0000034-0034-4034-0034-000000000034","type":"deposit","amount":200,"date":1703300000000}]},"bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb":{"id":"bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb","name":"New Laptop","curAmount":1200,"goal":false,"goalAmount":2000,"transactions":[{"id":"b0000001-0001-4001-0001-000000000001","type":"withdrawal","amount":100,"date":1700000000000},{"id":"b0000002-0002-4002-0002-000000000002","type":"withdrawal","amount":50,"date":1700100000000},{"id":"b0000003-0003-4003-0003-000000000003","type":"deposit","amount":25,"date":1700200000000}]},"cccccccc-cccc-4ccc-cccc-cccccccccccc":{"id":"cccccccc-cccc-4ccc-cccc-cccccccccccc","name":"vacation fund","curAmount":750,"goal":true,"goalAmount":5000,"transactions":[{"id":"c0000001-0001-4001-0001-000000000001","type":"deposit","amount":250,"date":1700000000000},{"id":"c0000002-0002-4002-0002-000000000002","type":"deposit","amount":300,"date":1700100000000},{"id":"c0000003-0003-4003-0003-000000000003","type":"deposit","amount":200,"date":1700200000000}]}}}`;

// Expected values from the fake backup
// Note: curAmount is the authoritative balance that was tracked in the old app.
// When curAmount doesn't match the sum of transactions, an adjustment transaction
// is added to reconcile the difference.
// Goal is determined by goalAmount: if goalAmount !== null, goal is enabled.
const EXPECTED = {
  accounts: {
    emergencyFund: {
      name: "Emergency Fund",
      originalTransactionCount: 34,
      // +1 adjustment transaction (curAmount doesn't match sum)
      transactionCount: 35,
      // curAmount from backup - this is the actual balance
      balance: 5000,
      // goalAmount is 25000 (not null), so goal is enabled
      hasGoal: true,
      goalAmount: 25000,
    },
    newLaptop: {
      name: "New Laptop",
      originalTransactionCount: 3,
      // +1 adjustment transaction (curAmount doesn't match sum)
      transactionCount: 4,
      // curAmount from backup - this is the actual balance
      balance: 1200,
      // goalAmount is 2000 (not null), so goal is enabled
      hasGoal: true,
      goalAmount: 2000,
    },
    vacationFund: {
      name: "vacation fund",
      originalTransactionCount: 3,
      // No adjustment needed (curAmount matches sum of deposits)
      transactionCount: 3,
      // curAmount from backup: 750 (matches sum of deposits)
      balance: 750,
      // goalAmount is 5000 (not null), so goal is enabled
      hasGoal: true,
      goalAmount: 5000,
    },
  },
  totalAccounts: 3,
  // 35 + 4 + 3 = 42 (including 2 adjustment transactions)
  totalTransactions: 42,
  totalAmount: 6950,
};

describe("import", () => {
  describe("parseLegacyBackup", () => {
    it("should parse backup data", () => {
      const result = parseLegacyBackup(FAKE_BACKUP_JSON);

      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
    });

    it("should extract all accounts from backup", () => {
      const result = parseLegacyBackup(FAKE_BACKUP_JSON);
      const items =
        result.items instanceof Map
          ? Array.from(result.items.values())
          : Object.values(result.items);

      expect(items).toHaveLength(EXPECTED.totalAccounts);

      const accountNames = items.map((item) => item.name);
      expect(accountNames).toContain("Emergency Fund");
      expect(accountNames).toContain("New Laptop");
      expect(accountNames).toContain("vacation fund");
    });

    it("should preserve account goal settings", () => {
      const result = parseLegacyBackup(FAKE_BACKUP_JSON);
      const items =
        result.items instanceof Map
          ? Array.from(result.items.values())
          : Object.values(result.items);

      const emergencyFund = items.find(
        (item) => item.name === "Emergency Fund"
      );
      expect(emergencyFund?.goal).toBe(false);
      expect(emergencyFund?.goalAmount).toBe(25000);

      const vacationFund = items.find((item) => item.name === "vacation fund");
      expect(vacationFund?.goal).toBe(true);
      expect(vacationFund?.goalAmount).toBe(5000);
    });

    it("should preserve all transactions with correct types", () => {
      const result = parseLegacyBackup(FAKE_BACKUP_JSON);
      const items =
        result.items instanceof Map
          ? Array.from(result.items.values())
          : Object.values(result.items);

      const emergencyFund = items.find(
        (item) => item.name === "Emergency Fund"
      );
      expect(emergencyFund?.transactions).toHaveLength(
        EXPECTED.accounts.emergencyFund.originalTransactionCount
      );

      // Check first transaction
      const firstTxn = emergencyFund?.transactions[0];
      expect(firstTxn?.type).toBe("deposit");
      expect(firstTxn?.amount).toBe(500);
      expect(firstTxn?.date).toBeDefined();

      // Check that dates are properly converted from timestamps
      const dateValue = firstTxn?.date;
      if (dateValue instanceof Date) {
        expect(dateValue.getTime()).toBe(1700000000000);
      } else if (typeof dateValue === "number") {
        expect(dateValue).toBe(1700000000000);
      }
    });

    it("should throw error for invalid JSON", () => {
      expect(() => parseLegacyBackup("invalid json")).toThrow();
    });

    it("should throw error for empty object", () => {
      expect(() => parseLegacyBackup("{}")).toThrow();
    });
  });

  describe("getImportPreview", () => {
    let parsedData: LegacyBackupData;

    beforeEach(() => {
      parsedData = parseLegacyBackup(FAKE_BACKUP_JSON);
    });

    it("should return correct account count", () => {
      const preview = getImportPreview(parsedData);
      expect(preview.accountCount).toBe(EXPECTED.totalAccounts);
    });

    it("should return correct total transaction count", () => {
      const preview = getImportPreview(parsedData);
      expect(preview.transactionCount).toBe(EXPECTED.totalTransactions);
    });

    it("should return correct total amount across all accounts", () => {
      const preview = getImportPreview(parsedData);
      const totalAmount = preview.accounts.reduce(
        (sum, account) => sum + account.balance,
        0
      );
      expect(totalAmount).toBeCloseTo(EXPECTED.totalAmount, 2);
    });

    it("should return preview for each account", () => {
      const preview = getImportPreview(parsedData);
      expect(preview.accounts).toHaveLength(EXPECTED.totalAccounts);

      const emergencyFundPreview = preview.accounts.find(
        (a) => a.name === "Emergency Fund"
      );
      expect(emergencyFundPreview).toBeDefined();
      // goalAmount is not null, so hasGoal should be true
      expect(emergencyFundPreview?.hasGoal).toBe(
        EXPECTED.accounts.emergencyFund.hasGoal
      );
      expect(emergencyFundPreview?.goalAmount).toBe(
        EXPECTED.accounts.emergencyFund.goalAmount
      );

      const vacationPreview = preview.accounts.find(
        (a) => a.name === "vacation fund"
      );
      expect(vacationPreview).toBeDefined();
      expect(vacationPreview?.hasGoal).toBe(
        EXPECTED.accounts.vacationFund.hasGoal
      );
      expect(vacationPreview?.goalAmount).toBe(
        EXPECTED.accounts.vacationFund.goalAmount
      );
    });

    it("should use curAmount for vacation fund account balance", () => {
      const preview = getImportPreview(parsedData);
      const vacationPreview = preview.accounts.find(
        (a) => a.name === "vacation fund"
      );

      // Uses curAmount from backup: 750
      expect(vacationPreview?.balance).toBeCloseTo(
        EXPECTED.accounts.vacationFund.balance,
        2
      );
    });

    it("should use curAmount for new laptop account balance", () => {
      const preview = getImportPreview(parsedData);
      const laptopPreview = preview.accounts.find(
        (a) => a.name === "New Laptop"
      );

      // Uses curAmount from backup: 1200
      // (not the sum of transactions which would give a negative number)
      expect(laptopPreview?.balance).toBeCloseTo(
        EXPECTED.accounts.newLaptop.balance,
        2
      );
    });

    it("should use curAmount for emergency fund account balance", () => {
      const preview = getImportPreview(parsedData);
      const emergencyFundPreview = preview.accounts.find(
        (a) => a.name === "Emergency Fund"
      );

      // Uses curAmount from backup: 5000
      // This is the authoritative balance from the old app
      expect(emergencyFundPreview?.balance).toBeCloseTo(
        EXPECTED.accounts.emergencyFund.balance,
        2
      );
    });
  });

  describe("parseLegacyBackup - edge cases", () => {
    it("should handle backup with single account", () => {
      const singleAccountBackup = `{"json":{"abc123":{"id":"abc123","name":"Test","curAmount":100,"goal":false,"goalAmount":0,"transactions":[]}}}`;
      const result = parseLegacyBackup(singleAccountBackup);
      const items =
        result.items instanceof Map
          ? Array.from(result.items.values())
          : Object.values(result.items);

      expect(items).toHaveLength(1);
      expect(items[0].name).toBe("Test");
    });

    it("should handle account with no transactions", () => {
      const noTransactionsBackup = `{"json":{"abc123":{"id":"abc123","name":"Empty Account","curAmount":0,"goal":true,"goalAmount":5000,"transactions":[]}}}`;
      const result = parseLegacyBackup(noTransactionsBackup);
      const items =
        result.items instanceof Map
          ? Array.from(result.items.values())
          : Object.values(result.items);

      expect(items[0].transactions).toHaveLength(0);

      const preview = getImportPreview(result);
      expect(preview.transactionCount).toBe(0);
      expect(preview.accounts[0].balance).toBe(0);
    });

    it("should handle transaction dates as timestamps", () => {
      const timestampBackup = `{"json":{"abc123":{"id":"abc123","name":"Test","curAmount":100,"goal":false,"goalAmount":0,"transactions":[{"id":"txn1","type":"deposit","amount":100,"date":1700000000000}]}}}`;
      const result = parseLegacyBackup(timestampBackup);
      const items =
        result.items instanceof Map
          ? Array.from(result.items.values())
          : Object.values(result.items);

      const txn = items[0].transactions[0];
      // The date should be parseable as a timestamp
      const dateValue =
        txn.date instanceof Date ? txn.date.getTime() : txn.date;
      expect(dateValue).toBe(1700000000000);
    });

    it("should handle accounts without goalAmount field (no goal)", () => {
      const noGoalAmountBackup = `{"json":{"abc123":{"id":"abc123","name":"No Goal Amount","curAmount":100,"goal":false,"transactions":[]}}}`;
      const result = parseLegacyBackup(noGoalAmountBackup);
      const items = getItemsArray(result);

      expect(items[0].goalAmount).toBeUndefined();

      const preview = getImportPreview(result);
      expect(preview.accounts[0].goalAmount).toBeUndefined();
      // No goalAmount means no goal
      expect(preview.accounts[0].hasGoal).toBe(false);
    });

    it("should handle accounts with goalAmount: null (no goal)", () => {
      const nullGoalAmountBackup = `{"json":{"abc123":{"id":"abc123","name":"Null Goal Amount","curAmount":100,"goal":true,"goalAmount":null,"transactions":[]}}}`;
      const result = parseLegacyBackup(nullGoalAmountBackup);
      const items = getItemsArray(result);

      expect(items[0].goalAmount).toBeNull();

      const preview = getImportPreview(result);
      expect(preview.accounts[0].goalAmount).toBeNull();
      // null goalAmount means no goal
      expect(preview.accounts[0].hasGoal).toBe(false);
    });
  });

  describe("getItemsArray", () => {
    it("should convert Record to array", () => {
      const data: LegacyBackupData = {
        items: {
          id1: {
            id: "id1",
            name: "Account 1",
            curAmount: 100,
            goal: false,
            goalAmount: null,
            transactions: [],
          },
          id2: {
            id: "id2",
            name: "Account 2",
            curAmount: 200,
            goal: true,
            goalAmount: 500,
            transactions: [],
          },
        },
      };

      const items = getItemsArray(data);
      expect(items).toHaveLength(2);
      expect(items.map((i) => i.name).sort()).toEqual([
        "Account 1",
        "Account 2",
      ]);
    });

    it("should handle Map type", () => {
      const map = new Map();
      map.set("id1", {
        id: "id1",
        name: "Account 1",
        curAmount: 100,
        goal: false,
        goalAmount: null,
        transactions: [],
      });

      const data: LegacyBackupData = { items: map };
      const items = getItemsArray(data);

      expect(items).toHaveLength(1);
      expect(items[0].name).toBe("Account 1");
    });
  });

  describe("getTransactionTimestamp", () => {
    it("should return timestamp for Date object", () => {
      const date = new Date(1700000000000);
      expect(getTransactionTimestamp(date)).toBe(1700000000000);
    });

    it("should return number as-is for number timestamp", () => {
      expect(getTransactionTimestamp(1700000000000)).toBe(1700000000000);
    });
  });

  describe("calculateBalanceFromTransactions", () => {
    it("should sum deposits and subtract withdrawals", () => {
      const transactions = [
        { id: "1", type: "deposit" as const, amount: 100, date: 1000 },
        { id: "2", type: "withdrawal" as const, amount: 30, date: 2000 },
        { id: "3", type: "deposit" as const, amount: 50, date: 3000 },
      ];

      expect(calculateBalanceFromTransactions(transactions)).toBe(120); // 100 - 30 + 50
    });

    it("should return 0 for empty transactions", () => {
      expect(calculateBalanceFromTransactions([])).toBe(0);
    });

    it("should handle negative balance", () => {
      const transactions = [
        { id: "1", type: "deposit" as const, amount: 50, date: 1000 },
        { id: "2", type: "withdrawal" as const, amount: 100, date: 2000 },
      ];

      expect(calculateBalanceFromTransactions(transactions)).toBe(-50);
    });
  });

  describe("calculateAdjustmentAmount", () => {
    it("should return positive adjustment when curAmount > calculated balance", () => {
      const item = {
        id: "test",
        name: "Test",
        curAmount: 100,
        goal: false,
        goalAmount: null,
        transactions: [
          { id: "1", type: "deposit" as const, amount: 50, date: 1000 },
        ],
      };

      // curAmount (100) - calculated (50) = 50
      expect(calculateAdjustmentAmount(item)).toBe(50);
    });

    it("should return negative adjustment when curAmount < calculated balance", () => {
      const item = {
        id: "test",
        name: "Test",
        curAmount: 30,
        goal: false,
        goalAmount: null,
        transactions: [
          { id: "1", type: "deposit" as const, amount: 50, date: 1000 },
        ],
      };

      // curAmount (30) - calculated (50) = -20
      expect(calculateAdjustmentAmount(item)).toBe(-20);
    });

    it("should return 0 when curAmount matches calculated balance", () => {
      const item = {
        id: "test",
        name: "Test",
        curAmount: 50,
        goal: false,
        goalAmount: null,
        transactions: [
          { id: "1", type: "deposit" as const, amount: 50, date: 1000 },
        ],
      };

      expect(calculateAdjustmentAmount(item)).toBe(0);
    });

    it("should return 0 for tiny floating point differences", () => {
      const item = {
        id: "test",
        name: "Test",
        curAmount: 50.0001, // Very close to 50
        goal: false,
        goalAmount: null,
        transactions: [
          { id: "1", type: "deposit" as const, amount: 50, date: 1000 },
        ],
      };

      // Should treat as no adjustment needed
      expect(calculateAdjustmentAmount(item)).toBe(0);
    });

    it("should calculate correct adjustment for Emergency Fund account", () => {
      const parsedData = parseLegacyBackup(FAKE_BACKUP_JSON);
      const items = getItemsArray(parsedData);
      const emergencyFund = items.find((i) => i.name === "Emergency Fund")!;

      const adjustment = calculateAdjustmentAmount(emergencyFund);
      const calculatedBalance = calculateBalanceFromTransactions(
        emergencyFund.transactions
      );

      // adjustment + calculatedBalance should equal curAmount
      expect(calculatedBalance + adjustment).toBeCloseTo(
        emergencyFund.curAmount,
        2
      );
    });

    it("should calculate zero adjustment for vacation fund (already balanced)", () => {
      const parsedData = parseLegacyBackup(FAKE_BACKUP_JSON);
      const items = getItemsArray(parsedData);
      const vacation = items.find((i) => i.name === "vacation fund")!;

      // vacation fund curAmount should match sum of transactions
      expect(calculateAdjustmentAmount(vacation)).toBe(0);
    });
  });

  describe("convertLegacyItemForDb", () => {
    it("should convert item with goal enabled", () => {
      const item = {
        id: "test-id",
        name: "Test Account",
        curAmount: 100.25, // Matches sum of transactions (no adjustment needed)
        goal: true,
        goalAmount: 500.5,
        transactions: [
          {
            id: "txn1",
            type: "deposit" as const,
            amount: 100.25,
            date: 1700000000000,
          },
        ],
      };

      const result = convertLegacyItemForDb(item);

      expect(result.name).toBe("Test Account");
      expect(result.goalEnabled).toBe(true);
      expect(result.targetAmountCents).toBe(50050); // 500.5 * 100
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].amountCents).toBe(10025); // 100.25 * 100
      expect(result.transactions[0].type).toBe("deposit");
      expect(result.transactions[0].timestamp).toBe(1700000000000);
    });

    it("should set targetAmountCents to 0 when goalAmount is null", () => {
      const item = {
        id: "test-id",
        name: "No Goal Account",
        curAmount: 100,
        goal: false,
        goalAmount: null, // null means no goal
        transactions: [],
      };

      const result = convertLegacyItemForDb(item);

      expect(result.goalEnabled).toBe(false);
      expect(result.targetAmountCents).toBe(0);
    });

    it("should enable goal when goalAmount has a value (regardless of goal boolean)", () => {
      const item = {
        id: "test-id",
        name: "Has Goal Amount",
        curAmount: 100,
        goal: false, // goal boolean is false, but goalAmount is set
        goalAmount: 5000,
        transactions: [],
      };

      const result = convertLegacyItemForDb(item);

      // goalAmount !== null means goal is enabled
      expect(result.goalEnabled).toBe(true);
      expect(result.targetAmountCents).toBe(500000); // 5000 * 100
    });

    it("should handle Date objects in transactions", () => {
      const date = new Date(1700000000000);
      const item = {
        id: "test-id",
        name: "Test",
        curAmount: -50, // Matches sum of transactions (withdrawal of 50 from 0)
        goal: false,
        goalAmount: null,
        transactions: [
          {
            id: "txn1",
            type: "withdrawal" as const,
            amount: 50,
            date: date,
          },
        ],
      };

      const result = convertLegacyItemForDb(item);

      // No adjustment transaction since curAmount matches
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].timestamp).toBe(1700000000000);
      expect(result.transactions[0].type).toBe("withdrawal");
    });

    it("should correctly convert backup emergency fund account with adjustment", () => {
      const parsedData = parseLegacyBackup(FAKE_BACKUP_JSON);
      const items = getItemsArray(parsedData);
      const emergencyFund = items.find((i) => i.name === "Emergency Fund")!;

      const result = convertLegacyItemForDb(emergencyFund);

      expect(result.name).toBe("Emergency Fund");
      // goalAmount is 25000 (not null), so goal is enabled
      expect(result.goalEnabled).toBe(EXPECTED.accounts.emergencyFund.hasGoal);
      expect(result.targetAmountCents).toBe(
        EXPECTED.accounts.emergencyFund.goalAmount * 100
      );
      // 34 original + 1 adjustment transaction
      expect(result.transactions).toHaveLength(
        EXPECTED.accounts.emergencyFund.transactionCount
      );

      // First transaction should be the adjustment deposit
      expect(result.transactions[0].type).toBe("deposit");

      // Second transaction should be the original first transaction
      expect(result.transactions[1].amountCents).toBe(50000); // 500 * 100
      expect(result.transactions[1].type).toBe("deposit");
    });

    it("should correctly convert backup vacation fund account (no adjustment needed)", () => {
      const parsedData = parseLegacyBackup(FAKE_BACKUP_JSON);
      const items = getItemsArray(parsedData);
      const vacation = items.find((i) => i.name === "vacation fund")!;

      const result = convertLegacyItemForDb(vacation);

      expect(result.name).toBe("vacation fund");
      expect(result.goalEnabled).toBe(true);
      expect(result.targetAmountCents).toBe(500000); // 5000 * 100
      // No adjustment needed since curAmount matches sum of transactions
      expect(result.transactions).toHaveLength(
        EXPECTED.accounts.vacationFund.transactionCount
      );

      // All should be deposits (no adjustment transaction)
      result.transactions.forEach((txn) => {
        expect(txn.type).toBe("deposit");
      });
    });
  });

  describe("backup data integrity", () => {
    it("should preserve exact transaction amounts without floating point errors", () => {
      const parsedData = parseLegacyBackup(FAKE_BACKUP_JSON);
      const items = getItemsArray(parsedData);
      const vacation = items.find((i) => i.name === "vacation fund")!;

      const amounts = vacation.transactions.map((t) => t.amount);
      expect(amounts).toEqual([250, 300, 200]);
    });

    it("should correctly identify all transaction types", () => {
      const parsedData = parseLegacyBackup(FAKE_BACKUP_JSON);
      const items = getItemsArray(parsedData);

      for (const item of items) {
        for (const txn of item.transactions) {
          expect(["deposit", "withdrawal"]).toContain(txn.type);
        }
      }
    });

    it("should have valid timestamps for all transactions", () => {
      const parsedData = parseLegacyBackup(FAKE_BACKUP_JSON);
      const items = getItemsArray(parsedData);

      for (const item of items) {
        for (const txn of item.transactions) {
          const timestamp = getTransactionTimestamp(txn.date);
          expect(timestamp).toBeGreaterThan(0);
          // Should be a reasonable date (after year 2000)
          expect(timestamp).toBeGreaterThan(946684800000);
        }
      }
    });
  });
});
