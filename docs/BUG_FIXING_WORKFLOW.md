# The Official "Snag Relay" Bug-Fixing Workflow

This document outlines the complete, mandatory workflow for all agents participating in the "Snag Relay." The goal of this process is not just to fix bugs, but to do so in a way that is stable, verifiable, and maintains a high level of quality and communication across the team.

Adherence to this workflow is critical for the success of the project.

## The Relay Philosophy: "The Baton is Context"

We work on a single, shared branch (`snag-squad`) in a sequential relay. The work of one agent is immediately picked up by the next. This requires a deep emphasis on clear communication and a rock-solid verification process. Never end a session without leaving a clear trail for the next agent.

## The "Snag Relay" Process: A Step-by-Step Guide

### Step 1: The Pickup (Start of Session)

1.  **Sync with the `snag-squad` branch.** All work happens here.
    ```bash
    git checkout snag-squad
    git pull
    ```

2.  **Read the `session-logs.md`**. Understand what the previous agent accomplished and where they left off. Pay close attention to their "Hand-Off Note" for any "Danger Zones."
    ```bash
    # Location: .jules/session-logs.md
    ```

3.  **Choose a bug from the `snag-list-doc.md`**. Select an open bug to work on and update its status to `[IN PROGRESS - YourName]`.
    ```bash
    # Location: easy-seo/snag-list-doc.md
    ```

### Step 2: The Work (The Build)

1.  **Prepare the Local Environment**. Ensure your `easy-seo` directory is ready.
    ```bash
    cd easy-seo
    npm install
    npx playwright install --with-deps
    ```

2.  **Implement the Fix**. Apply the necessary code changes to resolve the bug as described in the snag list's "Recovery Plan."

### Step 3: The Quality Check (The Verification)

This is the most critical step. All changes **must** be verified with a Playwright test. Skipping this step is not permitted.

1.  **Find or Create a Test**.
    - If a test file already exists for the feature you're working on, add a new test case that specifically reproduces the bug and verifies your fix.
    - If no test file exists, create a new one.

2.  **Follow the Testing Guide**. Refer to the `docs/TESTING_GUIDE.md` for detailed instructions on how to write a valid, isolated frontend test using API mocking.

3.  **Run the Test and Confirm it Passes**.
    ```bash
    # Run just your new or modified test file
    npx playwright test tests/your-test-file.spec.js
    ```
    Your test must pass before you can proceed.

### Step 4: The Hand-Off (Documentation)

1.  **Update `snag-list-doc.md`**. Change the status of the bug to `[FIXED - YYYY-MM-DD]`.

2.  **Update `CHANGELOG.md` and `FILES.md`**. As per `AGENTS.md`, document what has changed.

3.  **Write Your "Hand-Off Note" in `session-logs.md`**. This is essential for the next agent. Your note must include:
    - **The Why**: The snag you targeted.
    - **The What**: The specific files you changed.
    - **The Where**: The "Danger Zone"—what modules the next agent should watch out for.
    - **What You Tried**: Briefly describe your process and confirm that your fix was verified with a passing Playwright test.

### Step 5: The Commit

1.  **Commit your changes directly to `snag-squad`**.
2.  Use the standardized commit message format:
    ```
    🛠️ Snag Handoff: Resolved [Snag Title]
    ```
    In the commit description, provide a concise summary of the fix.

By following this process, we ensure that every fix is verified, documented, and seamlessly handed off, creating a stable and efficient bug-resolution machine.
