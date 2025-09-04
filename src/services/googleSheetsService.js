const { google } = require('googleapis');

/**
 * Inserts a new row into a Google Sheet.
 * This function assumes authentication is handled via Application Default Credentials
 * (e.g., a GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to a service account key file).
 * The user must enable the Google Sheets API in their Google Cloud project and share the sheet
 * with the service account's email address.
 * @param {string} spreadsheetId - The ID of the spreadsheet.
 * @param {object} rowData - An object where keys are column headers and values are the cell values.
 * @returns {Promise<void>}
 */
async function insertRow(spreadsheetId, rowData) {
    console.log('--- Calling Google Sheets Service: insertRow ---');

    try {
        const auth = await google.auth.getClient({
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // This is a simplified example that assumes a header row exists and appends after it.
        // It just inserts the values of the passed object. A more robust implementation
        // would map keys to specific columns.
        const values = [Object.values(rowData)];

        const request = {
            spreadsheetId: spreadsheetId,
            range: 'Sheet1!A1', // Assumes data is appended to the first sheet.
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: values,
            },
        };

        await sheets.spreadsheets.values.append(request);

        console.log('--- Google Sheets Service: Row Inserted Successfully ---');
    } catch (error) {
        console.error('Error calling Google Sheets API. Ensure the API is enabled, the sheet is shared with the service account, and credentials are set.');
        console.error(error);
        // We will log the error but not throw, to allow the main workflow to continue.
    }
}

module.exports = { insertRow };
