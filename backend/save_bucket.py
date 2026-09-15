import json
from google.cloud import storage


def save_json_to_gcs(data, bucket_name, blob_name):
    """
    Save JSON data to Google Cloud Storage.

    Args:
        data: Python dict/list containing the JSON data
        bucket_name: GCS bucket name
        blob_name: Path/name of the JSON file in the bucket

    Example:
        save_json_to_gcs(
            data=response_data,
            bucket_name="stockrawdata",
            blob_name="companies/nifty500.json"
        )
    """

    client = storage.Client()

    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_name)

    json_data = json.dumps(
        data,
        indent=2,
        ensure_ascii=False
    )

    blob.upload_from_string(
        json_data,
        content_type="application/json"
    )

    return f"gs://{bucket_name}/{blob_name}"



    
    
###################################################################

from google.cloud import storage


def gcs_file_exists(bucket_name, blob_name):
    """
    Check whether a file exists in a GCS bucket.

    Args:
        bucket_name: GCS bucket name
        blob_name: File path/name inside the bucket

    Returns:
        True if file exists, otherwise False.
    """

    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_name)

    return blob.exists()

###################################################################

import json
from google.cloud import storage


def get_json_from_gcs(bucket_name, blob_name):
    """
    Download a JSON file from GCS and return its contents as Python data.

    Args:
        bucket_name: GCS bucket name
        blob_name: Path/name of the JSON file

    Returns:
        dict or list containing the JSON data
    """

    client = storage.Client()

    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_name)

    # Download file as text
    content = blob.download_as_text()

    # Convert JSON string to Python dict/list
    print("downloading json from gcs")
    return json.loads(content)

###################################################################
