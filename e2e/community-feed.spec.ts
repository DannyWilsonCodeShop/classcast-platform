import { test, expect } from '@playwright/test';

test.describe('Community feed viewing', () => {
	 test('student can view and interact with community feed', async ({ page }) => {
		 await page.goto('/demo/community-feed');
		 await expect(page.getByRole('heading', { name: 'Peer Submissions Feed' })).toBeVisible();
		 
		 // Use first() to handle multiple elements with same text
		 await expect(page.getByText('Video Presentation: Modern Web Development').first()).toBeVisible();

		 // Search filters results
		 const search = page.getByPlaceholder('Search assignments, students, or courses...');
		 await search.fill('Alex');
		 await expect(page.getByText('Alex Johnson')).toBeVisible();

		 // Reset filters
		 await page.getByRole('button', { name: 'Reset Filters' }).click();
		 await expect(page.getByText('Sarah Chen')).toBeVisible();
	 });
});


