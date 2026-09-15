# Stock API Response — Frontend Integration Guide

## 1. Purpose

This document explains the structure of the Stock API response and how the frontend should use each section to build the stock/company dashboard.

The API returns data for a single company identified by its **ISIN**.

Example:

```json
{
  "isin": "INE039A01010",
  ...
}
```

The response is divided into the following major sections:

1. `profile`
2. `balance_sheet`
3. `cash_flow`
4. `income_statement`
5. `share_holdings`
6. `key_ratios`
7. `corporate_actions`
8. `competitors`
9. `marketdata`

---

# 2. High-Level Response Structure

```text
API Response
│
├── isin
│
├── profile
│   └── company information
│
├── balance_sheet
│   ├── summary history
│   └── full statement
│
├── cash_flow
│   ├── cash-flow categories
│   └── full statement
│
├── income_statement
│   ├── key income metrics
│   └── full statement
│
├── share_holdings
│
├── key_ratios
│
├── corporate_actions
│
├── competitors
│
└── marketdata
    ├── 30d
    ├── 3_months
    └── other available market-data periods
```

The frontend should treat each top-level section as an independent dashboard module.

---

# 3. Common `status` Handling

Several API sections contain:

```json
{
  "status": "success",
  "data": ...
}
```

The frontend should **not assume that every section is always available**.

Recommended handling:

```text
status = "success"
    → render the section

status != "success"
    → show an appropriate unavailable/error state
```

For example:

```javascript
if (response.balance_sheet.status === "success") {
    renderBalanceSheet(response.balance_sheet.data);
} else {
    renderUnavailable("Balance Sheet");
}
```

Do not make the entire dashboard fail if one section is unavailable.

---

# 4. `isin`

Example:

```json
"isin": "INE039A01010"
```

## Meaning

The ISIN uniquely identifies the security.

## Frontend usage

Use this as the primary security identifier.

Possible uses:

- API requests
- Routing
- Internal state
- Stock lookup
- Navigation between companies

Example:

```text
/company/INE039A01010
```

The frontend should not use the company name as the unique identifier.

---

# 5. Profile

Structure:

```json
"profile": {
  "status": "success",
  "data": {
    "company_profile": "...",
    "sector": "Finance",
    "sector_market_cap_inr": {
      "value": 22179.6,
      "unit": "crore",
      "formatted": "22,179.60 Cr"
    },
    "sector_market_cap_usd": {
      "value": 2.46,
      "unit": "billion",
      "formatted": "$2.46B"
    }
  }
}
```

The profile section contains basic company information and sector information.

## Fields

### `company_profile`

Long-form textual description of the company.

Frontend:

```text
Company Overview
----------------
IFCI Limited is a non-banking financial company...
```

Recommended UI:

- Company Overview card
- Expand/collapse if the description is long

---

### `sector`

Example:

```json
"sector": "Finance"
```

Display as:

```text
Sector: Finance
```

Recommended UI:

- Badge
- Tag
- Company information card

---

### `sector_market_cap_inr`

Example:

```json
{
  "value": 22179.6,
  "unit": "crore",
  "formatted": "22,179.60 Cr"
}
```

There are two representations:

### `value`

Raw numerical value.

Use this for:

- Calculations
- Charts
- Sorting

### `formatted`

Human-readable value.

Use this when directly displaying the value.

Example:

```text
Sector Market Cap
₹22,179.60 Cr
```

The frontend should prefer `formatted` for display and `value` for calculations.

---

### `sector_market_cap_usd`

Same concept as INR market cap but represented in USD.

Example:

```text
$2.46B
```

---

# 6. Balance Sheet

Structure:

```json
"balance_sheet": {
  "status": "success",
  "data": {
    "type": "consolidated",
    "time_period": "yearly",
    "units_in": "crore",
    "history": [],
    "full_statement": []
  }
}
```

The current response contains consolidated yearly balance-sheet data with values in crore.

---

## 6.1 Metadata

### `type`

Example:

