/**
 * Global variables and helper functions
 */

var ui; // return null if called from script editor
try {
  ui = SpreadsheetApp.getUi();
} catch (e) {
  Logger.log('You are using script editor.');
}
const ss = SpreadsheetApp.getActiveSpreadsheet();
const scriptProps = PropertiesService.getScriptProperties();

const {
  PROJECT_ID,
  WEBAPP_URL,
  BUCKET_NAME,
  DATASET
} = scriptProps.getProperties();

function showAlert(message) {
  if (ui) {
    ui.alert(message);
  } else {
    Logger.log(message);
  }
}

function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
