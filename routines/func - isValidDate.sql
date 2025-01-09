CREATE OR REPLACE FUNCTION `mydataset`.`isValidDate`
(
  dateString STRING,
  pivotYear INT64
)
RETURNS BOOL
AS 
(
  CASE
    WHEN
      LENGTH(SPLIT(dateString, '/')[OFFSET(0)]) > 2 OR
      LENGTH(SPLIT(dateString, '/')[OFFSET(1)]) > 2 OR
      LENGTH(SPLIT(dateString, '/')[OFFSET(2)]) != 2 OR
      SAFE.PARSE_DATE(
        '%Y-%m-%d',
        ARRAY_TO_STRING([
          CAST(pivotYear + CAST(SPLIT(dateString, '/')[OFFSET(2)] AS INT64) AS STRING),
          SPLIT(dateString, '/')[OFFSET(0)],
          SPLIT(dateString, '/')[OFFSET(1)]
        ], '-')
      ) IS NULL
    THEN
      FALSE
    ELSE
      TRUE
  END
);
