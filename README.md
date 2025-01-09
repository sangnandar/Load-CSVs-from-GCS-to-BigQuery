# Load CSVs from GCS to BigQuery

# Overview

This project is a **Google Apps Script solution** designed to streamline loading CSV data from **Google Cloud Storage (GCS)** into **BigQuery**. The solution ensures data integrity by validating records before they are inserted into the database.

### Key Features:
- **Data Validation:** Records are loaded into BigQuery only after passing defined validation criterias.
- **Google Sheets UI:** The project uses Google Sheets with a bounded Apps Script to provide a user-friendly interface for interacting with BigQuery operations.
- **GCS-BigQuery Pipeline:** The project utilizes **GCS** `gsUri` for seamless integration with **BigQuery**.

This solution is ideal for handling large datasets, ensuring data quality, and leveraging BigQuery's robust analytics capabilities.

# How it works
- CSVs are stored in GCS bucket under the `csv/` folder.
- Apps Script reads the content of that folder to list all csv files.
- Apps Script calls BigQuery's stored procedure to load each file into BigQuery table.
- Successful files are moved to `success/` subfolder.
- Unsuccessful files are moved to `fail/` subfolder and logged into Google Sheets.

# Installation
### GCP Project configuration
These APIs should be enabled:
- Cloud Storage API
- BigQuery API

### BigQuery configuration
- In this example, only 2 date columns and 1 integer column are validated. Additional validations can be incorporated into the `loadCsvToBQ` stored procedure.
- In this example, the date columns originate in the MM/DD/YY format and the integer column originates as a string with thousand separator.
- BigQuery temporary table must include `_SESSION` because when `LOAD INTO` fails the temporary table will not be created and subsequent `DROP TABLE` will throw error.
- Target table structure [screenshot].

### Apps Script configuration
- Deploy the project as webapp.
- Set up Script Properties in **Apps Script -> Project Settings -> Script Properties**:
  ```
  {
    PROJECT_ID: <GCP Project ID>,
    WEBAPP_URL: <generated webapp url>,
    BUCKET_NAME: <GCS bucket name>,
    DATASET: <BigQuery dataset where the stored procedure resides>
  }
  ```
- Configure the `appsscript.json` file:
  ```json
  {
    "dependencies": {
      "enabledAdvancedServices": [
        {
          "userSymbol": "BigQuery",
          "version": "v2",
          "serviceId": "bigquery"
        }
      ]
    },
    "webapp": {
      "executeAs": "USER_DEPLOYING",
      "access": "ANYONE_ANONYMOUS"
    },
    "oauthScopes": [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/script.external_request",
      "https://www.googleapis.com/auth/bigquery",
      "https://www.googleapis.com/auth/devstorage.read_only"
    ]
  }
  ```

### Sheets configuration
**DO NOT** change sheets name, delete columns, or re-arrange columns for the following ranges:
- Write
  ```
  'Files'!A2:A
  ```

Sheets layout [sreenshot]

# Usage
- Attach the Apps Script to a Google Sheets.
- Create the related tables, procedures, and functions in BigQuery.
- Call the script from **Menu toolbar: Custom Menu -> Load CSV to BigQuery**.

# Caveats
Apps Script [current limitations](https://developers.google.com/apps-script/guides/services/quotas#current_limitations) specify a "Simultaneous executions per user" limit of 30. This restriction impacts the number of requests that can be made using `UrlFetchApp.fetchAll()`. In this project, the requests are split into chunks of 25 to stay within the limit.

# TODO
- To overcome this limitation, consider creating a stored procedure to act as a broker. This procedure would accept an array of `gsUri` values and invoke the `loadCsvToBQ` procedure for each individual `gsUri`.
- Create a separate repository for the same use case, but utilize Google Drive as the storage solution instead of GCS.

# Related project
- [CSV Fixer for GCS](https://github.com/sangnandar/CSV-Fixer-for-GCS) - fix the file and upload back to GCS.
