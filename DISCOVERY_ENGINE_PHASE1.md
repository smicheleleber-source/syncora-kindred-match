# Discovery Engine Phase 1

## Goal

Move structured fact-gathering before matching occurs.

Current flow:

Vertical → Category → Case Details → Match → Connect → Parameters

New flow:

Vertical → Category → Discovery Questions → Match Brief → Match → Connect

## What stays the same

- Existing matchProviders() function remains unchanged.
- Existing Provider model remains unchanged.
- Existing MatchRequest model remains unchanged.
- Existing ConnectionParameter model remains unchanged for now.

## What changes

- Discovery questions appear before matching.
- User answers are converted into MatchRequest fields.
- A Match Brief is created before matching.
- The Match Brief is passed into the connection when the user clicks Connect.

## Phase 1 Legal MVP

For Family Law, ask:

1. What issue best describes your situation?
   - Custody
   - Divorce
   - Child Support
   - Contempt
   - Modification

2. Do you currently have a court order?
   - Yes
   - No

3. Do you have a court date?
   - Yes
   - No

4. What county is the case in?

5. Do you currently have an attorney?
   - Yes
   - No

6. What is your budget range?

## Match Brief Fields

- Category
- Subcategory
- Urgency
- Complexity
- Location
- Budget
- Court Order
- Court Date
- County
- Attorney Status
- Summary

## Implementation Notes

- Add discovery state to src/routes/index.tsx.
- Insert Discovery Questions inside Step 3 before submit.
- Convert answers into specialties/subcategories.
- Keep matchProviders() untouched.
- On connection creation, pass brief summary into clientNote.
