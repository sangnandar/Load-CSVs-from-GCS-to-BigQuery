CREATE OR REPLACE FUNCTION `mydataset`.`toValidInteger`
(
  str STRING
)
RETURNS INT64
AS 
(
  CAST(
    REPLACE(str, ',', '') AS INT64
  )
);
