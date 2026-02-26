from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    try:
        print("Navigating to login...")
        page.goto("http://localhost:3000")

        # Login
        page.fill("input[type='text']", "guru@sekolah.id")
        page.fill("input[type='password']", "password")
        page.click("button[type='submit']")

        page.wait_for_selector("text=Dashboard Guru")

        # Open Editor
        print("Opening editor...")
        page.click("button:has-text('Buat Ujian Baru')")
        page.click("button:has-text('Buat Manual')")

        page.wait_for_selector("text=Editor Ujian")

        # Verify Question Text uses Quill (ql-editor class)
        # Note: RichTextEditor wraps a div that Quill attaches to.
        # The editor content is inside .ql-editor

        print("Verifying Question Text RTE...")
        # Add a question first if needed (default usually has one)
        # Let's check for the presence of .ql-editor inside the question card area

        editors = page.locator(".ql-editor")
        count = editors.count()
        print(f"Found {count} RTE instances.")

        if count > 0:
            print("SUCCESS: Rich Text Editors are present.")
            # Try typing into the first one (Question Text)
            editors.first.fill("Test Question Text via Playwright")
            page.wait_for_timeout(500)

            # Check if text persisted (by reading it back)
            content = editors.first.inner_text()
            if "Test Question Text via Playwright" in content:
                print("SUCCESS: Text input persisted in RTE.")
            else:
                print(f"FAILURE: Text input mismatch: {content}")
        else:
            print("FAILURE: No Rich Text Editors found.")

        page.screenshot(path="verification/rte_verification.png")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/rte_error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
