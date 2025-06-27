**Use Cline to debug, detect, and fix—never just generate blindly.**

1. **Deep Context Dive**  
   Cline must analyze full stack traces, function state, and variable flows—integrate with crash reports or logs (e.g., Sentry) to pinpoint root causes :contentReference[oaicite:1]{index=1}.

2. **Interactive Step‑through Agent**  
   Allow Cline to simulate “step-in” debugging: inspect variables, propose breakpoints, and ask follow-up questions (like ChatDBG) :contentReference[oaicite:2]{index=2}.

3. **Automated Fix Suggestions**  
   When bugs are found, Cline should propose minimal code patches—with explanation and rationale attached :contentReference[oaicite:3]{index=3}.

4. **Live Feedback in IDE**  
   In editors like VS Code, Cline flags errors in real‑time, provides instant fix suggestions, and integrates with live SAST/SCA feedback :contentReference[oaicite:4]{index=4}.

5. **Auto‑Test Generation & Validation**  
   After fixing a bug, Cline must generate or update tests covering the failure path and verify them run green :contentReference[oaicite:5]{index=5}.

6. **Performance & Regression Checks**  
   For every patch, Cline should analyze potential impact on performance or regressions (memory usage, latency, etc.) :contentReference[oaicite:6]{index=6}.

7. **Explain-Centric Workflow**  
   For each debugging session, Cline provides:

   - A clear root‑cause summary
   - Steps taken (e.g. “stepped into funcX, saw null y”)
   - Why the fix works

8. **Security-Aware Debugging**  
   While debugging, also flag potential vulnerabilities—SQL injections, unsafe deserialization—and suggest secure alternatives :contentReference[oaicite:7]{index=7}.

9. **Feedback Loop**  
   After fix & test, prompt developer:  
   “Was the fix appropriate? Add notes below.” This closed‑loop refines future debugging behavior.

10. **Guardrails & Oversight**  
    Cline must not auto-commit fixes. Every patch needs human sign-off before merging.
