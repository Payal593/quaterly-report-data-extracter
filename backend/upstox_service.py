import os
import requests
from save_bucket import (
    gcs_file_exists,
    get_json_from_gcs,
    save_json_to_gcs
)


UPSTOX_PROFILE_URL = "https://api.upstox.com/v2/fundamentals/{isin}/profile"


def get_profile(isin: str, bucket_name: str):

    blob_name = f"{isin}/profile.json"

    # 1. Check if profile already exists in GCS
    if gcs_file_exists(bucket_name, blob_name):
        return get_json_from_gcs(
            bucket_name,
            blob_name
        )

    # 2. File doesn't exist -> get Upstox token
    access_token = os.getenv("UPSTOX_ACCESS_TOKEN")

    if not access_token:
        raise Exception(
            "UPSTOX_ACCESS_TOKEN environment variable is not set"
        )

    # 3. Call Upstox
    url = UPSTOX_PROFILE_URL.format(isin=isin)

    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {access_token}"
    }

    response = requests.get(
        url,
        headers=headers,
        timeout=30
    )

    response.raise_for_status()

    profile = response.json()

    # 4. Save response to GCS
    save_json_to_gcs(
        data=profile,
        bucket_name=bucket_name,
        blob_name=blob_name
    )

    # 5. Return profile
    return profile

#########################################################################

def get_balance_sheet(isin: str, bucket_name: str):

    blob_name = f"{isin}/balance-sheet.json"

    # 1. Check if balance sheet already exists in GCS
    if gcs_file_exists(bucket_name, blob_name):
        return get_json_from_gcs(
            bucket_name,
            blob_name
        )

    # 2. Get Upstox token
    access_token = os.getenv("UPSTOX_ACCESS_TOKEN")

    if not access_token:
        raise Exception(
            "UPSTOX_ACCESS_TOKEN environment variable is not set"
        )

    # 3. Call Upstox
    url = f"https://api.upstox.com/v2/fundamentals/{isin}/balance-sheet"

    params = {
        "type": "consolidated",
        "fs": "true"
    }

    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {access_token}"
    }

    response = requests.get(
        url,
        params=params,
        headers=headers,
        timeout=30
    )

    response.raise_for_status()

    balance_sheet = response.json()

    # 4. Save response to GCS
    save_json_to_gcs(
        data=balance_sheet,
        bucket_name=bucket_name,
        blob_name=blob_name
    )

    # 5. Return data
    return balance_sheet

#########################################################################



def get_cash_flow(isin: str, bucket_name: str):

    blob_name = f"{isin}/cash-flow.json"

    # 1. Check if cash flow already exists in GCS
    if gcs_file_exists(bucket_name, blob_name):
        return get_json_from_gcs(
            bucket_name,
            blob_name
        )

    # 2. Get Upstox token
    access_token = os.getenv("UPSTOX_ACCESS_TOKEN")

    if not access_token:
        raise Exception(
            "UPSTOX_ACCESS_TOKEN environment variable is not set"
        )

    # 3. Call Upstox
    url = f"https://api.upstox.com/v2/fundamentals/{isin}/cash-flow"

    params = {
        "type": "consolidated",
        "fs": "true"
    }

    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {access_token}"
    }

    response = requests.get(
        url,
        params=params,
        headers=headers,
        timeout=30
    )

    response.raise_for_status()

    cash_flow = response.json()

    # 4. Save response to GCS
    save_json_to_gcs(
        data=cash_flow,
        bucket_name=bucket_name,
        blob_name=blob_name
    )

    # 5. Return data
    return cash_flow
#########################################################################
def get_income_statement(isin: str, bucket_name: str):

    blob_name = f"{isin}/income-statement.json"

    # 1. Check if income statement already exists in GCS
    if gcs_file_exists(bucket_name, blob_name):
        return get_json_from_gcs(
            bucket_name,
            blob_name
        )

    # 2. Get Upstox token
    access_token = os.getenv("UPSTOX_ACCESS_TOKEN")

    if not access_token:
        raise Exception(
            "UPSTOX_ACCESS_TOKEN environment variable is not set"
        )

    # 3. Call Upstox
    url = f"https://api.upstox.com/v2/fundamentals/{isin}/income-statement"

    params = {
        "type": "consolidated",
        "time_period": "yearly",
        "fs": "true"
    }

    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {access_token}"
    }

    response = requests.get(
        url,
        params=params,
        headers=headers,
        timeout=30
    )

    response.raise_for_status()

    income_statement = response.json()

    # 4. Save response to GCS
    save_json_to_gcs(
        data=income_statement,
        bucket_name=bucket_name,
        blob_name=blob_name
    )

    # 5. Return data
    return income_statement