```json
"type": "consolidated"
```

This tells the frontend whether the financial statement is consolidated or standalone.

Display if required:

```text
Consolidated
```

---

### `time_period`

Example:

```json
"time_period": "yearly"
```

Possible frontend interpretation:

```text
Yearly
```

---

### `units_in`

Example:

```json
"units_in": "crore"
```

All numerical financial values in this section should be interpreted using this unit.

The frontend should display this prominently:

```text
Values in ₹ Crore
```

---

# 7. Balance Sheet — Summary History

Example:

```json
"history": [
  {
    "total_asset": 26570.37,
    "total_liability": 11065.84,
    "period": "Mar 2026"
  },
  {
    "total_asset": 25723.77,
    "total_liability": 10644.6,
    "period": "Mar 2025"
  }
]
```

This structure is ideal for a summary chart.

## Recommended frontend chart

### Assets vs Liabilities

```text
₹ Crore

30K |                    Assets
25K |              █████ █████
20K |        █████ █████ █████
15K |  █████ █████
10K |  █████ Liabilities
 5K |  █████ █████
    +----------------------------
       2023   2024   2025   2026
```

Recommended chart:

- X-axis → `period`
- Series 1 → `total_asset`
- Series 2 → `total_liability`

---

# 8. Balance Sheet — Full Statement

Example:

```json
"full_statement": [
  {
    "particular": "Non-Current Assets",
    "history": [
      {
        "value": 17760.5,
        "period": "Mar 2026"
      }
    ]
  }
]
```

The API provides individual balance-sheet line items such as:

- Non-Current Assets
- Current Assets
- Total Assets
- Current Liabilities
- Net Current Asset
- Non-Current Liabilities
- Equity Capital
- Total Equity & Liabilities

These items use the same `history` structure.

---

## Recommended frontend component

Use a table:

| Particular | Mar 2026 | Mar 2025 | Mar 2024 | Mar 2023 |
|---|---:|---:|---:|---:|
| Non-Current Assets | 17,760.50 | 18,406.57 | 11,787.56 | 11,813.03 |
| Current Assets | 8,809.87 | 7,317.20 | 7,130.01 | 5,125.72 |
| Total Assets | ... | ... | ... | ... |

The frontend should dynamically generate rows from:

```javascript
data.full_statement
```

Do **not hard-code the number of years**.

---

# 9. Cash Flow

Structure:

```json
"cash_flow": {
  "status": "success",
  "data": {
    "type": "consolidated",
    "time_period": "yearly",
    "units_in": "crore",
    "cash_flow": [],
    "full_statement": []
  }
}
```

The response contains operating, investing and financing cash flows.

---

# 10. Cash Flow Categories

The API provides categories such as:

```text
operating
investing
financing
```

Each category contains:

```json
{
  "category": "operating",
  "history": [
    {
      "value": 279.73,
      "period": "Mar 2026",
      "change": "+128.44%"
    }
  ]
}
```

## Important fields

### `value`

Actual cash flow value.

### `period`

Financial period.

### `change`

Percentage change compared with the previous period.

Example:

```text
Operating Cash Flow
₹279.73 Cr
+128.44%
```

If `change` is missing, do not calculate or display a change value unless the frontend explicitly calculates it.

---

# 11. Cash Flow Full Statement

The `full_statement` contains more detailed line items.

Examples include:

- Profit before tax
- Income before WC changes
- Change in Assets
- Change in Liabilities
- Change in WC
- Cash flow from Operations
- Cash flow from Investing
- Cash flow from Financing
- Total Cash Flow
- Cash at Start of Year
- Cash at End of Year

The API uses:

```json
{
  "particular": "Cash flow from Operations",
  "history": [
    {
      "value": 279.73,
      "period": "Mar 2026"
    }
  ]
}
```

This should be rendered dynamically as a financial statement table.

---

# 12. Income Statement

Structure:

