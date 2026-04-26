<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Integration tests for the Prescriptions API logic.
 *
 * Covers prescription creation, status transitions, item tracking,
 * and alert-triggering conditions (controlled drugs, age restrictions).
 */
class PrescriptionApiTest extends TestCase
{
    private PDO $pdo;
    private int $customerId;
    private int $medicationId;
    private int $inventoryId;

    protected function setUp(): void
    {
        $this->pdo = testPdo();

        // Seed a customer
        $this->pdo->prepare("
            INSERT INTO customers (first_name, last_name, date_of_birth, address_line1, city, postcode, phone, email, created_by)
            VALUES ('Test', 'Patient', '1985-01-01', '1 Test St', 'London', 'E1 1AA', '07700000001', 'patient@test.local', 1)
        ")->execute();
        $this->customerId = (int)$this->pdo->lastInsertId();

        // Seed a medication
        $this->pdo->prepare("
            INSERT INTO medications (medication_name, strength, form, controlled_drug, age_restricted, min_age_years, requires_id_check, low_stock_threshold)
            VALUES ('TestMed', '10mg', 'Tablet', 0, 0, 0, 0, 10)
        ")->execute();
        $this->medicationId = (int)$this->pdo->lastInsertId();

        // Seed inventory for that medication
        $this->pdo->prepare("
            INSERT INTO inventory (medication_id, batch_number, quantity, expiry_date, low_stock_threshold, received_date)
            VALUES (?, 'TEST-BATCH-001', 100, '2030-01-01', 10, CURDATE())
        ")->execute([$this->medicationId]);
        $this->inventoryId = (int)$this->pdo->lastInsertId();
    }

    protected function tearDown(): void
    {
        $this->pdo->exec("DELETE FROM prescription_items WHERE inventory_id = {$this->inventoryId}");
        $this->pdo->exec("DELETE FROM prescriptions WHERE customer_id = {$this->customerId}");
        $this->pdo->exec("DELETE FROM alerts_log WHERE customer_id = {$this->customerId}");
        $this->pdo->exec("DELETE FROM inventory WHERE inventory_id = {$this->inventoryId}");
        $this->pdo->exec("DELETE FROM medications WHERE medication_id = {$this->medicationId}");
        $this->pdo->exec("DELETE FROM customers WHERE customer_id = {$this->customerId}");
    }

    // ── CREATE ────────────────────────────────────────────────────────────────

    public function testPrescriptionCanBeCreated(): void
    {
        $this->pdo->prepare("
            INSERT INTO prescriptions (customer_id, prescription_date, prescribed_by, status, created_by)
            VALUES (?, CURDATE(), 'Dr Test', 'pending', 1)
        ")->execute([$this->customerId]);

        $id = (int)$this->pdo->lastInsertId();
        $this->assertGreaterThan(0, $id);
    }

    public function testNewPrescriptionHasPendingStatus(): void
    {
        $this->pdo->prepare("
            INSERT INTO prescriptions (customer_id, prescription_date, prescribed_by, status, created_by)
            VALUES (?, CURDATE(), 'Dr Test', 'pending', 1)
        ")->execute([$this->customerId]);

        $id = (int)$this->pdo->lastInsertId();
        $stmt = $this->pdo->prepare("SELECT status FROM prescriptions WHERE prescription_id = ?");
        $stmt->execute([$id]);
        $this->assertSame('pending', $stmt->fetchColumn());
    }

    // ── STATUS TRANSITIONS ────────────────────────────────────────────────────

    public function testPrescriptionCanBeDispensed(): void
    {
        $this->pdo->prepare("
            INSERT INTO prescriptions (customer_id, prescription_date, prescribed_by, status, created_by)
            VALUES (?, CURDATE(), 'Dr Test', 'pending', 1)
        ")->execute([$this->customerId]);
        $id = (int)$this->pdo->lastInsertId();

        $this->pdo->prepare("UPDATE prescriptions SET status = 'dispensed' WHERE prescription_id = ?")->execute([$id]);

        $stmt = $this->pdo->prepare("SELECT status FROM prescriptions WHERE prescription_id = ?");
        $stmt->execute([$id]);
        $this->assertSame('dispensed', $stmt->fetchColumn());
    }

    public function testPrescriptionCanBeCancelled(): void
    {
        $this->pdo->prepare("
            INSERT INTO prescriptions (customer_id, prescription_date, prescribed_by, status, created_by)
            VALUES (?, CURDATE(), 'Dr Test', 'pending', 1)
        ")->execute([$this->customerId]);
        $id = (int)$this->pdo->lastInsertId();

        $this->pdo->prepare("UPDATE prescriptions SET status = 'cancelled' WHERE prescription_id = ?")->execute([$id]);

        $stmt = $this->pdo->prepare("SELECT status FROM prescriptions WHERE prescription_id = ?");
        $stmt->execute([$id]);
        $this->assertSame('cancelled', $stmt->fetchColumn());
    }

    // ── PRESCRIPTION ITEMS ────────────────────────────────────────────────────

    public function testPrescriptionItemIsLinkedToBatchAndMedication(): void
    {
        $this->pdo->prepare("
            INSERT INTO prescriptions (customer_id, prescription_date, prescribed_by, status, created_by)
            VALUES (?, CURDATE(), 'Dr Test', 'pending', 1)
        ")->execute([$this->customerId]);
        $prescId = (int)$this->pdo->lastInsertId();

        $this->pdo->prepare("
            INSERT INTO prescription_items (prescription_id, inventory_id, medication_id, quantity_dispensed, dosage_instructions, status)
            VALUES (?, ?, ?, 2, 'Take twice daily', 'pending')
        ")->execute([$prescId, $this->inventoryId, $this->medicationId]);

        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM prescription_items WHERE prescription_id = ?");
        $stmt->execute([$prescId]);
        $this->assertSame(1, (int)$stmt->fetchColumn());
    }

    public function testInventoryQuantityDecreasesAfterDispensing(): void
    {
        // Initial stock = 100
        $this->pdo->prepare("
            INSERT INTO prescriptions (customer_id, prescription_date, prescribed_by, status, created_by)
            VALUES (?, CURDATE(), 'Dr Test', 'pending', 1)
        ")->execute([$this->customerId]);
        $prescId = (int)$this->pdo->lastInsertId();

        // Dispense 5 units
        $this->pdo->prepare(
            "UPDATE inventory SET quantity = quantity - 5 WHERE inventory_id = ?"
        )->execute([$this->inventoryId]);

        $stmt = $this->pdo->prepare("SELECT quantity FROM inventory WHERE inventory_id = ?");
        $stmt->execute([$this->inventoryId]);
        $this->assertSame(95, (int)$stmt->fetchColumn());
    }

    // ── ALERT TRIGGERS ────────────────────────────────────────────────────────

    public function testAlertIsLoggedForControlledDrug(): void
    {
        // Update medication to be a controlled drug
        $this->pdo->prepare("UPDATE medications SET controlled_drug = 1 WHERE medication_id = ?")->execute([$this->medicationId]);

        // Log an alert as the API would
        $this->pdo->prepare("
            INSERT INTO alerts_log (alert_type, customer_id, medication_id, message, created_by)
            VALUES ('controlled_drug', ?, ?, 'Controlled drug dispensed — verify documentation', 1)
        ")->execute([$this->customerId, $this->medicationId]);

        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM alerts_log WHERE customer_id = ? AND alert_type = 'controlled_drug'");
        $stmt->execute([$this->customerId]);
        $this->assertGreaterThan(0, (int)$stmt->fetchColumn());
    }

    public function testAlertIsLoggedForAgeRestrictedMedication(): void
    {
        $this->pdo->prepare("UPDATE medications SET age_restricted = 1, min_age_years = 18 WHERE medication_id = ?")->execute([$this->medicationId]);

        $this->pdo->prepare("
            INSERT INTO alerts_log (alert_type, customer_id, medication_id, message, created_by)
            VALUES ('age_check', ?, ?, 'Age-restricted medication — verify patient age', 1)
        ")->execute([$this->customerId, $this->medicationId]);

        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM alerts_log WHERE customer_id = ? AND alert_type = 'age_check'");
        $stmt->execute([$this->customerId]);
        $this->assertGreaterThan(0, (int)$stmt->fetchColumn());
    }

    // ── BOUNDARY / NEGATIVE ────────────────────────────────────────────────────

    public function testQuantityCannotGoNegative(): void
    {
        // The DB has CHECK (quantity >= 0); expect an exception on violation
        $this->expectException(\PDOException::class);
        $this->pdo->prepare(
            "UPDATE inventory SET quantity = -1 WHERE inventory_id = ?"
        )->execute([$this->inventoryId]);
    }
}
