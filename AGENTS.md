# Architecture rules
- Keep user-specific fallback attribution in `sales_attribution_settings` and aggregate it separately in `useSalesAttribution`; this applies to historical and future sales without mutating source UTMs or Meta conversion events.
- Add manual fallback metrics only at campaign/account reporting level after hierarchy rollup; this avoids inventing attribution to ad sets or ads.
- Test attribution eligibility with `bun test src/lib/trafficAttribution.test.ts`; business rules must remain independently verifiable.