```json
"income_statement": {
  "status": "success",
  "data": {
    "type": "consolidated",
    "time_period": "yearly",
    "units_in": "crore",
    "income_statement": [],
    "full_statement": []
  }
}
```

---

# 13. Income Statement — Key Metrics

The API provides categories such as:

```text
revenue
operating_profit
net_profit
```

Example:

```json
{
  "category": "net_profit",
  "history": [
    {
      "value": 434.71,
      "period": "Mar 2026",
      "change": "+24.7%"
    }
  ]
}
```

The API provides historical values and percentage changes for these summary metrics.

---

## Recommended frontend

Create a summary section:

```text
Financial Performance

Revenue
₹2,068.84 Cr
+2.49%

Operating Profit
₹524.21 Cr
-30.01%

Net Profit
₹434.71 Cr
+24.70%
```

And provide a chart:

```text
Revenue / Operating Profit / Net Profit
                    ┌────────────
                ┌───┘
            ┌───┘
        ┌───┘
────┬───┴────────────────────────
2023   2024   2025   2026
```

---

# 14. Income Statement — Full Statement

The detailed statement contains items such as:

- Revenue
- Other Income
- Total Revenue
- Total Expenses
- Profit Before Tax
- Tax
- Profit After Tax
- EPS - Basic
- EPS - Diluted

For example:

```json
{
  "particular": "Profit After Tax",
  "history": [
    {
      "value": 434.71,
      "period": "Mar 2026"
    },
    {
      "value": 348.61,
      "period": "Mar 2025"
    }
  ]
}
```



The frontend should render this as a dynamically generated financial table.

---

# 15. Share Holdings

Structure:

```json
"share_holdings": {
  "status": "success",
  "data": [
    {
      "category": "promoters",
      "history": [
        {
          "value": 72.57,
          "period": "Jun 2026"
        }
      ]
    }
  ]
}
```

The value represents the percentage holding for the specified category and period.

The response contains categories such as:

- `promoters`
- `fii`
- `other_dii`
- `retail_and_other`
- `mutual_funds`



---

# 16. Shareholding UI

Recommended visualization:

## Shareholding Distribution

Use a pie/donut chart for the latest available period.

Example:

```text
Promoters          72.57%
FII                 3.51%
DII                 1.51%
Retail & Other     22.26%
Mutual Funds        0.15%
```

---

## Shareholding Trend

Also provide a historical chart.

Example:

```text
Promoter Holding %

75% ┤
73% ┤────────────────────
71% ┤
    └────────────────────
     Sep'25 Dec'25 Mar'26 Jun'26
```

Use:

```javascript
category.history
```

to generate the chart.

---

# 17. Key Ratios

Structure:

```json
"key_ratios": {
  "status": "success",
  "data": [
    {
      "name": "P/E",
      "company_value": "51.13",
      "sector_value": "28.77"
    }
  ]
}
```

The API currently provides:

- P/E
- P/B
- ROA
- ROE
- ROCE
- Quick Ratio
- EV/EBITDA



---

# 18. Ratio Comparison UI

This section is specifically useful for comparing the company against its sector.

Recommended table:

| Ratio | Company | Sector |
|---|---:|---:|
| P/E | 51.13 | 28.77 |
| P/B | 2.48 | 1.64 |
| ROA | 1.63% | -2.41% |
| ROE | 2.02% | 8.79% |
| ROCE | 7.12% | 7.15% |
| Quick Ratio | 1.34 | 3.59 |
| EV/EBITDA | 18.27 | 37441.68 |

Do not assume all values are percentages.

For example:

```text
P/E       → number
P/B       → number
ROA       → percentage
ROE       → percentage
ROCE      → percentage
Quick Ratio → number
EV/EBITDA → number
```

The frontend should use the value exactly as supplied, unless a separate formatting rule is defined.

---

# 19. Corporate Actions

Structure:

```json
"corporate_actions": {
  "status": "success",
  "data": []
}
```

`data` is an array.

In the current example it is empty.

The frontend should support both:

### Data available

```text
Corporate Actions
-----------------
Dividend
Bonus
Split
...
```

