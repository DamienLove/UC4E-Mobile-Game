
from playwright.sync_api import sync_playwright, expect

def verify_settings_modal():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"Browser Error: {exc}"))

        try:
            print("Navigating to app...")
            page.goto("http://localhost:5173", timeout=60000)

            print("Waiting for page load...")
            # Wait for something that indicates the app is running.
            # The splash screen has "Initialize Universe" or similar.
            # App.tsx renders SplashScreen if !gameStarted.

            # Wait for at least some body content
            page.wait_for_selector("body", timeout=10000)

            print("Taking initial screenshot...")
            page.screenshot(path="verification/initial_load.png")

            # Check if we are on splash screen
            # SplashScreen usually has a button to start.
            # Let's look for "Initialize Universe" or just any button.

            # Check if we can see the settings button (it might be visible even on splash? No, App.tsx returns SplashScreen OR the game view)
            # So we probably need to start the game first.

            start_btn = page.get_by_role("button", name="Initialize Universe")
            if start_btn.count() > 0:
                print("Found Start Button, clicking...")
                start_btn.click()
                page.wait_for_timeout(2000) # Wait for transition
            else:
                print("Start button not found by name. Looking for any button...")
                buttons = page.get_by_role("button").all()
                if len(buttons) > 0:
                    print(f"Found {len(buttons)} buttons. Clicking the first one...")
                    buttons[0].click()
                    page.wait_for_timeout(2000)

            # Now we should be in the game. Look for settings button.
            # It's the hamburger menu.
            print("Looking for Settings button...")
            settings_btn = page.locator("button:has(svg path[d='M4 6h16M4 12h16M4 18h16'])")

            if settings_btn.count() > 0:
                print("Settings button found. Clicking...")
                settings_btn.click()

                # Wait for modal
                print("Waiting for modal...")
                modal = page.locator("div[role='dialog']")
                try:
                    modal.wait_for(state="visible", timeout=5000)
                    print("Modal is visible!")

                    # Verify Accessibility Attributes
                    print("Verifying attributes...")

                    # 1. Dialog Role (Already checked by locator)
                    expect(modal).to_have_attribute("role", "dialog")
                    expect(modal).to_have_attribute("aria-modal", "true")
                    expect(modal).to_have_attribute("aria-labelledby", "settings-title")

                    # 2. Title ID
                    title = modal.locator("#settings-title")
                    expect(title).to_be_visible()
                    expect(title).to_have_id("settings-title")

                    # 3. Inputs and Labels
                    # SFX
                    expect(modal.locator("label[for='sfx-volume']")).to_be_visible()
                    expect(modal.locator("#sfx-volume")).to_be_visible()

                    # Music
                    expect(modal.locator("label[for='music-volume']")).to_be_visible()
                    expect(modal.locator("#music-volume")).to_be_visible()

                    # Visual Accessibility
                    expect(modal.locator("label[for='visual-accessibility']")).to_be_visible()
                    expect(modal.locator("#visual-accessibility")).to_be_visible()

                    # 4. Close Button
                    close_btn = modal.locator("button[aria-label='Close settings']")
                    expect(close_btn).to_be_visible()

                    print("SUCCESS: All accessibility attributes verified.")
                    page.screenshot(path="verification/settings_modal_verified.png")

                except Exception as e:
                    print(f"Modal verification failed: {e}")
                    page.screenshot(path="verification/modal_failed.png")
            else:
                print("Settings button not found.")
                page.screenshot(path="verification/no_settings_btn.png")

        except Exception as e:
            print(f"Script failed: {e}")
            page.screenshot(path="verification/script_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_settings_modal()
