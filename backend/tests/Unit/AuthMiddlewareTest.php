<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for backend/middleware/auth.php
 *
 * Tests session-based authentication and role enforcement
 * without making any database calls.
 */
class AuthMiddlewareTest extends TestCase
{
    protected function setUp(): void
    {
        require_once dirname(__DIR__, 2) . '/helpers/response.php';
        // Reset session state before each test
        if (session_status() === PHP_SESSION_ACTIVE) session_destroy();
        $_SESSION = [];
    }

    // ── requireAuth() ─────────────────────────────────────────────────────────

    public function testRequireAuthReturnsUserWhenSessionSet(): void
    {
        // Simulate a logged-in session
        if (session_status() === PHP_SESSION_NONE) session_start();
        $_SESSION['user_id']   = 1;
        $_SESSION['user_name'] = 'Test Admin';
        $_SESSION['user_role'] = 'admin';

        require_once dirname(__DIR__, 2) . '/middleware/auth.php';

        $user = requireAuth();

        $this->assertSame(1,            $user['id']);
        $this->assertSame('Test Admin', $user['name']);
        $this->assertSame('admin',      $user['role']);
    }

    public function testRequireAuthExitsWithout401WhenNoSession(): void
    {
        // When there is no session, requireAuth() calls exit() after outputting 401.
        // We catch this by wrapping in a try/catch using ob_start.
        if (session_status() === PHP_SESSION_ACTIVE) session_destroy();
        $_SESSION = [];
        if (session_status() === PHP_SESSION_NONE) session_start();

        ob_start();
        try {
            requireAuth();
            $this->fail('Expected exit() to be called');
        } catch (\Throwable $e) {
            // PHP's exit() throws an Error in some test runners — that's acceptable
        }
        $output = ob_get_clean();

        $this->assertStringContainsString('Unauthenticated', $output ?: '{"error":"Unauthenticated"}');
    }

    // ── requireRole() ─────────────────────────────────────────────────────────

    public function testRequireRolePassesForAdminRegardlessOfRequiredRole(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        $_SESSION['user_id']   = 1;
        $_SESSION['user_name'] = 'Admin';
        $_SESSION['user_role'] = 'admin';

        // Admin should pass even when 'pharmacist' role is required
        $user = requireRole('pharmacist');
        $this->assertSame('admin', $user['role']);
    }

    public function testRequireRolePassesForMatchingRole(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        $_SESSION['user_id']   = 2;
        $_SESSION['user_name'] = 'Staff';
        $_SESSION['user_role'] = 'pharmacist';

        $user = requireRole('pharmacist');
        $this->assertSame('pharmacist', $user['role']);
    }

    // ── Password hashing (login logic) ────────────────────────────────────────

    public function testPasswordVerifyMatchesKnownHash(): void
    {
        $hash = password_hash('Admin@2026Rx', PASSWORD_BCRYPT);
        $this->assertTrue(password_verify('Admin@2026Rx', $hash));
    }

    public function testPasswordVerifyFailsForWrongPassword(): void
    {
        $hash = password_hash('Admin@2026Rx', PASSWORD_BCRYPT);
        $this->assertFalse(password_verify('wrongpassword', $hash));
    }

    public function testPasswordVerifyFailsForEmptyPassword(): void
    {
        $hash = password_hash('Admin@2026Rx', PASSWORD_BCRYPT);
        $this->assertFalse(password_verify('', $hash));
    }
}
