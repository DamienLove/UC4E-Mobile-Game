
import asyncio
from playwright.async_api import async_playwright, expect

async def verify_hud_accessibility():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Navigate to the app
        await page.goto("http://localhost:5173/Universe-Connected-for-everyone-/")

        # Wait for Splash Screen and Click Start
        # The button text is likely "Initialize Universe" based on memory/code
        await page.get_by_role("button", name="Initialize Universe").click()

        # Wait for HUD to appear
        # We can wait for one of our new accessible buttons
        # Note: The transition might take a moment (zoom in effect)

        # Wait for the Upgrade button
        upgrade_btn = page.get_by_label("Open Evolution Matrix")
        await expect(upgrade_btn).to_be_visible(timeout=10000)

        # Verify Settings Button
        settings_btn = page.get_by_label("System Options")
        await expect(settings_btn).to_be_visible()

        # Verify Zoom Buttons
        zoom_in = page.get_by_label("Zoom In")
        zoom_out = page.get_by_label("Zoom Out")
        await expect(zoom_in).to_be_visible()
        await expect(zoom_out).to_be_visible()

        print("All accessible buttons found!")

        # Take a screenshot
        await page.screenshot(path="verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_hud_accessibility())
