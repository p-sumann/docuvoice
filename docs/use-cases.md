# DocuVoice — Plugin Use Cases: Full User Perspective

> How each domain plugin transforms a painful workflow into a voice-first experience

---

## Table of Contents

1. [Insurance Claims Processing](#1-insurance-claims-processing)
2. [Legal Contract Review](#2-legal-contract-review)
3. [Financial Due Diligence](#3-financial-due-diligence)
4. [HR Claims & Compliance](#4-hr-claims--compliance)
5. [Cross-Plugin Comparison](#5-cross-plugin-comparison)

---

## 1. Insurance Claims Processing

### The Pain (Before DocuVoice)

**Who**: Sarah, Senior Auto Claims Adjuster at a mid-size P&C insurer. Handles 15-20 claims per day.

**Her typical morning:**
1. Opens claim file in legacy system (2 min)
2. Prints FNOL report (1 min)
3. Opens policy PDF in separate window, manually searches for coverage limits (3 min)
4. Opens medical bills, manually adds up charges (5 min)
5. Opens police report, reads through narrative for key facts (4 min)
6. Compares passenger count across FNOL vs. police report — they don't match (she might catch this, she might not)
7. Calculates exposure in a spreadsheet (3 min)
8. Writes adjuster notes in Word (8 min)
9. Checks if claim exceeds authority threshold (2 min)
10. Total: **~30 minutes per claim, 7+ hours/day on repetitive doc review**

**What goes wrong:**
- She misses a discrepancy between documents because she's tired at claim #14
- Exposure calculation is off because she missed a line item in medical bills
- Her notes are inconsistent across claims because there's no template enforcement
- She can't review claims while driving to inspection sites (no hands-free option)

### The Solution (With DocuVoice)

**Sarah's new morning:**

#### Step 1: Create Workspace (one time, 3 minutes)
```
Sarah opens DocuVoice → clicks "+ New Workspace"
→ Selects "Insurance Claims" template
→ Names it "AUT-2024-789 — Smith Rear-End Collision"
→ Drags & drops 4 PDFs: FNOL, Policy, Medical Bills, Police Report
→ Watches processing bar: "Extracting fields..." → "Building context..." → ✅ Ready
→ Agent automatically greets: "I've loaded 4 documents for claim AUT-2024-789.
   I found the policy holder is John Smith, with BI limits of $100,000/$300,000.
   Ready to review whenever you are."
```

#### Step 2: Voice Conversation (5 minutes replaces 30)
```
Sarah clicks the voice orb (or presses Space):

Sarah: "Give me a quick summary of this claim."

Agent: "This is an auto bodily injury claim filed March 15th, 2024.
        John Smith reports a rear-end collision at Main St and 5th Ave.
        The FNOL states 2 passengers with soft tissue injuries.
        Medical bills total $23,450 across 3 providers.
        The policy has BI limits of $100,000 per person, $300,000 per occurrence,
        with a $500 deductible. The policy is active through January 2025."

        📄 [Policy-AUT-789.pdf referenced]
        📄 [FNOL-2024-1234.pdf referenced]

Sarah: "Any discrepancies across the documents?"

Agent: "I found 2 discrepancies."
        ⚙️ [Running compare_fields()...]

        🔴 Finding: "Passenger Count Mismatch"
        → FNOL reports 2 passengers. Police report lists 3 passengers.
           This affects exposure calculation and liability assessment.
           Source: FNOL-2024-1234.pdf (page 1) vs Police-2024-5678.pdf (page 2)

        🟡 Finding: "Treatment Date Gap"
        → First medical bill is dated March 20th, but the police report
           indicates the claimant was treated at the scene on March 15th.
           No ER records present in the file.
           Source: Medical-Bills.pdf vs Police-2024-5678.pdf

Sarah: "Calculate the total exposure."

Agent: ⚙️ [Running calculate_exposure()...]

        🟡 Finding: "Exposure at $23,450 — 23.5% of Per-Person BI Limit"
        → Medical bills: $23,450
        → If 3 passengers (per police report): potential total exposure $70,350+
        → Per-occurrence limit: $300,000. Current utilization: 23.5%
        → Recommend: Verify actual passenger count before reserve setting.

Sarah: "Generate adjuster notes for this claim."

Agent: ⚙️ [Running generate_adjuster_summary()...]

        📋 "Adjuster summary generated. Here's the key section:
        
        CLAIM SUMMARY — AUT-2024-789
        Claimant: John Smith | DOL: 03/15/2024
        Type: Auto BI — Rear-end collision
        Status: Under Review
        
        KEY FINDINGS:
        1. Passenger count discrepancy (FNOL: 2 vs Police: 3) — REQUIRES VERIFICATION
        2. Treatment gap between DOL and first billing date
        3. Current medical exposure: $23,450 (23.5% of per-person BI limit)
        
        RECOMMENDATION:
        Obtain ER records for DOL. Verify passenger count with claimant.
        Set initial reserve at $35,000 pending verification.
        Claim within adjuster authority ($50,000 threshold)."
```

#### Step 3: Phone Access (From the Road)
```
Sarah is driving to an inspection. Her supervisor calls about the Smith claim.

Supervisor calls the workspace phone number: +1 (555) 123-4567

Agent: "Good morning. You've reached the DocuVoice workspace for claim
        AUT-2024-789, Smith rear-end collision. How can I help?"

Supervisor: "What's the exposure on this claim?"

Agent: "Current medical exposure is $23,450, which is 23.5% of the
        per-person BI limit. However, there's a passenger count discrepancy —
        the FNOL says 2, but the police report lists 3 passengers.
        If verified at 3, potential total exposure could reach $70,000+.
        Sarah's recommendation is to set initial reserve at $35,000
        pending verification."

📞 [Phone call banner: "Call active — Supervisor is connected to this workspace"]
```

### What Changed
| Before DocuVoice | After DocuVoice |
|---|---|
| 30 min per claim | 5 min per claim |
| Missed discrepancies (fatigue) | Every discrepancy caught automatically |
| Manual exposure calculation | Instant, accurate calculation |
| Inconsistent adjuster notes | Standardized, policy-compliant summaries |
| Desk-only access | Phone access from anywhere |
| 15-20 claims/day capacity | 40+ claims/day capacity |

### Technical: Insurance Claims Plugin
```python
# Document Schemas (what the plugin knows how to extract)
schemas = [
    DocumentSchema("first_notice_of_loss", fields=[
        "date_of_loss", "claimant_name", "claimant_dob",
        "passengers", "injury_type", "description",
        "reporting_officer", "filed_date"
    ]),
    DocumentSchema("insurance_policy", fields=[
        "policy_number", "insured_name", "effective_date", "expiry_date",
        "bi_limit_per_person", "bi_limit_per_occurrence",
        "pd_limit", "um_limit", "deductible", "coverage_type"
    ]),
    DocumentSchema("medical_bills", fields=[
        "provider_name", "date_of_service", "procedure_codes",
        "billed_amount", "diagnosis_codes", "treating_physician"
    ]),
    DocumentSchema("police_report", fields=[
        "report_number", "date_of_incident", "officer_name",
        "parties_involved", "passenger_count", "narrative",
        "citations_issued", "weather_conditions"
    ]),
]

# Function Tools
tools = [
    "compare_fields"        → Cross-doc field comparison + discrepancy detection
    "calculate_exposure"    → Sum medical bills vs. policy limits
    "flag_red_flags"        → Anomaly patterns (date gaps, amount spikes, etc.)
    "generate_adjuster_summary" → Structured notes with findings + recommendations
]

# Guardrails
guardrails = [
    "Never disclose policy limits to claimants (only to adjusters/supervisors)",
    "Flag any claim where exposure exceeds 50% of per-person BI limit",
    "Always note passenger count discrepancies as HIGH severity"
]
```

---

## 2. Legal Contract Review

### The Pain (Before DocuVoice)

**Who**: Marcus, Corporate Paralegal at a Series B startup's legal team. Reviews 8-12 contracts per week (NDAs, MSAs, vendor agreements, amendments).

**His typical workflow:**
1. Receives contract from business team via email (partner wants to sign by Friday)
2. Opens the new contract (30-page MSA) in one window
3. Opens the company's playbook/template in another window
4. Manually reads clause by clause, comparing against standard terms (45 min)
5. Opens a spreadsheet to track deviations from playbook
6. Spots a non-standard indemnification clause — needs to check what they agreed to in the original MSA (searches through 200+ contracts in SharePoint, 10 min)
7. Finds the original MSA, opens it, cross-references the amendment
8. Writes a redline summary email to the attorney (15 min)
9. Attorney asks: "What's the liability cap in the original vs. the amendment?"
10. Marcus re-opens both documents, searches again (5 min)
11. Total: **~2 hours per contract, 16-24 hours/week on contract review**

**What goes wrong:**
- He misses a non-standard governing law clause buried on page 27
- The amendment references "Section 8.3" but the original MSA was restructured — Section 8.3 is now about something completely different
- He can't remember if the previous amendment changed the liability cap or not
- Business team is pressuring him to "just approve it" — he feels rushed
- When the attorney asks questions by phone, Marcus has to scramble to find answers

### The Solution (With DocuVoice)

#### Step 1: Create Workspace (one time, 3 minutes)
```
Marcus opens DocuVoice → clicks "+ New Workspace"
→ Selects "Legal Contract Review" template
→ Names it "Acme Corp — MSA Amendment #3"
→ Uploads 4 documents:
   - Company Playbook (standard terms reference)
   - Original MSA (signed 2023)
   - Amendment #1 (Feb 2024)
   - Amendment #2 (proposed — the one to review)
→ Processing: "Extracting clauses..." → "Mapping to playbook..." → ✅ Ready
→ Agent: "I've loaded 4 documents for the Acme Corp engagement.
   The original MSA was signed January 2023 with a $2M liability cap.
   Amendment #1 extended the term and adjusted pricing.
   I'm ready to review Amendment #2 against your playbook."
```

#### Step 2: Voice Conversation (15 minutes replaces 2 hours)
```
Marcus: "Compare Amendment #2 against our playbook. What deviates?"

Agent: ⚙️ [Running compare_against_playbook()...]

        "I found 5 deviations from your standard playbook:"

        🔴 Finding: "Non-Standard Indemnification — Mutual → One-Way"
        → Your playbook requires mutual indemnification.
           Amendment #2, Section 6.1 changes this to one-way indemnification
           favoring Acme Corp. Your company would indemnify Acme but not vice versa.
           This is a material change from the original MSA Section 6.1
           which had mutual indemnification.
           📄 [Amendment-2.pdf, page 8] vs 📄 [Playbook.pdf, Section 6]

        🔴 Finding: "Liability Cap Reduced Without Corresponding Term Change"
        → Original MSA: $2,000,000 aggregate liability cap.
           Amendment #2 proposes reducing to $500,000 while extending the term
           by 2 years. This increases your risk exposure per year of contract.
           📄 [Amendment-2.pdf, Section 9.2] vs 📄 [Original-MSA.pdf, Section 9.2]

        🟡 Finding: "Governing Law Changed — Delaware → Texas"
        → Your playbook specifies Delaware law.
           Amendment #2 changes governing law to Texas in Section 12.4.
           This may affect enforceability of limitation clauses.
           📄 [Amendment-2.pdf, page 27]

        🟡 Finding: "Termination Notice Period — 90 days → 30 days"
        → Original: 90-day written notice for termination without cause.
           Amendment #2: reduces to 30-day notice. Below your playbook minimum of 60 days.

        🔵 Finding: "Auto-Renewal Clause Added"
        → Amendment #2 adds a 1-year auto-renewal clause (Section 3.2).
           Not present in original MSA. Your playbook allows this
           with 60-day opt-out notice — Amendment #2 specifies 30 days.

Marcus: "How does the indemnification in Amendment #1 compare?"

Agent: "Amendment #1 did NOT change the indemnification clause.
        The mutual indemnification from the original MSA Section 6.1
        was preserved in Amendment #1. The change to one-way
        indemnification is new in Amendment #2."
        📄 [Amendment-1.pdf] — no modifications to Section 6.

Marcus: "Has Acme agreed to mutual indemnification in any other contract with us?"

Agent: ⚙️ [Running search_documents()...]
        "Based on the documents in this workspace, the original MSA and
         Amendment #1 both contain mutual indemnification. Amendment #2
         is the first document proposing a change to one-way."

Marcus: "Generate a redline summary I can send to the attorney."

Agent: ⚙️ [Running generate_review_memo()...]

        📋 "Review memo generated:

        REDLINE SUMMARY — Acme Corp Amendment #2
        Reviewer: Marcus | Date: Feb 21, 2026
        Risk Level: HIGH (2 material deviations)

        MUST NEGOTIATE:
        1. Indemnification (Section 6.1): Reject one-way. Restore mutual per playbook.
        2. Liability Cap (Section 9.2): $500K is 75% below original.
           Recommend holding at $2M or minimum $1M given term extension.

        SHOULD NEGOTIATE:
        3. Governing Law (Section 12.4): Push for Delaware per playbook.
        4. Termination Notice (Section 4.3): Request 60 days minimum.

        ACCEPTABLE WITH MODIFICATION:
        5. Auto-Renewal (Section 3.2): Accept if opt-out notice extended to 60 days.

        UNCHANGED FROM ORIGINAL MSA:
        - IP ownership (Section 7)
        - Confidentiality (Section 8)
        - Payment terms (Section 5)
        - Data protection (Section 10)"
```

#### Step 3: Attorney Calls In
```
Attorney is in a taxi heading to a meeting. Calls the workspace number.

Attorney: "Quick — what's the liability cap situation on Acme?"

Agent: "The original MSA has a $2 million aggregate liability cap.
        Amendment #2 proposes reducing it to $500,000 while adding 2 years
        to the term. That's a 75% reduction in the cap with 67% more exposure time.
        Marcus flagged this as must-negotiate. The recommendation is to hold at
        $2M or minimum $1M."

Attorney: "And the indemnification?"

Agent: "Amendment #2 changes mutual indemnification to one-way,
        favoring Acme. This was not changed in Amendment #1.
        It's the most material change in the proposed amendment.
        Recommendation is to reject and restore mutual indemnification."

Attorney: "Perfect. I'll push back on both in the meeting."
```

### What Changed
| Before DocuVoice | After DocuVoice |
|---|---|
| 2 hours per contract | 15 minutes per contract |
| Manual clause-by-clause comparison | Automatic playbook deviation detection |
| Missed clauses buried deep in documents | Every clause checked against playbook |
| Separate spreadsheet for tracking deviations | Findings appear in real-time |
| Can't answer attorney questions on the spot | Phone access to instant answers |
| Inconsistent review memos | Standardized, structured redline summaries |
| 8-12 contracts/week capacity | 30+ contracts/week capacity |

### Technical: Legal Contract Review Plugin
```python
schemas = [
    DocumentSchema("master_service_agreement", fields=[
        "parties", "effective_date", "term_length", "auto_renewal",
        "termination_notice_period", "liability_cap_aggregate",
        "liability_cap_per_incident", "indemnification_type",
        "governing_law", "dispute_resolution", "ip_ownership",
        "confidentiality_period", "data_protection_terms",
        "payment_terms", "sla_commitments"
    ]),
    DocumentSchema("amendment", fields=[
        "amendment_number", "effective_date", "sections_modified",
        "new_terms", "superseded_terms", "parties_signature_date"
    ]),
    DocumentSchema("nda", fields=[
        "parties", "effective_date", "term", "definition_of_confidential",
        "exclusions", "return_destroy_obligation", "governing_law",
        "non_solicitation", "residual_knowledge_clause"
    ]),
    DocumentSchema("playbook", fields=[
        "standard_terms", "acceptable_ranges", "must_have_clauses",
        "red_line_triggers", "authority_thresholds"
    ]),
]

tools = [
    "compare_against_playbook"  → Clause-by-clause deviation detection
    "cross_reference_amendments" → Track how terms changed across versions
    "identify_missing_clauses"   → Check for standard clauses not present
    "generate_review_memo"       → Structured redline summary with risk levels
    "search_precedent"           → Search past contracts for similar terms
]

guardrails = [
    "Never provide legal advice — always frame as 'observations' and 'for attorney review'",
    "Flag any indemnification change as HIGH severity",
    "Flag any liability cap reduction > 25% as HIGH severity",
    "Always identify governing law changes",
    "Note when amendment references sections that have been renumbered"
]
```

---

## 3. Financial Due Diligence

### The Pain (Before DocuVoice)

**Who**: Priya, Associate at a PE firm. Running due diligence on a $50M acquisition target. Has 3 weeks to review a virtual data room with 200+ documents.

**Her typical workflow:**
1. Downloads 15 financial documents from the VDR (annual reports, P&L statements, balance sheets, cap table, audit reports, revenue projections)
2. Opens each in separate tabs, manually building a financial model in Excel (2 days)
3. Cross-references revenue numbers between the P&L and the audit report — finds a $300K discrepancy she almost missed (4 hours of detective work)
4. Reads the audit report footnotes for unusual items — buried on page 47 is a pending litigation disclosure (30 min)
5. Checks the cap table against the articles of incorporation — option pool doesn't match (1 hour)
6. Writes a memo summarizing findings for the investment committee (3 hours)
7. Managing partner asks "What's the revenue CAGR?" — she has to recalculate (10 min)
8. Total per target: **40-60 hours across 2-3 weeks**

**What goes wrong:**
- Revenue figures in the pitch deck don't match the audited financials — she catches it at 2 AM
- A related-party transaction is disclosed in a footnote she initially skimmed
- The cap table shows a convertible note that would dilute the post-money valuation by 12%
- She spends half her time on data extraction instead of actual analysis

### The Solution (With DocuVoice)

#### Step 1: Create Workspace
```
Priya opens DocuVoice → "+ New Workspace"
→ Selects "Financial Due Diligence" template
→ Names it "Project Falcon — Target Co. Acquisition DD"
→ Uploads batch: 3-year P&L, Balance Sheet, Audit Report,
   Cap Table, Pitch Deck, Revenue Projections, Articles of Incorporation
→ Processing: "Extracting financial tables..." → "Cross-referencing figures..."
→ Agent: "I've loaded 7 documents for Project Falcon.
   Target reports $12.4M revenue in FY2024 per the P&L.
   I see some initial discrepancies I'd like to flag. Ready when you are."
```

#### Step 2: Voice Conversation (2 hours replaces 2 days)
```
Priya: "Give me the revenue story — what do the numbers look like across all documents?"

Agent: "Revenue across documents:"

        📊 P&L Statement:
        FY2022: $6.8M → FY2023: $9.2M → FY2024: $12.4M
        That's a 35% CAGR over 3 years.

        📊 Audit Report:
        FY2024 audited revenue: $12.1M

        📊 Pitch Deck:
        FY2024 revenue stated as: $12.8M

        🔴 Finding: "Revenue Discrepancy Across 3 Sources"
        → P&L shows $12.4M, Audit shows $12.1M, Pitch Deck claims $12.8M.
           The $700K gap between audit and pitch deck is material (5.8%).
           The $300K gap between P&L and audit may be a timing/accrual difference.
           Recommend: Request reconciliation from target management.

Priya: "What about the cap table — any dilution risks?"

Agent: ⚙️ [Running analyze_cap_table()...]

        🟡 Finding: "Convertible Note — Potential 12% Dilution"
        → Cap table shows a $1.5M convertible note issued March 2024.
           Conversion terms: $10M valuation cap, 20% discount.
           At your proposed $50M acquisition price, this note converts to
           approximately 12% of fully diluted shares.
           This is NOT reflected in the pitch deck's ownership summary.
           📄 [Cap-Table.xlsx] vs 📄 [Pitch-Deck.pdf, slide 18]

        🔵 Finding: "Unexercised Options — 8% of Fully Diluted Pool"
        → Option pool shows 800K shares unexercised out of 10M fully diluted.
           If all exercised at acquisition: additional $2.4M in exercise proceeds
           but 8% dilution to acquirer's ownership.

Priya: "Any red flags in the audit report?"

Agent: ⚙️ [Running scan_audit_footnotes()...]

        🔴 Finding: "Pending Litigation — Note 14, Page 47"
        → The audit report discloses a pending lawsuit from a former employee
           alleging IP theft. Potential damages estimated at $2-5M.
           No provision booked in the financial statements.
           This represents 16-40% of FY2024 EBITDA.
           📄 [Audit-Report.pdf, page 47, footnote 14]

        🟡 Finding: "Related Party Transaction — Note 9"
        → The CEO's spouse operates a consulting firm that received $340K
           in payments during FY2024. Disclosed in Note 9 but not broken out
           in the P&L expense categories.
           📄 [Audit-Report.pdf, page 39, footnote 9]

Priya: "Generate the IC memo for this target."

Agent: ⚙️ [Running generate_dd_memo()...]

        📋 "Investment Committee Memo — Project Falcon

        TARGET OVERVIEW:
        Revenue: $12.1M (audited FY2024) | CAGR: 35% (3Y)
        Proposed Acquisition: $50M (4.0x revenue multiple)

        RED FLAGS (2):
        1. Revenue discrepancy: $700K gap between audit and pitch deck
        2. Undisclosed pending litigation: $2-5M potential damages

        YELLOW FLAGS (3):
        3. Convertible note creates 12% dilution not shown in pitch deck
        4. Related party payments: $340K to CEO spouse's firm
        5. Unexercised option pool: 8% potential dilution

        VALUATION IMPACT:
        Stated valuation: $50M (4.0x audited revenue)
        Adjusted for dilution (convertible + options): effective $58M
        Adjusted multiple: 4.8x revenue
        If litigation provision booked: EBITDA reduced 16-40%

        RECOMMENDATION:
        Proceed with caution. Request revenue reconciliation, litigation
        assessment from legal, and adjusted cap table before LOI."
```

### Technical: Financial DD Plugin
```python
schemas = [
    DocumentSchema("income_statement", fields=[
        "revenue", "cogs", "gross_margin", "operating_expenses",
        "ebitda", "net_income", "fiscal_year", "period"
    ]),
    DocumentSchema("balance_sheet", fields=[
        "total_assets", "total_liabilities", "equity",
        "cash", "accounts_receivable", "debt", "fiscal_year"
    ]),
    DocumentSchema("audit_report", fields=[
        "auditor", "opinion_type", "material_weaknesses",
        "footnotes", "related_party_transactions",
        "contingent_liabilities", "going_concern"
    ]),
    DocumentSchema("cap_table", fields=[
        "shareholders", "shares_outstanding", "option_pool",
        "convertible_notes", "warrants", "fully_diluted_total"
    ]),
    DocumentSchema("pitch_deck", fields=[
        "revenue_claims", "growth_rate", "market_size",
        "team", "funding_history", "valuation_ask"
    ]),
]

tools = [
    "cross_reference_financials" → Compare same metrics across documents
    "analyze_cap_table"          → Dilution calculation, waterfall analysis
    "scan_audit_footnotes"       → Flag material disclosures, contingencies
    "calculate_valuation_multiples" → Revenue, EBITDA, P/E multiples
    "generate_dd_memo"           → IC-ready memo with flags + recommendations
]

guardrails = [
    "Never provide investment advice — frame as 'analysis' and 'for review'",
    "Flag any revenue discrepancy > 5% across documents as HIGH severity",
    "Always check for undisclosed dilution in cap table vs pitch deck",
    "Flag related party transactions above $100K",
    "Note any going concern language in audit opinions"
]
```

---

## 4. HR Claims & Compliance

### The Pain (Before DocuVoice)

**Who**: David, HR Investigations Manager at a 5,000-employee company. Handles workplace complaints (harassment, discrimination, policy violations). Reviews 6-10 cases per month.

**His typical workflow:**
1. Receives a complaint (written form or from ethics hotline)
2. Pulls employee file from HRIS (position, tenure, performance reviews, prior complaints)
3. Pulls company policy handbook (relevant section — harassment, discrimination, etc.)
4. Reviews witness statements (3-5 per case, handwritten or typed, inconsistent formats)
5. Reviews any documentary evidence (emails, chat logs, photos, attendance records)
6. Manually cross-references timeline: who said what, when, and does it match?
7. Checks for prior complaints against the same respondent (searches through old case files)
8. Writes investigation summary with findings and recommended action (2-3 hours)
9. Legal review before any action is taken
10. Total per case: **8-15 hours across several days**

**What goes wrong:**
- Timeline inconsistencies between witnesses are hard to spot manually across 5 documents
- He misses that the respondent had a prior warning 18 months ago (buried in a separate file)
- The company policy was updated last year but he's referencing the old version
- His investigation reports are inconsistent in structure, creating legal risk
- Witness statements reference specific emails that he can't find in the evidence bundle

### The Solution (With DocuVoice)

#### Step 1: Create Workspace
```
David opens DocuVoice → "+ New Workspace"
→ Selects "HR Claims & Compliance" template
→ Names it "CASE-2024-089 — Workplace Harassment Complaint"
→ Uploads: Complaint Form, 4 Witness Statements, Company Policy (Harassment),
   Respondent Employee File, Email Evidence Bundle, Attendance Records
→ Processing: "Extracting statements..." → "Building timeline..." → ✅ Ready
→ Agent: "I've loaded 8 documents for case 089. The complaint alleges
   workplace harassment by a team lead against a direct report,
   with 4 witnesses. I've identified the relevant policy section.
   Ready to review."
```

#### Step 2: Voice Conversation
```
David: "Build me a timeline of events from all the witness statements."

Agent: ⚙️ [Running build_event_timeline()...]

        📅 Reconstructed Timeline:

        Jan 10 — Complainant starts reporting to respondent (per employee file)
        Jan 22 — Witness A: "Observed respondent making comments about
                  complainant's appearance in break room" (Statement, para 3)
        Jan 25 — Complainant emails HR noting "uncomfortable" interactions
                  (Email Evidence, email #3)
        Feb 1  — Witness B: "Respondent asked complainant to stay late,
                  alone, on 3 occasions" (Statement, para 2)
        Feb 3  — Attendance records confirm complainant logged overtime
                  on Jan 28, 30, and Feb 1 (Attendance Records)
        Feb 5  — Witness C: "Did not observe any inappropriate behavior"
                  (Statement, para 1) — NOTE: Witness C works different shift
        Feb 8  — Complainant files formal complaint (Complaint Form)

        🟡 Finding: "Timeline Gap — Feb 1 to Feb 8"
        → 7-day gap between last witnessed incident and formal complaint.
           No documented events in this period. Consider asking complainant
           what triggered the formal filing.

David: "Any inconsistencies between witness statements?"

Agent: ⚙️ [Running compare_witness_statements()...]

        🟡 Finding: "Date Discrepancy — Break Room Incident"
        → Witness A says break room incident was January 22.
           Witness D says they saw a similar incident on January 24.
           Could be two separate incidents or date confusion.
           Recommend: Clarify with both witnesses if same incident.

        🔵 Finding: "Witness C — Limited Observational Opportunity"
        → Witness C's statement says "I never saw anything inappropriate."
           However, attendance records show Witness C works the 6AM-2PM shift
           while the alleged incidents occurred after 5PM.
           Witness C's statement has limited evidentiary value.

David: "Does the respondent have any prior complaints or warnings?"

Agent: ⚙️ [Running search_employee_history()...]

        🔴 Finding: "Prior Warning — 18 Months Ago"
        → Respondent's employee file contains a written warning
           dated August 2023 for "inappropriate comments to a colleague."
           This was a verbal warning escalated to written after
           a second incident. No formal complaint was filed.
           This establishes a pattern of behavior.
           📄 [Respondent-Employee-File.pdf, page 12]

David: "What does our current policy say about repeated offenses?"

Agent: "Per your current Employee Handbook (v2024, Section 4.3.2):
        'A second substantiated complaint of harassment or inappropriate conduct
         within a 24-month period shall result in a minimum of suspension
         without pay, up to and including termination, at management discretion.'
        The prior warning is within the 24-month window (August 2023 to now).
        If this complaint is substantiated, policy requires minimum suspension."
        📄 [Company-Policy-Harassment.pdf, Section 4.3.2]

David: "Generate the investigation report."

Agent: ⚙️ [Running generate_investigation_report()...]

        📋 "INVESTIGATION REPORT — CASE-2024-089

        SUMMARY:
        Complainant alleges workplace harassment by direct supervisor
        (team lead) including inappropriate comments and requests to
        work alone after hours.

        EVIDENCE SUMMARY:
        - 4 witness statements (2 corroborating, 1 partially corroborating,
          1 with limited observational opportunity)
        - Email evidence supporting January 25 informal complaint
        - Attendance records confirming after-hours patterns
        - Prior written warning for similar behavior (Aug 2023)

        KEY FINDINGS:
        1. Pattern of behavior: Prior warning + current complaint within 24 months
        2. Corroborated: 2 of 4 witnesses directly observed incidents
        3. Documentary support: Email and attendance records align with timeline
        4. Policy trigger: Section 4.3.2 — repeated offense within 24 months

        RECOMMENDED ACTION:
        Based on corroborated evidence and policy Section 4.3.2,
        recommend minimum 5-day suspension without pay and mandatory
        sensitivity training. If respondent is in a supervisory role,
        recommend reassignment of complainant to different reporting line.

        FORWARD TO: Legal Department for review before action."
```

### Technical: HR Claims Plugin
```python
schemas = [
    DocumentSchema("complaint_form", fields=[
        "complainant_name", "respondent_name", "date_filed",
        "allegation_type", "description", "witnesses_named",
        "desired_outcome", "department"
    ]),
    DocumentSchema("witness_statement", fields=[
        "witness_name", "date_of_statement", "relationship_to_parties",
        "observations", "dates_of_incidents", "direct_quotes",
        "shift_schedule"
    ]),
    DocumentSchema("employee_file", fields=[
        "employee_name", "position", "hire_date", "department",
        "supervisor", "performance_reviews", "prior_complaints",
        "prior_warnings", "disciplinary_history"
    ]),
    DocumentSchema("company_policy", fields=[
        "policy_name", "version", "effective_date", "sections",
        "definitions", "procedures", "consequences", "escalation_path"
    ]),
    DocumentSchema("evidence_bundle", fields=[
        "evidence_type", "date_range", "parties_involved",
        "key_communications", "attachments"
    ]),
]

tools = [
    "build_event_timeline"          → Reconstruct chronological timeline from all docs
    "compare_witness_statements"    → Identify agreements, discrepancies, gaps
    "search_employee_history"       → Check for prior complaints, warnings, patterns
    "check_policy_compliance"       → Map findings to specific policy sections
    "generate_investigation_report" → Structured report for legal review
]

guardrails = [
    "Never draw conclusions about guilt — use 'substantiated' or 'unsubstantiated'",
    "Always note when witness has limited observational opportunity",
    "Flag prior complaints/warnings against respondent as HIGH severity",
    "Reference specific policy sections for any recommended action",
    "Maintain confidentiality — never name parties to unauthorized callers",
    "Always recommend legal review before any disciplinary action"
]
```

---

## 5. Cross-Plugin Comparison

### What's Universal (Platform Level)
Every plugin gets these for free from the DocuVoice platform:

| Capability | How It Works |
|---|---|
| **Document upload + processing** | S3 presigned → Textract → Schema mapper → Context builder |
| **Voice conversation** | Click orb or press Space → Nova Sonic 2 speech-to-speech |
| **Phone access** | Dial workspace number → SIP → LiveKit → Agent |
| **Real-time transcript** | Live streaming, timestamped, with doc references |
| **Finding detection** | Severity-colored cards slide in as agent discovers issues |
| **Extracted fields** | Key-value display with anomaly highlights |
| **Session recording** | Full transcript + findings stored per session |
| **Export** | PDF/Markdown reports from any session |

### What's Unique Per Plugin

| Feature | Insurance Claims | Legal Review | Financial DD | HR Claims |
|---|---|---|---|---|
| **Primary user** | Claims adjuster | Paralegal / In-house counsel | PE/VC associate | HR investigator |
| **Documents** | FNOL, Policy, Medical, Police | MSA, Amendments, NDA, Playbook | P&L, Balance Sheet, Audit, Cap Table | Complaint, Witness, Policy, Employee File |
| **Key tool** | `compare_fields` | `compare_against_playbook` | `cross_reference_financials` | `build_event_timeline` |
| **Killer finding** | Passenger count mismatch | Non-standard indemnification | Revenue discrepancy across sources | Prior warning pattern |
| **Time saved** | 30 min → 5 min per claim | 2 hrs → 15 min per contract | 60 hrs → 6 hrs per target | 12 hrs → 2 hrs per case |
| **Phone use case** | Supervisor checks exposure | Attorney gets quick answers | Partner asks about metrics | Legal counsel reviews findings |
| **Guardrails** | Don't disclose limits to claimants | Frame as observations, not legal advice | No investment advice | Never conclude guilt |
| **Export format** | Adjuster notes | Redline summary memo | IC memo | Investigation report |

### Voice AI Integration Points (How Voice Makes Each Better)

1. **Hands-Free Access**: Insurance adjuster reviewing while driving to site. Attorney in a taxi before a meeting. HR manager walking between offices.

2. **Faster Than Reading**: Asking "What are the BI limits?" takes 3 seconds. Searching through a 30-page policy takes 3 minutes.

3. **Cross-Document Intelligence**: Voice naturally asks comparative questions ("Are these numbers consistent?") that would require multiple browser tabs and manual comparison.

4. **Real-Time Discovery**: Findings appear AS you talk, not after you read 200 pages. The agent surfaces what matters while you're still in flow.

5. **Institutional Memory**: Every session is recorded. New team members can listen to how senior reviewers work. Findings persist across sessions.

6. **Phone Bridge**: Anyone with the phone number can query the workspace. No app download, no login, no learning curve. Just call and ask.

---

## Appendix: Demo Script for Hackathon Video (3 min)

```
[0:00-0:20] HOOK
"What if you could talk to your documents and they'd tell you
 what you're missing? That's DocuVoice."

[0:20-0:50] UPLOAD
Show: Drag 4 insurance claim PDFs into workspace
Show: Processing animation → fields extracted → "Ready"

[0:50-1:30] VOICE CONVERSATION
Click orb → "Give me a summary of this claim"
Agent responds with policy details
"Any discrepancies?" → Agent finds passenger count mismatch
Finding card slides in (red, animated)

[1:30-2:00] TOOL CALLS
"Calculate exposure" → Agent runs tool → exposure finding appears
"Generate adjuster notes" → Structured summary generated

[2:00-2:30] PHONE DEMO
Show: Dial workspace phone number on iPhone
Agent answers: "You've reached the workspace for claim AUT-2024-789..."
Ask about exposure → Agent answers from same context

[2:30-2:50] MULTI-DOMAIN
Quick flash: Legal Review workspace, Financial DD workspace, HR workspace
"Same platform. Different intelligence. Upload, talk, discover."

[2:50-3:00] CLOSE
"DocuVoice. Your documents have answers. Just ask."
[Show GitHub link + "Built with Amazon Nova Sonic 2 + LiveKit"]
```