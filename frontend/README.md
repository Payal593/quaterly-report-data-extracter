# FinScope frontend

This Next.js app contains the FinScope homepage and company autocomplete search.

## Run locally

1. Open this folder: `cd frontend`
2. Install dependencies: `npm install`
3. Copy `.env.local.example` to `.env.local`
4. Start the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

The app fetches the `/companies` list when the search component loads and then
filters that list locally. Selecting a company logs the complete company object
and its ISIN to the browser console. A company details page is not included yet.
