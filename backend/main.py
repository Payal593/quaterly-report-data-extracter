from fastapi import FastAPI, HTTPException
import pandas as pd
import os

import requests

GCS_BUCKET_NAME = "stockrawdata"
from yahoo_service import get_market_data
from save_bucket import (
    gcs_file_exists,
    get_json_from_gcs,
    save_json_to_gcs
)
from upstox_service import(
    get_profile,
    get_balance_sheet,
    get_cash_flow,
    get_income_statement,
    get_share_holdings,
    get_key_ratios,
    get_corporate_actions,
    get_competitors,
    get_ohlc
)



app = FastAPI(title="NIFTY 500 Companies API")

CSV_FILE = "nifty500_raw.csv"

##############################################################################

@app.get("/companies")
def get_companies():
    if not os.path.exists(CSV_FILE):
        raise HTTPException(
            status_code=404,
            detail=f"{CSV_FILE} not found"
        )

    try:
        df = pd.read_csv(CSV_FILE)

        # Convert NaN values to None so JSON is valid
        df = df.where(pd.notnull(df), None)

        return {
            "count": len(df),
            "companies": df.to_dict(orient="records")
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
            GCS_BUCKET_NAME
        )

        return {
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

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
