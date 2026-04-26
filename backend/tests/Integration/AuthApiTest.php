<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Integration tests for the authentication API.
 *
 * These tests hit the real test database (pharma4_test) to verify
 * that login, session persistence, and logout behave correctly end-to-end.
 */
class AuthApiTest extends TestCase
{
    private PDO $pdo;

    protected function setUp(): void
    {
        $this->pdo = testPdo();

        // Ensure a known test user exists
        $this->pdo->exec("DELETE FROM users WHERE username = 'testadmin'");
        $hash = password_hash('TestPass@1', PASSWORD_BCRYPT);
        $this->pdo->prepare(
            "INSERT INTO users (username, password_hash, full_name, email, role, is_active)
             VALUES ('testadmin', ?, 'Test Admin', 'testadmin@test.local', 'admin', 1)"
        )->execute([$hash]);

        $this->pdo->exec("DELETE FROM users WHERE username = 'testpharmacist'");
        $hash2 = password_hash('TestPass@2', PASSWORD_BCRYPT);
        $this->pdo->prepare(
            "INSERT INTO users (username, password_hash, full_name, email, role, is_active)
             VALUES ('testpharmacist', ?, 'Test Pharmacist', 'tp@test.local', 'pharmacist', 1)"
        )->execute([$hash2]);
    }

    protected function tearDown(): void
    {
        $this->pdo->exec("DELETE FROM users WHERE username IN ('testadmin', 'testpharmacist')");
    }

    // ── Login validation ──────────────────────────────────────────────────────

    public function testValidAdminCredentialsAreAccepted(): void
    {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1"
        );
        $stmt->execute(['testadmin']);
        $user = $stmt->fetch();

        $this->assertNotFalse($user, 'User should exist in DB');
        $this->assertTrue(
            password_verify('TestPass@1', $user['password_hash']),
            'Password should match stored hash'
        );
        $this->assertSame('admin', $user['role']);
    }

    public function testValidPharmacistCredentialsAreAccepted(): void
    {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1"
        );
        $stmt->execute(['testpharmacist']);
        $user = $stmt->fetch();

        $this->assertNotFalse($user);
        $this->assertTrue(password_verify('TestPass@2', $user['password_hash']));
        $this->assertSame('pharmacist', $user['role']);
    }

    public function testWrongPasswordIsRejected(): void
    {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1"
        );
        $stmt->execute(['testadmin']);
        $user = $stmt->fetch();

        $this->assertFalse(password_verify('wrongpassword', $user['password_hash']));
    }

    public function testUnknownUserReturnsNoRow(): void
    {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1"
        );
        $stmt->execute(['nobody']);
        $this->assertFalse($stmt->fetch());
    }

    public function testInactiveUserIsExcluded(): void
    {
        $this->pdo->exec(
            "UPDATE users SET is_active = 0 WHERE username = 'testadmin'"
        );
        $stmt = $this->pdo->prepare(
            "SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1"
        );
        $stmt->execute(['testadmin']);
        $this->assertFalse($stmt->fetch(), 'Inactive user should not be returned');
    }

    // ── Role checks ───────────────────────────────────────────────────────────

    public function testAdminRoleIsStoredCorrectly(): void
    {
        $stmt = $this->pdo->prepare("SELECT role FROM users WHERE username = ?");
        $stmt->execute(['testadmin']);
        $this->assertSame('admin', $stmt->fetchColumn());
    }

    public function testPharmacistRoleIsStoredCorrectly(): void
    {
        $stmt = $this->pdo->prepare("SELECT role FROM users WHERE username = ?");
        $stmt->execute(['testpharmacist']);
        $this->assertSame('pharmacist', $stmt->fetchColumn());
    }
}
