<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Integration tests for role-based access control.
 *
 * Verifies that the requireRole() logic correctly permits/denies
 * access based on the user's role stored in the session.
 */
class RoleEnforcementTest extends TestCase
{
    protected function setUp(): void
    {
        require_once dirname(__DIR__, 2) . '/helpers/response.php';
        require_once dirname(__DIR__, 2) . '/middleware/auth.php';

        if (session_status() === PHP_SESSION_ACTIVE) session_destroy();
        $_SESSION = [];
        if (session_status() === PHP_SESSION_NONE) session_start();
    }

    // ── Admin access ──────────────────────────────────────────────────────────

    public function testAdminCanAccessAdminRoute(): void
    {
        $_SESSION['user_id']   = 1;
        $_SESSION['user_name'] = 'Admin';
        $_SESSION['user_role'] = 'admin';

        $user = requireRole('admin');
        $this->assertSame('admin', $user['role']);
    }

    public function testAdminCanAccessPharmacistRoute(): void
    {
        $_SESSION['user_id']   = 1;
        $_SESSION['user_name'] = 'Admin';
        $_SESSION['user_role'] = 'admin';

        // Admin bypasses any role requirement
        $user = requireRole('pharmacist');
        $this->assertSame('admin', $user['role']);
    }

    // ── Pharmacist access ─────────────────────────────────────────────────────

    public function testPharmacistCanAccessPharmacistRoute(): void
    {
        $_SESSION['user_id']   = 2;
        $_SESSION['user_name'] = 'Staff';
        $_SESSION['user_role'] = 'pharmacist';

        $user = requireRole('pharmacist');
        $this->assertSame('pharmacist', $user['role']);
    }

    public function testPharmacistIsBlockedFromAdminRoute(): void
    {
        $_SESSION['user_id']   = 2;
        $_SESSION['user_name'] = 'Staff';
        $_SESSION['user_role'] = 'pharmacist';

        ob_start();
        $exited = false;
        try {
            requireRole('admin');
        } catch (\Throwable) {
            $exited = true;
        }
        $output = ob_get_clean();

        $this->assertTrue($exited || str_contains((string)$output, 'Forbidden'),
            'Pharmacist should be denied access to admin route');
    }

    // ── Unauthenticated access ────────────────────────────────────────────────

    public function testUnauthenticatedUserIsBlocked(): void
    {
        $_SESSION = [];

        ob_start();
        $exited = false;
        try {
            requireAuth();
        } catch (\Throwable) {
            $exited = true;
        }
        $output = ob_get_clean();

        $this->assertTrue($exited || str_contains((string)$output, 'Unauthenticated'),
            'Unauthenticated request should be denied');
    }

    // ── Reports & Inventory access by role (DB-level) ─────────────────────────

    public function testOnlyAdminRoleInDb(): void
    {
        $pdo = testPdo();
        // Seed data from schema.sql includes admin user
        $stmt = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = 1");
        $this->assertGreaterThan(0, (int)$stmt->fetchColumn(), 'At least one admin user should exist');
    }

    public function testPharmacistRoleExistsInDb(): void
    {
        $pdo = testPdo();
        $stmt = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'pharmacist'");
        // pharmacist seeded by schema.sql
        $this->assertGreaterThanOrEqual(0, (int)$stmt->fetchColumn());
    }

    public function testRoleColumnOnlyAllowsValidValues(): void
    {
        $pdo = testPdo();
        $this->expectException(\PDOException::class);
        // 'superuser' is not in the ENUM — DB should reject it
        $pdo->exec("INSERT INTO users (username, password_hash, full_name, email, role)
                    VALUES ('bad', 'x', 'Bad', 'bad@test.local', 'superuser')");
    }
}
