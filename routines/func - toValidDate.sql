CREATE OR REPLACE FUNCTION `mydataset`.`toValidDate`
(
  dateString STRING,
  pivotYear INT64
)
RETURNS DATE
AS 
(
  PARSE_DATE(
    '%Y-%m-%d',
    ARRAY_TO_STRING([
      CAST(pivotYear + CAST(SPLIT(dateString, '/')[OFFSET(2)] AS INT64) AS STRING),
      SPLIT(dateString, '/')[OFFSET(0)],
      SPLIT(dateString, '/')[OFFSET(1)]
    ], '-')
  )
);
