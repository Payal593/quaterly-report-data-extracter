import csv
from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI, HTTPException, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import quote
from datetime import datetime, timedelta
import feedparser
import requests

GCS_BUCKET_NAME = "stockrawdata"

import math
def clean_nan(data):
    if isinstance(data, dict):
        return {
            key: clean_nan(value)
            for key, value in data.items()
        }

    elif isinstance(data, list):
        return [clean_nan(item) for item in data]

    elif isinstance(data, float):
        if not math.isfinite(data):
            return None

    return data

app = FastAPI(title="NIFTY 500 Companies API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

CSV_FILE = Path(__file__).with_name("nifty500_raw.csv")


@lru_cache(maxsize=1)
def load_companies():
    """Load the small, static company directory only once per worker."""
    with CSV_FILE.open(encoding="utf-8-sig", newline="") as csv_file:
        return tuple(csv.DictReader(csv_file))

##############################################################################

@app.get("/companies")
def get_companies(response: Response):
    if not CSV_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"{CSV_FILE} not found"
        )

    try:
        companies = load_companies()
        # The directory changes only when a new backend image is deployed.
        response.headers["Cache-Control"] = "public, max-age=86400, stale-while-revalidate=604800"

        return {
            "count": len(companies),
            "companies": companies
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading CSV: {str(e)}"
        )
##############################################################################
@app.get("/")
def get_health():
    try: 
        return "payal,api-proxy is healthy and running :) XD"
    except Exception as e:
        raise HTTPException(
            status_code=500,
            
        )

##############################################################################
##############################################################################
@app.get("/profile/{isin}")
def profile(isin: str):

    try:
        from upstox_service import get_profile

        return get_profile(
            isin=isin,
            bucket_name=GCS_BUCKET_NAME
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
##############################################################################
@app.get("/balance-sheet/{isin}")
def balance_sheet(isin: str):

    try:
        from upstox_service import get_balance_sheet

        return get_balance_sheet(
            isin=isin,
            bucket_name=GCS_BUCKET_NAME
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
##############################################################################

@app.get("/cash-flow/{isin}")
def cash_flow(isin: str):

    try:
        from upstox_service import get_cash_flow

        return get_cash_flow(
            isin=isin,
            bucket_name=GCS_BUCKET_NAME
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
##############################################################################
@app.get("/income-statement/{isin}")
def income_statement(isin: str):

    try:
        from upstox_service import get_income_statement

        return get_income_statement(
            isin=isin,
            bucket_name=GCS_BUCKET_NAME
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
##############################################################################
@app.get("/share-holdings/{isin}")
def share_holdings(isin: str):

    try:
        from upstox_service import get_share_holdings

        return get_share_holdings(
            isin=isin,
            bucket_name=GCS_BUCKET_NAME
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
##############################################################################
@app.get("/key-ratios/{isin}")
def key_ratios(isin: str):

    try:
        from upstox_service import get_key_ratios

        return get_key_ratios(
            isin=isin,
            bucket_name=GCS_BUCKET_NAME
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
##############################################################################

@app.get("/corporate-actions/{isin}")
def corporate_actions(isin: str):

    try:
        from upstox_service import get_corporate_actions

        return get_corporate_actions(
            isin=isin,
            bucket_name=GCS_BUCKET_NAME
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
##############################################################################

@app.get("/competitors/{isin}")
def competitors(isin: str):

    try:
        from upstox_service import get_competitors

        return get_competitors(
            isin=isin,
            bucket_name=GCS_BUCKET_NAME
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
##############################################################################

# ---------------------------------------------------------
# Force new data from Yahoo Finance
# ---------------------------------------------------------

@app.get("/market/{isin}/new")
def market_new(isin: str):

    try:
        from yahoo_service import get_market_data

        return get_market_data(
            isin=isin,
            bucket_name=GCS_BUCKET_NAME,
            force_refresh=True
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/market/{isin}")
def market(isin: str):
    try:
        from yahoo_service import get_market_data

        return get_market_data(isin,"stockrawdata")

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )



#########################################################################

@app.get("/get-data/{isin}")
def get_data(isin: str):

    try:
        from upstox_service import (
            get_balance_sheet,
            get_cash_flow,
            get_competitors,
            get_corporate_actions,
            get_income_statement,
            get_key_ratios,
            get_profile,
            get_share_holdings,
        )
        from yahoo_service import get_market_data

        profile = get_profile(
            isin,
            GCS_BUCKET_NAME
        )

        balance_sheet = get_balance_sheet(
            isin,
            GCS_BUCKET_NAME
        )

        cash_flow = get_cash_flow(
            isin,
            GCS_BUCKET_NAME
        )

        income_statement = get_income_statement(
            isin,
            GCS_BUCKET_NAME
        )

        share_holdings = get_share_holdings(
            isin,
            GCS_BUCKET_NAME
        )

        key_ratios = get_key_ratios(
            isin,
            GCS_BUCKET_NAME
        )

        corporate_actions = get_corporate_actions(
            isin,
            GCS_BUCKET_NAME
        )

        competitors = get_competitors(
            isin,
            GCS_BUCKET_NAME
        )
        marketdata=get_market_data(
            isin,
            GCS_BUCKET_NAME,
            force_refresh=True
        )

        response =  {
            "isin": isin,
            "profile": profile,
            "balance_sheet": balance_sheet,
            "cash_flow": cash_flow,
            "income_statement": income_statement,
            "share_holdings": share_holdings,
            "key_ratios": key_ratios,
            "corporate_actions": corporate_actions,
            "competitors": competitors,
            "marketdata": marketdata
        }
        return clean_nan(response)

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


##################################################################################################################################

def get_news(company_name, from_date, to_date):

    # Google News before: is exclusive.
    # Add one day so to_date is included.
    to_date_obj = datetime.strptime(to_date, "%Y-%m-%d")
    before_date = (to_date_obj + timedelta(days=1)).strftime("%Y-%m-%d")

    query = (
        f'"{company_name}" '
        f'after:{from_date} '
        f'before:{before_date}'
    )

    url = (
        "https://news.google.com/rss/search?"
        f"q={quote(query)}"
        "&hl=en-IN"
        "&gl=IN"
        "&ceid=IN:en"
    )

    response = requests.get(
        url,
        headers={
            "User-Agent": "Mozilla/5.0"
        },
        timeout=30
    )

    response.raise_for_status()

    feed = feedparser.parse(response.content)

    results = []

    for item in feed.entries:

        source = ""

        if "source" in item:
            source = item.source.get("title", "")

        results.append({
            "date": item.get("published", ""),
            "title": item.get("title", ""),
            "source": source,
            "summary": item.get("summary", ""),
            "link": item.get("link", "")
        })

    return results


@app.get("/founder-news")
def news(
    company_name: str = Query(..., description="Company name"),
    from_date: str = Query(..., description="Start date YYYY-MM-DD"),
    to_date: str = Query(..., description="End date YYYY-MM-DD")
):

    # Validate dates
    try:
        start = datetime.strptime(from_date, "%Y-%m-%d")
        end = datetime.strptime(to_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Dates must be in YYYY-MM-DD format"
        )

    if start > end:
        raise HTTPException(
            status_code=400,
            detail="from_date cannot be after to_date"
        )

    try:
        articles = get_news(
            company_name,
            from_date,
            to_date
        )

        return {
            "company": company_name,
            "from_date": from_date,
            "to_date": to_date,
            "count": len(articles),
            "articles": articles
        }

    except requests.RequestException as e:
        raise HTTPException(
            status_code=502,
            detail=f"Google News request failed: {str(e)}"
        )


