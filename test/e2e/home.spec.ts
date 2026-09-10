import { expect, test } from '@playwright/test'

test('home page links to both Sudoku flows', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Your next puzzle is ready.' })).toBeVisible()
  await expect(page.getByRole('link', { name: /play daily sudoku/i })).toHaveAttribute('href', '/daily')
  await expect(page.getByRole('link', { name: /solve a sudoku/i })).toHaveAttribute('href', '/solve')
})
