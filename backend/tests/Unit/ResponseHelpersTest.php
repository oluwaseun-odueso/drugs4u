<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for backend/helpers/response.php
 *
 * These tests cover the pure helper functions in isolation,
 * without touching the database or HTTP layer.
 */
class ResponseHelpersTest extends TestCase
{
    protected function setUp(): void
    {
        require_once dirname(__DIR__, 2) . '/helpers/response.php';
    }

    // ── getBody() ─────────────────────────────────────────────────────────────

    public function testGetBodyReturnsEmptyArrayForNoInput(): void
    {
        // php://input is empty in CLI; getBody() should return []
        $result = getBody();
        $this->assertIsArray($result);
        $this->assertEmpty($result);
    }

    // ── intParam() ────────────────────────────────────────────────────────────

    public function testIntParamReturnsIntForNumericQueryParam(): void
    {
        $_GET['id'] = '42';
        $this->assertSame(42, intParam('id'));
    }

    public function testIntParamReturnsNullForMissingKey(): void
    {
        unset($_GET['missing']);
        $this->assertNull(intParam('missing'));
    }

    public function testIntParamReturnsNullForNonNumericValue(): void
    {
        $_GET['id'] = 'abc';
        $this->assertNull(intParam('id'));
    }

    public function testIntParamReturnsNullForNegativeValue(): void
    {
        // Negative numbers contain '-', so ctype_digit returns false
        $_GET['id'] = '-5';
        $this->assertNull(intParam('id'));
    }

    public function testIntParamReturnsNullForFloatString(): void
    {
        $_GET['id'] = '3.14';
        $this->assertNull(intParam('id'));
    }

    public function testIntParamReturnsZeroForZero(): void
    {
        $_GET['id'] = '0';
        $this->assertSame(0, intParam('id'));
    }
}