### No data

```text
No corporate actions available
```

Do not treat an empty array as an API error.

---

# 20. Competitors

Structure:

```json
"competitors": {
  "status": "success",
  "data": [
    {
      "company_profile": "...",
      "sector": "Finance",
      "sector_market_cap_inr": {
        "value": 643888.19,
        "unit": "crore",
        "formatted": "643,888.19 Cr"
      },
      "sector_market_cap_usd": {
        "value": 71.54,
        "unit": "billion",
        "formatted": "$71.54B"
      },
      "instrument_key": "NSE_EQ|INE296A01032"
    }
  ]
}
```

The response contains multiple competitor companies.

---

# 21. Competitor Card

Recommended UI:

```text
Competitors

┌─────────────────────────────────────┐
│ Bajaj Finance                       │
│ Finance                             │
│                                     │
│ Market Cap: ₹643,888.19 Cr          │
│                                     │
│ [View Company]                      │
└─────────────────────────────────────┘
```

The frontend should use `instrument_key` as the identifier for the competitor.

Example:

```text
NSE_EQ|INE296A01032
```

Do not use the company description as the identifier.

---

# 22. Market Data

Structure:

```json
"marketdata": {
  "isin": "INE039A01010",
  "symbol": "IFCI",
  "yahoo_symbol": "IFCI.NS",
  "30d": [],
  "3_months": []
}
```

The market-data section contains historical OHLCV data.

The response includes fields such as:

```json
{
  "Date": "2026-09-15 00:00:00+05:30",
  "Open": 83,
  "High": 83.98,
  "Low": 76.34,
  "Close": 77.09,
  "Adj Close": 77.09,
  "Volume": 81000299,
  "Dividends": 0,
  "Stock Splits": 0
}
```



---

# 23. Market Data Fields

| Field | Meaning | Frontend usage |
|---|---|---|
| `Date` | Trading date/time | X-axis |
| `Open` | Opening price | OHLC chart |
| `High` | Highest price | OHLC chart |
| `Low` | Lowest price | OHLC chart |
| `Close` | Closing price | Price chart |
| `Adj Close` | Adjusted closing price | Performance calculations |
| `Volume` | Trading volume | Volume chart |
| `Dividends` | Dividend amount | Corporate event/adjustment |
| `Stock Splits` | Split information | Corporate event/adjustment |

---

# 24. Market Data Periods

The response contains different time-period arrays.

Example:

```json
"30d": [...]
```

and:

```json
"3_months": [...]
```

The frontend should treat these as separate datasets.

Recommended UI:

```text
Price Chart

[ 30D ] [ 3M ] [ 6M ] [ 1Y ] [ 5Y ] [ MAX ]
```

When the user selects a period, the frontend should use the corresponding API array.

Do not assume every period will always exist.

---

# 25. Price Chart

The primary stock chart should use:

```text
Date
Close
```

For a simple line chart:

```javascript
data.map(item => ({
    x: item.Date,
    y: item.Close
}));
```

For a candlestick chart:

```javascript
{
    time: item.Date,
    open: item.Open,
    high: item.High,
    low: item.Low,
    close: item.Close
}
```

---

# 26. Volume Chart

Volume can be displayed below the price chart.

Use:

```javascript
item.Volume
```

Example:

```text
Price
100 ┤             ╭──╮
 90 ┤        ╭────╯  ╰─
 80 ┤───────╯
    └────────────────────

Volume
    ▂ ▃ ▅ ▂ ▇ █ ▆ ▃
```

---

# 27. Recommended Dashboard Layout

The complete response can be represented in the frontend as follows:

