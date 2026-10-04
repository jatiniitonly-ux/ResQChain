import { test, expect } from '@playwright/test'

test('ResQChain disaster simulation exposes the accountable offline path', async ({ page }) => {
  await page.goto('/simulation')
  await expect(page.getByText('Disaster simulation')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Cyclone Relief — District A' })).toBeVisible()
  await expect(page.getByText('Incident and resources seeded')).toBeVisible()
  await expect(page.getByText('Demo complete — open donor transparency')).toBeVisible()
  await page.goto('/donor')
  await expect(page.getByText('Privacy-safe view')).toBeVisible()
  await expect(page.getByText(/excludes names/i)).toBeVisible()
})

test('Mumbai operational location supports satellite and street context', async ({ page }) => {
  await page.goto('/locations')
  await expect(page.getByText('Mumbai Metropolitan Region is connected')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Satellite view · Mumbai Metropolitan Region' })).toBeVisible()
  await page.getByRole('button', { name: 'Street view' }).click()
  await expect(page.getByRole('heading', { name: 'Street view · Mumbai Metropolitan Region' })).toBeVisible()
  await page.getByRole('button', { name: 'Satellite view' }).click()
  await expect(page.getByText('Satellite tiles cached · Mumbai')).toBeVisible()
})