#########################################################################
def get_share_holdings(isin: str, bucket_name: str):

    blob_name = f"{isin}/share-holdings.json"

    # 1. Check if share holdings already exists in GCS
    if gcs_file_exists(bucket_name, blob_name):
        return get_json_from_gcs(
            bucket_name,
            blob_name
        )

    # 2. Get Upstox token
    access_token = os.getenv("UPSTOX_ACCESS_TOKEN")

    if not access_token:
        raise Exception(
            "UPSTOX_ACCESS_TOKEN environment variable is not set"
        )

    # 3. Call Upstox
    url = f"https://api.upstox.com/v2/fundamentals/{isin}/share-holdings"

    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {access_token}"
    }

    response = requests.get(
        url,
        headers=headers,
        timeout=30
    )

    response.raise_for_status()

    share_holdings = response.json()

    # 4. Save response to GCS
    save_json_to_gcs(
        data=share_holdings,
        bucket_name=bucket_name,
        blob_name=blob_name
    )

    # 5. Return data
    return share_holdings

#########################################################################

def get_key_ratios(isin: str, bucket_name: str):

    blob_name = f"{isin}/key-ratios.json"

    # 1. Check if key ratios already exist in GCS
    if gcs_file_exists(bucket_name, blob_name):
        return get_json_from_gcs(
            bucket_name,
            blob_name
        )

    # 2. Get Upstox token
    access_token = os.getenv("UPSTOX_ACCESS_TOKEN")

    if not access_token:
        raise Exception(
            "UPSTOX_ACCESS_TOKEN environment variable is not set"
        )

    # 3. Call Upstox
    url = f"https://api.upstox.com/v2/fundamentals/{isin}/key-ratios"

    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {access_token}"
    }

    response = requests.get(
        url,
        headers=headers,
        timeout=30
    )

    response.raise_for_status()

    key_ratios = response.json()

    # 4. Save response to GCS
    save_json_to_gcs(
        data=key_ratios,
        bucket_name=bucket_name,
        blob_name=blob_name
    )

    # 5. Return data
    return key_ratios



#########################################################################

def get_corporate_actions(isin: str, bucket_name: str):

    blob_name = f"{isin}/corporate-actions.json"

    # 1. Check if corporate actions already exist in GCS
    if gcs_file_exists(bucket_name, blob_name):
        return get_json_from_gcs(
            bucket_name,
            blob_name
        )

    # 2. Get Upstox token
    access_token = os.getenv("UPSTOX_ACCESS_TOKEN")

    if not access_token:
        raise Exception(
            "UPSTOX_ACCESS_TOKEN environment variable is not set"
        )

    # 3. Call Upstox
    url = f"https://api.upstox.com/v2/fundamentals/{isin}/corporate-actions"

    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {access_token}"
    }

    response = requests.get(
        url,
        headers=headers,
        timeout=30
    )

    response.raise_for_status()

    corporate_actions = response.json()

    # 4. Save response to GCS
    save_json_to_gcs(
        data=corporate_actions,
        bucket_name=bucket_name,
        blob_name=blob_name
    )

    # 5. Return data
    return corporate_actions

#########################################################################




from urllib.parse import quote


def get_competitors(isin: str, bucket_name: str):

    blob_name = f"{isin}/competitors.json"

    # Check GCS first
    if gcs_file_exists(bucket_name, blob_name):
        return get_json_from_gcs(
            bucket_name,
            blob_name
        )

    access_token = os.getenv("UPSTOX_ACCESS_TOKEN")

    if not access_token:
        raise Exception(
            "UPSTOX_ACCESS_TOKEN environment variable is not set"
        )

    # Convert ISIN -> Upstox instrument key
    instrument_key = f"NSE_EQ|{isin}"

    url = (
        "https://api.upstox.com/v2/fundamentals/"
        f"{quote(instrument_key, safe='')}/competitors"
    )

    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {access_token}"
    }

    response = requests.get(
        url,
        headers=headers,
        timeout=30
    )

    response.raise_for_status()

    competitors = response.json()

    save_json_to_gcs(
        data=competitors,
        bucket_name=bucket_name,
        blob_name=blob_name
    )

    return competitors
#########################################################################


def get_ohlc(isin: str, bucket_name: str):

    blob_name = f"{isin}/ohlc.json"

    # 1. Check if OHLC already exists in GCS
    if gcs_file_exists(bucket_name, blob_name):
        return get_json_from_gcs(
            bucket_name,
            blob_name
        )

    # 2. Get Upstox token
    access_token = os.getenv("UPSTOX_ACCESS_TOKEN")

    if not access_token:
        raise Exception(
            "UPSTOX_ACCESS_TOKEN environment variable is not set"
        )

    # 3. Convert ISIN to Upstox instrument key
    instrument_key = f"NSE_EQ|{isin}"

    url = "https://api.upstox.com/v3/market-quote/ohlc"

    params = {
        "instrument_key": instrument_key,
        "interval": "1d"
    }

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {access_token}"
    }

    response = requests.get(
        url,
        headers=headers,
        params=params,
        timeout=30
    )

    response.raise_for_status()

    ohlc = response.json()

    # 4. Save response to GCS
    save_json_to_gcs(
        data=ohlc,
        bucket_name=bucket_name,
        blob_name=blob_name
    )

    # 5. Return data
    return ohlc
#########################################################################