```text
┌─────────────────────────────────────────────────────┐
│ COMPANY HEADER                                       │
│                                                     │
│ IFCI                         Sector: Finance        │
│ ISIN: INE039A01010                                  │
│                                                     │
│ Company Description                                 │
└─────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────┐
│ MARKET DATA                                         │
│                                                     │
│ Current Price     52W High      52W Low             │
│                                                     │
│ ┌───────────────────────────────────────────────┐   │
│ │                                               │   │
│ │               PRICE CHART                     │   │
│ │                                               │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ [30D] [3M] [6M] [1Y] [5Y]                           │
└─────────────────────────────────────────────────────┘


┌──────────────────────────┐  ┌───────────────────────┐
│ INCOME STATEMENT         │  │ BALANCE SHEET         │
│                          │  │                       │
│ Revenue                  │  │ Total Assets          │
│ Operating Profit        │  │ Total Liabilities     │
│ Net Profit              │  │ Equity                │
│                          │  │                       │
│       Chart              │  │       Chart           │
└──────────────────────────┘  └───────────────────────┘


┌─────────────────────────────────────────────────────┐
│ CASH FLOW                                            │
│                                                     │
│ Operating | Investing | Financing                  │
│                                                     │
│               Cash Flow Chart                       │
└─────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────┐
│ SHAREHOLDING                                        │
│                                                     │
│          Donut Chart                                │
│                                                     │
│ Promoters | FII | DII | Retail | Mutual Funds     │
│                                                     │
│ Historical Shareholding Trend                       │
└─────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────┐
│ KEY RATIOS                                          │
│                                                     │
│ Ratio             Company             Sector       │
│ P/E               51.13               28.77        │
│ P/B                2.48                1.64        │
│ ROE                2.02%               8.79%       │
│ ROCE               7.12%               7.15%       │
└─────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────┐
│ COMPETITORS                                         │
│                                                     │
│ [Bajaj Finance] [Bajaj Finserv] [Shriram Finance] │
│ [Cholamandalam]  [Tata Capital]  [...]            │
└─────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────┐
│ CORPORATE ACTIONS                                   │
│                                                     │
│ No corporate actions available                     │
└─────────────────────────────────────────────────────┘
```

---

# 28. Important Frontend Rules

## Rule 1 — Do not hard-code financial years

The API currently returns years such as:

```text
Mar 2026
Mar 2025
Mar 2024
Mar 2023
```

But this can change as new financial data becomes available.

Always generate the years dynamically from:

```javascript
history[].period
```

---

## Rule 2 — Do not assume a fixed number of history records

Today there may be four years.

Tomorrow there could be five or ten.

Therefore:

```javascript
history.map(...)
```

should be used instead of assuming:

```javascript
history[0]
history[1]
history[2]
history[3]
```

---

## Rule 3 — Handle missing values

Some API records may not contain every field.

For example:

```json
{
  "period": "Mar 2026"
}
```

with no `value`.

The frontend should render:

```text
—
```

instead of:

```text
undefined
```

or:

```text
NaN
```

---

# 29. Numeric Values vs Formatted Values

Some objects contain both:

```json
"value": 22179.6,
"formatted": "22,179.60 Cr"
```

Use:

### `value`

For:

- calculations
- sorting
- charts
- comparisons
- filters

### `formatted`

For:

- display
- cards
- tables
- tooltips

Example:

```javascript
// Calculation
const marketCap = data.value;

// Display
const marketCapText = data.formatted;
```

---

# 30. Negative Values

Financial data can legitimately contain negative numbers.

Example:

```json
"value": -983.74
```

Do not hide or convert negative values to zero.

Recommended display:

```text
-₹983.74 Cr
```

or:

```text
-983.74 Cr
```

depending on the application's currency-formatting convention.

---

# 31. Percentage Changes

Some records contain:

```json
"change": "+24.7%"
```

The `change` field should be displayed as supplied.

For example:

```text
Net Profit
₹434.71 Cr
+24.70%
```

If `change` does not exist for a record, simply don't show a change indicator.

---

# 32. Status and Empty Arrays

These two cases are different:

### API failure

```json
{
  "status": "failed",
  "data": null
}
```

Show an error/unavailable state.

### Successful empty result

```json
{
  "status": "success",
  "data": []
}
```

Show:

```text
No data available
```

