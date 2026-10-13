# Game 5 credential-backed worker adapter

This is the first **real AI API adapter**, but **not a fully autonomous coding pipeline**. It can call a planning specialist once using a manually triggered GitHub Action and upload a QA-contract-reviewed report. It does NOT make code edits, automatically create pull requests, perform independent gameplay QA, dispatch issues, or merge or deploy.

## Activate safely
1. Review/merge the draft PR after checking the source.
2. In GitHub repository Settings → Secrets and variables → Actions, add a repository secret named `GAME5_OPENAI_API_KEY` using an API key you control. Do not paste keys into chat, files or issues. API use can incur charges.
3. Open Actions → Game 5 worker manual test → Run workflow. This is the only live launch trigger in v1.
4. Inspect workflow logs and the `game5-worker-report` artifact. A passed report contract is **not** a passed gameplay test.

The model defaults to `gpt-4.1-mini`; validate its availability and project billing before launch. No stored responses requested; no repository write permission granted to the workflow. Task input is constrained through the existing dispatcher validator.

Further work: scoped code-writing runner, dependency-aware webhook/issue dispatcher with atomic leases, independent QA runner, audited PR generation, spending limits and owner approval before merge. Keep other games read-only.
