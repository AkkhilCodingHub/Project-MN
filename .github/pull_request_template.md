# Pull Request Template

## Description

Please include a summary of the change, the problem it solves, and any relevant context or motivation.

List any dependencies that are required for this change.

Fixes # (issue number)

## Type of Change

Please delete options that are not relevant.

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?

Please describe the tests that you ran to verify your changes. Provide instructions so we can reproduce. Please also list any relevant details for your test configuration.

- **Test A:** Verified local backend execution with GET/POST RAG query endpoints.
- **Test B:** Verified database constraint logic (e.g. Free Tier limit of 3 files, 10 queries/day).

### Test Configuration

- **Rust Version:** 1.82+
- **Database:** Supabase Postgres (Free Tier)
- **Vector Store:** Pinecone (768 dimensions, Starter Tier)
- **LLM API:** Google Gemini 1.5 Flash (Free Tier)
- **Billing API:** Razorpay (Pro Tier webhook integration)

## Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published in downstream modules
