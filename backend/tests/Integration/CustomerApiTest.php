<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Integration tests for the Customers API logic.
 *
 * Tests the database operations that back /api/customers —
 * create, read, update, soft-delete, search, and validation.
 */
class CustomerApiTest extends TestCase
{
    private PDO $pdo;

    protected function setUp(): void
    {
        $this->pdo = testPdo();
        // Clean test customers before each test
        $this->pdo->exec("DELETE FROM customers WHERE email LIKE '%@test.local'");
    }

    protected function tearDown(): void
    {
        $this->pdo->exec("DELETE FROM customers WHERE email LIKE '%@test.local'");
    }

    private function insertCustomer(array $overrides = []): int
    {
        $defaults = [
            'first_name'    => 'Jane',
            'last_name'     => 'Doe',
            'date_of_birth' => '1990-05-15',
            'address_line1' => '10 Test Lane',
            'city'          => 'London',
            'postcode'      => 'SW1A 1AA',
            'phone'         => '07700900000',
            'email'         => 'jane.doe@test.local',
            'nhs_number'    => null,
            'allergies'     => null,
            'drug_allergies'=> null,
            'medical_conditions' => null,
            'created_by'    => 1,
        ];
        $data = array_merge($defaults, $overrides);

        $this->pdo->prepare("
            INSERT INTO customers
                (first_name, last_name, date_of_birth, address_line1, city, postcode,
                 phone, email, nhs_number, allergies, drug_allergies, medical_conditions, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ")->execute(array_values($data));

        return (int)$this->pdo->lastInsertId();
    }

    // ── CREATE ────────────────────────────────────────────────────────────────

    public function testCustomerCanBeCreated(): void
    {
        $id = $this->insertCustomer();
        $this->assertGreaterThan(0, $id);
    }

    public function testCreatedCustomerIsActiveByDefault(): void
    {
        $id = $this->insertCustomer();
        $stmt = $this->pdo->prepare("SELECT is_active FROM customers WHERE customer_id = ?");
        $stmt->execute([$id]);
        $this->assertSame(1, (int)$stmt->fetchColumn());
    }

    public function testCreatedCustomerDataIsStoredCorrectly(): void
    {
        $id = $this->insertCustomer(['first_name' => 'Alice', 'last_name' => 'Smith', 'email' => 'alice@test.local']);
        $stmt = $this->pdo->prepare("SELECT first_name, last_name FROM customers WHERE customer_id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        $this->assertSame('Alice', $row['first_name']);
        $this->assertSame('Smith', $row['last_name']);
    }

    public function testAllergiesAreStoredAsText(): void
    {
        $allergies = 'Peanuts, Milk';
        $id = $this->insertCustomer(['allergies' => $allergies, 'email' => 'allergy@test.local']);
        $stmt = $this->pdo->prepare("SELECT allergies FROM customers WHERE customer_id = ?");
        $stmt->execute([$id]);
        $this->assertSame($allergies, $stmt->fetchColumn());
    }

    public function testDrugAllergiesAreStoredAsText(): void
    {
        $drugAllergies = 'Penicillin / Amoxicillin, Aspirin';
        $id = $this->insertCustomer(['drug_allergies' => $drugAllergies, 'email' => 'drugallergy@test.local']);
        $stmt = $this->pdo->prepare("SELECT drug_allergies FROM customers WHERE customer_id = ?");
        $stmt->execute([$id]);
        $this->assertSame($drugAllergies, $stmt->fetchColumn());
    }

    public function testMedicalConditionsAreStoredAsText(): void
    {
        $conditions = 'Asthma, Hypertension (high blood pressure)';
        $id = $this->insertCustomer(['medical_conditions' => $conditions, 'email' => 'conditions@test.local']);
        $stmt = $this->pdo->prepare("SELECT medical_conditions FROM customers WHERE customer_id = ?");
        $stmt->execute([$id]);
        $this->assertSame($conditions, $stmt->fetchColumn());
    }

    // ── READ ──────────────────────────────────────────────────────────────────

    public function testCustomerCanBeRetrievedById(): void
    {
        $id = $this->insertCustomer();
        $stmt = $this->pdo->prepare("SELECT * FROM customers WHERE customer_id = ? AND is_active = 1");
        $stmt->execute([$id]);
        $this->assertNotFalse($stmt->fetch());
    }

    public function testInactiveCustomerIsHiddenFromList(): void
    {
        $id = $this->insertCustomer();
        $this->pdo->exec("UPDATE customers SET is_active = 0 WHERE customer_id = $id");

        $stmt = $this->pdo->prepare("SELECT * FROM customers WHERE customer_id = ? AND is_active = 1");
        $stmt->execute([$id]);
        $this->assertFalse($stmt->fetch());
    }

    public function testSearchByLastNameReturnsCorrectCustomer(): void
    {
        $this->insertCustomer(['last_name' => 'Unique', 'email' => 'unique@test.local']);

        $term = '%Unique%';
        $stmt = $this->pdo->prepare(
            "SELECT * FROM customers WHERE is_active = 1 AND last_name LIKE ?"
        );
        $stmt->execute([$term]);
        $results = $stmt->fetchAll();
        $this->assertCount(1, $results);
        $this->assertSame('Unique', $results[0]['last_name']);
    }

    public function testAgeIsCalculatedFromDob(): void
    {
        // Born exactly 30 years ago today
        $dob = date('Y-m-d', strtotime('-30 years'));
        $id = $this->insertCustomer(['date_of_birth' => $dob, 'email' => 'age@test.local']);

        $stmt = $this->pdo->prepare(
            "SELECT TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) AS age FROM customers WHERE customer_id = ?"
        );
        $stmt->execute([$id]);
        $this->assertSame(30, (int)$stmt->fetchColumn());
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    public function testCustomerDetailsCanBeUpdated(): void
    {
        $id = $this->insertCustomer();
        $this->pdo->prepare(
            "UPDATE customers SET phone = ?, updated_at = NOW() WHERE customer_id = ?"
        )->execute(['07999000001', $id]);

        $stmt = $this->pdo->prepare("SELECT phone FROM customers WHERE customer_id = ?");
        $stmt->execute([$id]);
        $this->assertSame('07999000001', $stmt->fetchColumn());
    }

    // ── SOFT DELETE ───────────────────────────────────────────────────────────

    public function testSoftDeleteSetsIsActiveToZero(): void
    {
        $id = $this->insertCustomer();
        $this->pdo->prepare("UPDATE customers SET is_active = 0 WHERE customer_id = ?")->execute([$id]);

        $stmt = $this->pdo->prepare("SELECT is_active FROM customers WHERE customer_id = ?");
        $stmt->execute([$id]);
        $this->assertSame(0, (int)$stmt->fetchColumn());
    }

    public function testSoftDeletedCustomerDoesNotAppearInActiveList(): void
    {
        $id = $this->insertCustomer(['email' => 'deleted@test.local']);
        $this->pdo->exec("UPDATE customers SET is_active = 0 WHERE customer_id = $id");

        $stmt = $this->pdo->query("SELECT COUNT(*) FROM customers WHERE email = 'deleted@test.local' AND is_active = 1");
        $this->assertSame(0, (int)$stmt->fetchColumn());
    }
}
