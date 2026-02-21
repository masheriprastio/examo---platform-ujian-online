
import os
import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        print("1. Logging in as Student...")
        page.goto("http://localhost:3000")
        if page.is_visible("text=Masuk ke akun Anda"):
            page.click("text=Siswa")
            page.wait_for_timeout(500)
            page.click("text=Masuk Sekarang")
        page.wait_for_selector("text=Dashboard Siswa")

        # 2. Check for exams
        print("2. Checking for exams...")
        # Look for any exam cards
        try:
            # Try to find at least one exam card or verify container is empty
            exam_elements = page.query_selector_all(".bg-white.p-10.rounded-\[50px\].border.border-gray-100.shadow-sm")
            print(f"Found {len(exam_elements)} exams.")

            if len(exam_elements) == 0:
                print("WARNING: No exams found in Student Dashboard.")

            # Log console errors to see if fetch failed
            print("Listening for console errors...")
            page.on("console", lambda msg: print(f"CONSOLE: {msg.text}") if msg.type == "error" else None)

            # Force refresh to trigger fetch again
            page.reload()
            page.wait_for_selector("text=Dashboard Siswa")

            exam_elements_after = page.query_selector_all(".bg-white.p-10.rounded-\[50px\].border.border-gray-100.shadow-sm")
            print(f"Found {len(exam_elements_after)} exams after refresh.")

        except Exception as e:
            print(f"Error checking exams: {e}")

        browser.close()

if __name__ == "__main__":
    run()