Do not show an API error.

This is particularly important for:

```text
corporate_actions
```

where the current response successfully returns an empty array.

---

# 33. Recommended Frontend Data Model

The frontend can internally normalize the response into:

```javascript
const stock = {
    identity: {
        isin: response.isin
    },

    profile: response.profile,

    balanceSheet: response.balance_sheet,

    cashFlow: response.cash_flow,

    incomeStatement: response.income_statement,

    shareHoldings: response.share_holdings,

    ratios: response.key_ratios,

    corporateActions: response.corporate_actions,

    competitors: response.competitors,

    marketData: response.marketdata
};
```

This keeps frontend naming consistent and avoids repeatedly accessing the raw API structure.

---

# 34. Suggested Dashboard Tabs

For a cleaner UI, the information can be divided into tabs:

```text
Overview
Financials
Shareholding
Valuation
Market Data
Competitors
Corporate Actions
```

### Overview

Show:

- Company profile
- Sector
- Market cap information
- Latest price
- Quick financial summary

### Financials

Show:

- Income Statement
- Balance Sheet
- Cash Flow

### Shareholding

Show:

- Promoter holding
- FII
- DII
- Retail
- Mutual funds
- Historical trend

### Valuation

Show:

- P/E
- P/B
- ROA
- ROE
- ROCE
- Quick Ratio
- EV/EBITDA
- Company vs Sector comparison

### Market Data

Show:

- Price chart
- OHLC
- Volume
- Historical periods

### Competitors

Show:

- Competitor cards
- Sector
- Market capitalization
- Navigation to competitor

### Corporate Actions

Show:

- Dividends
- Splits
- Other corporate actions when available

---

# 35. Dynamic Rendering Principle

The API is designed so that many sections can be rendered generically.

For example, for financial statements:

```javascript
data.full_statement.map(statement => {
    return {
        label: statement.particular,
        history: statement.history
    };
});
```

This means the frontend does not need to know every possible financial line item beforehand.

If the backend adds:

```text
Gross Profit
EBITDA
Other Expenses
...
```

the frontend can render them automatically.

---

# 36. API Response Contract Summary

| Section | Main Purpose | Recommended UI |
|---|---|---|
| `isin` | Security identifier | Internal ID |
| `profile` | Company information | Header / Overview |
| `balance_sheet` | Assets, liabilities, equity | Table + charts |
| `cash_flow` | Cash movement | Chart + table |
| `income_statement` | Revenue and profitability | Cards + charts |
| `share_holdings` | Ownership distribution | Donut + trend |
| `key_ratios` | Valuation / financial ratios | Comparison table |
| `corporate_actions` | Dividends/splits/etc. | Timeline/table |
| `competitors` | Comparable companies | Cards/table |
| `marketdata` | Historical stock price | Candlestick/line + volume |

---

# 37. Important Implementation Principle

The frontend should be **data-driven rather than field-driven**.

Avoid code like:

```javascript
render("Revenue");
render("Operating Profit");
render("Net Profit");
```

Prefer:

```javascript
response.income_statement.data.income_statement.map(metric => {
    renderMetric(metric);
});
```

Similarly, for financial statements:

```javascript
response.balance_sheet.data.full_statement.map(item => {
    renderFinancialRow(item);
});
```

This makes the dashboard resilient when the backend adds new financial metrics.

---

# 38. Final Dashboard Flow

The intended frontend flow is:

```text
User searches company
        ↓
Frontend gets ISIN
        ↓
Frontend calls Stock API
        ↓
API returns complete company payload
        ↓
Frontend validates section status
        ↓
Frontend renders:
        │
        ├── Company Overview
        ├── Market Data
        ├── Financials
        │     ├── Income Statement
        │     ├── Balance Sheet
        │     └── Cash Flow
        ├── Shareholding
        ├── Key Ratios
        ├── Competitors
        └── Corporate Actions
```

The API response already separates these concerns into independent top-level sections, so the frontend should preserve this separation in its component architecture.