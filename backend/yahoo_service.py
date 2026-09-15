


import os

import pandas as pd
import yfinance as yf

from save_bucket import (
    gcs_file_exists,
    get_json_from_gcs,
    save_json_to_gcs
)


CSV_FILE = "nifty500_raw.csv"


def get_symbol_from_isin(isin: str):
    """
    Find NSE symbol using ISIN from nifty500_raw.csv.

    CSV columns expected:

    Company Name,Industry,Symbol,Series,ISIN Code
    """

    if not os.path.exists(CSV_FILE):
        raise Exception(
            f"{CSV_FILE} not found"
        )

    df = pd.read_csv(CSV_FILE)

    # Remove spaces from column names
    df.columns = df.columns.str.strip()

    # Validate required columns
    required_columns = [
        "Symbol",
        "ISIN Code"
    ]

    for column in required_columns:

        if column not in df.columns:
            raise Exception(
                f"Required column '{column}' "
                f"not found in {CSV_FILE}"
            )

    # Clean ISIN values
    df["ISIN Code"] = (
        df["ISIN Code"]
        .astype(str)
        .str.strip()
        .str.upper()
    )

    isin = isin.strip().upper()

    row = df[
        df["ISIN Code"] == isin
    ]

    if row.empty:
        return None

    symbol = row.iloc[0]["Symbol"]

    return str(symbol).strip()


def dataframe_to_json(df):
    """
    Convert Yahoo Finance DataFrame into JSON-compatible list.
    """

    if df.empty:
        return []

    df = df.reset_index()

    # Convert datetime columns to strings
    for column in df.columns:

        if pd.api.types.is_datetime64_any_dtype(
            df[column]
        ):
            df[column] = df[column].astype(str)

    # Replace NaN / NaT with None
    df = df.where(
        pd.notnull(df),
        None
    )

    return df.to_dict(
        orient="records"
    )


def get_market_data(
    isin: str,
    bucket_name: str,
    force_refresh: bool = False
):
    """
    Get market data for an ISIN.

    Normal request:
        /market/{isin}

        1. Check GCS
        2. If present -> return GCS
        3. If not present -> Yahoo Finance
        4. Save Yahoo data to GCS
        5. Return data

    Force refresh:
        /market/{isin}/new

        1. Ignore GCS
        2. Yahoo Finance
        3. Overwrite GCS
        4. Return fresh data
    """

    # ---------------------------------------------------------
    # 1. Find symbol from ISIN
    # ---------------------------------------------------------

    symbol = get_symbol_from_isin(isin)

    if not symbol:

        raise Exception(
            f"ISIN not found in {CSV_FILE}: {isin}"
        )

    # Yahoo Finance NSE ticker
    yahoo_symbol = f"{symbol}.NS"

    # ---------------------------------------------------------
    # 2. GCS file
    # ---------------------------------------------------------

    blob_name = f"{isin}/marketdata.json"

    # ---------------------------------------------------------
    # 3. Normal request
    #
    # Use GCS if file exists.
    #
    # force_refresh=True skips this section.
    # ---------------------------------------------------------

    if not force_refresh:

        if gcs_file_exists(
            bucket_name,
            blob_name
        ):

            print(
                f"Loading market data from GCS: "
                f"{blob_name}"
            )

            return get_json_from_gcs(
                bucket_name,
                blob_name
            )

    # ---------------------------------------------------------
    # 4. Fetch fresh data from Yahoo Finance
    # ---------------------------------------------------------

    print(
        f"Fetching market data from Yahoo Finance: "
        f"{yahoo_symbol}"
    )

    stock = yf.Ticker(
        yahoo_symbol
    )

    # ---------------------------------------------------------
    # Last 30 days
    # ---------------------------------------------------------

    data_30d = stock.history(
        period="30d",
        interval="1d",
        auto_adjust=False
    )

    # ---------------------------------------------------------
    # Last 3 months
    # ---------------------------------------------------------

    data_3m = stock.history(
        period="3mo",
        interval="1d",
        auto_adjust=False
    )

    # ---------------------------------------------------------
    # Last 1 year
    # ---------------------------------------------------------

    data_1y = stock.history(
        period="1y",
        interval="1d",
        auto_adjust=False
    )

    # ---------------------------------------------------------
    # Maximum available history
    # ---------------------------------------------------------

    data_max = stock.history(
        period="max",
        interval="1d",
        auto_adjust=False
    )

    # ---------------------------------------------------------
    # 5. Create response
    # ---------------------------------------------------------

    result = {

        "isin": isin,

        "symbol": symbol,

        "yahoo_symbol": yahoo_symbol,

        "30d": dataframe_to_json(
            data_30d
        ),

        "3_months": dataframe_to_json(
            data_3m
        ),

        "1_year": dataframe_to_json(
            data_1y
        ),

        "max": dataframe_to_json(
            data_max
        )
    }

    # ---------------------------------------------------------
    # 6. Save to GCS
    #
    # This creates OR overwrites:
    #
    # {isin}/marketdata.json
    # ---------------------------------------------------------

    print(
        f"Saving market data to GCS: "
        f"{blob_name}"
    )

    save_json_to_gcs(
        data=result,
        bucket_name=bucket_name,
        blob_name=blob_name
    )

    # ---------------------------------------------------------
    # 7. Return data
    # ---------------------------------------------------------

    return result