# Architecture rules
- Keep user-specific fallback attribution in `sales_attribution_settings` and aggregate it separately in `useSalesAttribution`; this applies to historical and future sales without mutating source UTMs or Meta conversion events.
- Add manual fallback metrics only at campaign/account reporting level after hierarchy rollup; this avoids inventing attribution to ad sets or ads.
- Test attribution eligibility with `bun test src/lib/trafficAttribution.test.ts`; business rules must remain independently verifiable.
- Always replace Meta financial metrics with webhook attribution, including zero results, through `campaignFinancials`; pixel conversions must not appear as actual sales.
- Bound Meta reporting requests with client timeouts and preserve loaded rows on failures; stable scalar dependencies avoid repeated auth/date refreshes and loading indicators must finish on failure.