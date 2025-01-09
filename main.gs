function onOpen() 
{
  ui
    .createMenu('Custom Menu')
      .addItem('Load CSV to BigQuery', 'loadCsvToBQ')
    .addToUi();
}

/**
 * @param {object} e 
 * @returns {object} gsUri, success
 */
function doPost(e)
{
  const body = JSON.parse(e.postData.contents);

  const spName = '`' + DATASET + '`.`loadCsvToBQ`';
  const targetTable = '`' + DATASET + '`.`amz_sfr`';

  const query = `
    DECLARE output BOOL;
    CALL ${spName} (
      '${body.gsUri}',
      '${targetTable}',
      output
    );
    SELECT output;
  `;
  const request = {
    query: query,
    useLegacySql: false
  };

  let result;
  result = BigQuery.Jobs.query(request, PROJECT_ID);

  // wait for the job to finish
  let sleep = 500;
  while (!result.jobComplete) {
    Utilities.sleep(sleep);
    sleep *= 2;
    result = BigQuery.Jobs.getQueryResults(PROJECT_ID, parentJobId);
  }

  return ContentService.createTextOutput(
    JSON.stringify({
      gsUri: body.gsUri,
      success: result.rows[0].f[0].v === 'true'
    }))
    .setMimeType(ContentService.MimeType.JSON);

}

/**
 * Bulk load CSV files to BigQuery.
 * Log the unsuccessful files in the sheet "Files".
 * @returns {void}
 */
function loadCsvToBQ()
{
  // list files
  const folder = 'csv/';
  const glob = '*/*.csv'; // only in this folder, exclude subfolders

  const url = `https://storage.googleapis.com/storage/v1/b/${BUCKET_NAME}/o?prefix=${encodeURIComponent(folder)}&matchGlob=${encodeURIComponent(glob)}`;
  const options = {
    method: 'get',
    headers: {
      Authorization: `Bearer ${ScriptApp.getOAuthToken()}`
    }
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response);
  
  if (!( data.items?.length )) {
    showAlert(`No files found in bucket "${BUCKET_NAME}".`);
    return;
  }

  // Make the request
  const requests = data.items.map(item => {
    return {
      url: WEBAPP_URL,
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        gsUri: `gs://${BUCKET_NAME}/${item.name}`
      })
    };
  });

  // Split requests into chunks of 25 and call fetchAll synchronously for each chunk
  const chunkedRequests = chunkArray(requests, 25);
  let responses = [];
  for (const chunk of chunkedRequests) {
    const chunkResponses = UrlFetchApp.fetchAll(chunk);
    responses = responses.concat(chunkResponses);
  }

  const objects = responses.reduce((acc, response) => {
    const result = JSON.parse(response);
    const oldObjectName = result.gsUri.split('/').slice(3).join('/');
    const filename = oldObjectName.split('/').pop(); // with extension
    const newObjectName = 'csv/' + (result.success ? 'success/' : 'fail/') + filename;

    // copy
    acc.copy.push({
      url: `https://storage.googleapis.com/storage/v1/b/${BUCKET_NAME}/o/${encodeURIComponent(oldObjectName)}/copyTo/b/${BUCKET_NAME}/o/${encodeURIComponent(newObjectName)}`,
      method: 'post',
      headers: {
        Authorization: `Bearer ${ScriptApp.getOAuthToken()}`
      }
    });
    // delete
    acc.delete.push({
      url: `https://storage.googleapis.com/storage/v1/b/${BUCKET_NAME}/o/${encodeURIComponent(oldObjectName)}`,
      method: 'delete',
      headers: {
        Authorization: `Bearer ${ScriptApp.getOAuthToken()}`
      }
    });

    // Log to sheets
    if (!result.success) {
      acc.filenames.push([
        filename.substring(0, filename.lastIndexOf('.')) // without extension
      ]);
    }

    return acc;
  }, {
    copy: [],
    delete: [],
    filenames: []
  });

  UrlFetchApp.fetchAll(objects.copy);
  UrlFetchApp.fetchAll(objects.delete);
  
  // write into sheets
  const sheet = ss.getSheetByName('Files');
  if (sheet.getLastRow() > 1) sheet.getRange('A2:A' + sheet.getLastRow()).clearContent();
  if (objects.filenames.length) sheet.getRange('A2:A' + (objects.filenames.length + 1)).setValues(objects.filenames);

}
