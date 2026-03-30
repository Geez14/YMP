# 🚦 YMP PROJECT ROUTER

## 🎯 Purpose
This is the single entry-point for all AI agents. You must identify your role and initialize your context according to the standards below before performing any work.

## 🛠️ Step 1: Role Identification
Identify which domain your task falls under. If you are a new specialized agent (e.g., Security, QA, DevOps), you must create a new context file in the `AI/` folder.

## 📏 Step 2: Context Creation Standards
If your specific role does not have a file in the `AI/` folder, create one using this exact naming convention:
- **Naming Pattern:** `AI/{role}-context.md` (e.g., `AI/security-context.md`, `AI/qa-context.md`).

### Required Template for New Contexts:
Every context file MUST include these sections:
1. **Role & Scope:** Define exactly what you are responsible for (and what you are NOT).
2. **Domain-Specific Rules:** List your specialized guardrails (e.g., for Security: "No plain-text secrets in Supabase calls").
3. **Canonical Reference Check:** Acknowledge the `AI_CONTEXT.md` root file for technical stack constraints (Next.js 16, React 19, FFmpeg v0.12).
4. **Milestone Status:** Describe the current state of your domain based on the last architecture update.

### Mandatory Template for New Contexts:
Every new context file MUST include these sections:
1. **Identity**: Clear definition of your role and responsibilities.
2. **Technical Bounds**: Explicitly acknowledge the Next.js 16 / React 19 / FFmpeg v0.12 stack.
3. **Specialized Rules**: Your domain-specific guardrails (e.g., Security must audit Supabase RLS).
4. **Standard Validation**: You must verify all code via: `bash -lc 'source ~/.nvm/nvm.sh && cd /home/mxtylish/github/YMP && npm run build'`.

## 🗺️ Existing Routing
- **Strategy / Architecture:** `AI/architecture-context.md`.
- **Implementation / Coding:** `AI/project-context-coder.md`.
- **UI/UX / Styling:** `AI/designer-context.md`.
- **Security / Auditing:** `AI/security-context.md`.

## ⚡ Mandatory Runtime Verification
All agents must verify changes using the Coder's validation string:
`bash -lc 'source ~/.nvm/nvm.sh && cd /home/mxtylish/github/YMP && npm run build'`.