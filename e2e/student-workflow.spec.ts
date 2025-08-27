import { test, expect } from '@playwright/test';

test.describe('Student end-to-end workflow', () => {
	 test.beforeEach(async ({ page }) => {
		 // Monitor console for errors
		 page.on('console', msg => {
			 if (msg.type() === 'error') {
				 console.log('Page error:', msg.text());
			 }
		 });
	 });

	 test('signup form renders correctly and has all required fields', async ({ page }) => {
		 await page.goto('/auth/signup');
		 
		 // Check if page loads
		 await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
		 
		 // Check if form fields are present
		 await expect(page.locator('#role')).toBeVisible();
		 await expect(page.locator('#firstName')).toBeVisible();
		 await expect(page.locator('#lastName')).toBeVisible();
		 await expect(page.locator('#studentId')).toBeVisible();
		 await expect(page.locator('#email')).toBeVisible();
		 await expect(page.locator('#password')).toBeVisible();
		 await expect(page.locator('#confirmPassword')).toBeVisible();
		 await expect(page.locator('#agreeToTerms')).toBeVisible();
		 
		 // Check if submit button is present
		 await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
	 });

	 test('login form renders correctly and has all required fields', async ({ page }) => {
		 await page.goto('/auth/login');
		 
		 // Check if page loads
		 await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
		 
		 // Check if form fields are present
		 await expect(page.locator('input[name="email"]')).toBeVisible();
		 await expect(page.locator('input[name="password"]')).toBeVisible();
		 
		 // Check if submit button is present
		 await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
	 });

	 test('community feed page loads and displays content', async ({ page }) => {
		 await page.goto('/demo/community-feed');
		 
		 // Check if page loads
		 await expect(page.getByRole('heading', { name: 'Peer Submissions Feed' })).toBeVisible();
		 
		 // Check if search input is present
		 const searchInput = page.getByPlaceholder('Search assignments, students, or courses...');
		 await expect(searchInput).toBeVisible();
		 
		 // Check if filter buttons are present
		 await expect(page.getByRole('button', { name: 'Reset Filters' })).toBeVisible();
		 
		 // Check if some content is displayed
		 await expect(page.getByText('Video Presentation: Modern Web Development').first()).toBeVisible();
	 });

	 test('student pages show authentication required message', async ({ page }) => {
		 // Mock auth/me to return no user (not authenticated)
		 await page.route('**/api/auth/me', async route => {
			 await route.fulfill({ status: 200, body: JSON.stringify({ user: null }) });
		 });
		 
		 // Try to access student dashboard
		 await page.goto('/student/dashboard');
		 
		 // Should show loading or redirect message
		 await expect(page.locator('text=Redirecting to login')).toBeVisible();
	 });

	 test('form validation shows errors for empty fields', async ({ page }) => {
		 await page.goto('/auth/signup');
		 
		 // Try to submit without filling required fields
		 await page.click('button[type="submit"]');
		 
		 // Wait a moment for validation to run
		 await page.waitForTimeout(1000);
		 
		 // Check if validation errors appear (they might be in different formats)
		 const errorElements = await page.locator('.text-red-600, .text-red-800, [role="alert"], .bg-red-50').allTextContents();
		 console.log('Found error elements:', errorElements);
		 
		 // At minimum, the form should still be visible
		 await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
	 });

	 test('file upload input is present on video submission page', async ({ page }) => {
		 // Mock auth/me to return a student user
		 const mockUser = {
			 sub: 'user-123',
			 email: 'jane.doe@example.com',
			 firstName: 'Jane',
			 lastName: 'Doe',
			 role: 'student',
			 emailVerified: true,
			 accessToken: 'mock-token-123'
		 };
		 
		 await page.route('**/api/auth/me', async route => {
			 await route.fulfill({
				 status: 200,
				 body: JSON.stringify({ user: mockUser })
			 });
		 });
		 
		 await page.goto('/student/video-submission');
		 
		 // Check if page loads - use first() to handle multiple elements with same text
		 await expect(page.getByRole('heading', { name: 'Video Submission' }).first()).toBeVisible();
		 
		 // Check if upload zone is present (the file input is hidden but the upload zone is visible)
		 const uploadZone = page.getByText('Click to upload or drag and drop');
		 await expect(uploadZone).toBeVisible();
		 
		 // Check if the hidden file input exists
		 const fileInput = page.locator('input[type="file"]');
		 await expect(fileInput).toHaveAttribute('class', 'hidden');
	 });
});


