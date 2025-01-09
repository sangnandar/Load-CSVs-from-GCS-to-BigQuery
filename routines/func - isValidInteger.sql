CREATE OR REPLACE FUNCTION `mydataset`.`isValidInteger`
(
  str STRING
)
RETURNS BOOL
AS 
(
  CASE
    WHEN
      SAFE_CAST(
        REPLACE(str, ',', '') AS INT64
      ) IS NULL
    THEN
      FALSE
    ELSE
      TRUE
  END
);
