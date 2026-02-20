
import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            print("Navigating to http://localhost:4173")
            page.goto("http://localhost:4173")

            # Login
            print("Logging in as teacher...")
            page.get_by_role("button", name="Guru").click()
            page.get_by_placeholder("name@sekolah.id").fill("guru@sekolah.id")
            page.get_by_placeholder("••••••••").fill("password")
            page.get_by_role("button", name="Masuk Sekarang").click()

            # Wait for dashboard
            page.wait_for_selector("text=Dashboard Guru")
            print("Logged in successfully.")

            # Go to Question Bank
            print("Navigating to Bank Soal...")
            page.get_by_role("button", name="Bank Soal").click()

            # Wait for questions
            page.wait_for_selector("text=Berapakah volume kubus", timeout=10000)
            print("Bank Soal loaded.")

            # Take BEFORE screenshot
            page.screenshot(path="verification/before_drag.png")

            # Get questions
            items = page.locator("[draggable='true']")
            items.first.wait_for()

            count = items.count()

            if count < 2:
                print("Not enough items.")
                return

            first_item = items.nth(0)
            second_item = items.nth(1)

            first_text = first_item.locator("p.font-bold").text_content()
            second_text = second_item.locator("p.font-bold").text_content()

            print(f"Before Drag: Item 1 = '{first_text[:20]}...', Item 2 = '{second_text[:20]}...'")

            # Perform Drag and Drop
            print("Dragging Item 1 to Item 2...")
            first_item.drag_to(second_item)

            time.sleep(2)

            # Take AFTER screenshot
            page.screenshot(path="verification/after_drag.png")
            print("Screenshot saved to verification/after_drag.png")

            new_first_text = items.nth(0).locator("p.font-bold").text_content()
            new_second_text = items.nth(1).locator("p.font-bold").text_content()

            print(f"After Drag: Item 1 = '{new_first_text[:20]}...', Item 2 = '{new_second_text[:20]}...'")

            if new_first_text == second_text and new_second_text == first_text:
                print("SUCCESS: Items swapped positions.")
            elif new_second_text == first_text:
                 print("SUCCESS: Item 1 moved to position 2.")
            elif new_first_text != first_text:
                 print("SUCCESS: Order changed.")
            else:
                 print("FAILURE: Order did not change.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
