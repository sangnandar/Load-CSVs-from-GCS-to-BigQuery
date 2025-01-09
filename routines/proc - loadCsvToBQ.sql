CREATE OR REPLACE PROCEDURE `mydataset`.`loadCsvToBQ`
(
  IN gsUri STRING,
  IN targetTable STRING,
  OUT success BOOL
)

BEGIN

  DECLARE tempTable STRING;
  DECLARE columnList STRING;
  DECLARE query STRING;
  DECLARE pivotYear INT64 DEFAULT 2000;
  DECLARE invalidRecords INT64;

  SET tempTable = CONCAT('_SESSION.`', GENERATE_UUID(), '`');

  SET columnList = """(
    `start_date` STRING,
    `end_date` STRING,
    `department` STRING,
    `search_term` STRING,
    `sfr` STRING,
    `_1_clicked_asin` STRING,
    `_1_product_title` STRING,
    `_1_click_share` STRING,
    `_1_conversion_share` STRING
    )""";

  -- load all records as string
  BEGIN
    SET query = CONCAT("""
      LOAD DATA INTO TEMP TABLE """, tempTable, columnList, """
        from files (
          format = 'csv',
          uris = ['""", gsUri, """'],
          skip_leading_rows = 1,
          max_bad_records = 0
        )"""
    );
    EXECUTE IMMEDIATE query;

    /**
      * This is the part where we rigorously test the record
      */
    SET query = CONCAT("""
      SELECT 
        COUNT(*)
      FROM """, tempTable, """
      WHERE
        NOT `mydataset`.`isValidDate`(`start_date`, 2000) OR
        NOT `mydataset`.`isValidDate`(`end_date`, 2000) OR
        NOT `mydataset`.`isValidInteger`(`sfr`)
      """
    );
    EXECUTE IMMEDIATE query INTO invalidRecords;
    /**
      * End of testing
      */
    
    CASE
      WHEN invalidRecords > 0 THEN
        SET success = FALSE;

      ELSE
        SET query = CONCAT("""
          INSERT INTO """, targetTable, """
          SELECT
            `mydataset`.`toValidDate`(`start_date`, 2000) as `start_date`,
            `mydataset`.`toValidDate`(`end_date`, 2000) as `end_date`,
            `department`,
            `search_term`,
            `mydataset`.`toValidInteger`(`sfr`) as `sfr`,
            `_1_clicked_asin`,
            `_1_product_title`,
            `_1_click_share`,
            `_1_conversion_share`
          FROM """, tempTable
        );
        EXECUTE IMMEDIATE query;

        SET success = TRUE;

    END CASE;

  EXCEPTION WHEN ERROR THEN
    SET success = FALSE;

  END;

  SET query = CONCAT('DROP TABLE IF EXISTS ', tempTable);
  EXECUTE IMMEDIATE query;

END;
