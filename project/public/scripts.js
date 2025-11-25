/*
 * These functions below are for various webpage functionalities. 
 * Each function serves to process data on the frontend:
 *      - Before sending requests to the backend.
 *      - After receiving responses from the backend.
 * 
 * To tailor them to your specific needs,
 * adjust or expand these functions to match both your 
 *   backend endpoints 
 * and 
 *   HTML structure.
 * 
 */


// This function checks the database connection and updates its status on the frontend.
async function checkDbConnection() {
    const statusElem = document.getElementById('dbStatus');
    const loadingGifElem = document.getElementById('loadingGif');

    const response = await fetch('/check-db-connection', {
        method: "GET"
    });

    // Hide the loading GIF once the response is received.
    loadingGifElem.style.display = 'none';
    // Display the statusElem's text in the placeholder.
    statusElem.style.display = 'inline';

    response.text()
    .then((text) => {
        statusElem.textContent = text;
    })
    .catch((error) => {
        statusElem.textContent = 'connection timed out';  // Adjust error handling if required.
    });
}

// Fetches data from the demotable and displays it.
async function fetchAndDisplayUsers() {
    const tableElement = document.getElementById('demotable');
    const tableBody = tableElement.querySelector('tbody');

    const response = await fetch('/demotable', {
        method: 'GET'
    });

    const responseData = await response.json();
    const demotableContent = responseData.data;

    // Always clear old, already fetched data before new fetching process.
    if (tableBody) {
        tableBody.innerHTML = '';
    }

    demotableContent.forEach(user => {
        const row = tableBody.insertRow();
        user.forEach((field, index) => {
            const cell = row.insertCell(index);
            cell.textContent = field;
        });
    });
}

// This function resets or initializes the demotable.
async function resetDemotable() {
    const response = await fetch("/initiate-demotable", {
        method: 'POST'
    });
    const responseData = await response.json();

    if (responseData.success) {
        const messageElement = document.getElementById('resetResultMsg');
        messageElement.textContent = "demotable initiated successfully!";
        fetchTableData();
    } else {
        alert("Error initiating table!");
    }
}

// Inserts new records into the demotable.
async function insertDemotable(event) {
    event.preventDefault();

    const idValue = document.getElementById('insertId').value;
    const nameValue = document.getElementById('insertName').value;
    const emailValue = document.getElementById('insertEmail').value;
    const phoneValue = document.getElementById('insertPhone').value;

    const response = await fetch('/insert-demotable', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: idValue,
            name: nameValue,
            email: emailValue,
            phoneNumber: phoneValue
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('insertResultMsg');

    if (responseData.success) {
        messageElement.textContent = "Data inserted successfully!";
        fetchTableData();
    } else {
        messageElement.textContent = "Error inserting data!";
    }
}

// Updates names in the demotable.
async function updateNameDemotable(event) {
    event.preventDefault();

    const oldNameValue = document.getElementById('updateOldName').value;
    const newNameValue = document.getElementById('updateNewName').value;

    const response = await fetch('/update-name-demotable', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            oldName: oldNameValue,
            newName: newNameValue
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('updateNameResultMsg');

    if (responseData.success) {
        messageElement.textContent = "Name updated successfully!";
        fetchTableData();
    } else {
        messageElement.textContent = "Error updating name!";
    }
}

// Counts rows in the demotable.
// Modify the function accordingly if using different aggregate functions or procedures.
async function countDemotable() {
    const response = await fetch("/count-demotable", {
        method: 'GET'
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('countResultMsg');

    if (responseData.success) {
        const tupleCount = responseData.count;
        messageElement.textContent = `The number of tuples in demotable: ${tupleCount}`;
    } else {
        alert("Error in count demotable!");
    }
}


// ---------------------------------------------------------------
// Initializes the webpage functionalities.
// Add or remove event listeners based on the desired functionalities.
window.onload = function() {
    checkDbConnection();
    fetchTableData();
    document.getElementById("resetDemotable").addEventListener("click", resetDemotable);
    document.getElementById("insertDemotable").addEventListener("submit", insertDemotable);
    document.getElementById("updataNameDemotable").addEventListener("submit", updateNameDemotable);
    document.getElementById("countDemotable").addEventListener("click", countDemotable);
};

// General function to refresh the displayed table data. 
// You can invoke this after any table-modifying operation to keep consistency.
function fetchTableData() {
    fetchAndDisplayUsers();
}


// this is the hiketable implementation 
async function fetchAndDisplayHikes() {
    const tableElement = document.getElementById('hiketable');
    const tableBody = tableElement.querySelector('tbody');

    try {
        const response = await fetch('/hiketable', {
            method: 'GET'
        });

        const responseData = await response.json();
        // Assuming success: true and data is an array of records
        const hikeContent = responseData.data || []; 

        if (tableBody) {
            tableBody.innerHTML = '';
        }

        if (hikeContent.length === 0) {
            const row = tableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 4; // Based on your HTML's current 4 columns
            cell.textContent = 'No hike data found.';
            return;
        }

        // Check if data is an array of objects (preferred) or array of arrays (common in DB responses)
        if (typeof hikeContent[0] === 'object' && !Array.isArray(hikeContent[0])) {
            // Data is an array of objects (e.g., [{HikeID: 1, Name: 'Trail A', ...}])
            hikeContent.forEach(hike => {
                const row = tableBody.insertRow();
                
                // IMPORTANT: The order of fields must correspond to the column index
                // We are inserting the fields necessary for Hike1 and Hike2:
                const fields = [
                    hike.HikeID || 'N/A', 
                    hike.Name || 'Unnamed', 
                    hike.Kind || 'N/A', 
                    hike.Distance || 'N/A', 
                    hike.Elevation || 'N/A', 
                    hike.Duration || 'N/A', 
                    hike.Difficulty || 'N/A', 
                    hike.Season || 'N/A', 
                    hike.TrailCondition || 'N/A'
                ];
                
                // Since your HTML only has 4 columns, only the first 4 fields will display
                fields.slice(0, 4).forEach(field => {
                    const cell = row.insertCell();
                    cell.textContent = field;
                });
            });
        } else {
            // Data is an array of arrays (e.g., [['1', 'Trail A', ...]])
            hikeContent.forEach(hikeRecord => {
                const row = tableBody.insertRow();
                // Slice to fit the 4 columns in the current HTML
                hikeRecord.slice(0, 4).forEach((field) => {
                    const cell = row.insertCell();
                    cell.textContent = field;
                });
            });
        }
    } catch (error) {
        console.error("Failed to fetch hike data:", error);
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="4" style="color:red;">Error loading data. See console.</td></tr>`;
        }
    }
}


async function resetHikeTable() {
    const response = await fetch("/initiate-hiketable", {
        method: 'POST'
    });
    const responseData = await response.json();
    const messageElement = document.getElementById('resetHikeResultMsg');

    if (responseData.success) {
        messageElement.textContent = "HikeTable initiated successfully!";
        fetchTableData(); // Refresh table
    } else {
        messageElement.textContent = `Error initiating HikeTable: ${responseData.message || 'Unknown error'}`;
        console.error("Error initiating HikeTable:", responseData);
    }
}

/**
 * Inserts a new hike record into the HikeTable.
 */
async function insertHikeTable(event) {
    event.preventDefault();

    // Collect form data (must match HTML form IDs)
    const hikeID = document.getElementById('insertHikeID').value;
    const name = document.getElementById('insertName').value;
    const kind = document.getElementById('insertKind').value;
    const distance = document.getElementById('insertDistance').value;
    const elevation = document.getElementById('insertElevation').value;
    const duration = document.getElementById('insertDuration').value;
    const difficulty = document.getElementById('insertDifficulty').value;
    const season = document.getElementById('insertSeason').value;
    const trailCondition = document.getElementById('insertTrailCondition').value;

    try {
        const response = await fetch('/insert-hiketable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                HikeID: parseInt(hikeID),
                Name: name,
                Kind: kind,
                Distance: parseInt(distance),
                Elevation: parseInt(elevation),
                Duration: parseInt(duration),
                Difficulty: parseInt(difficulty),
                Season: season,
                TrailCondition: parseInt(trailCondition)
            })
        });

        const responseData = await response.json();
        const messageElement = document.getElementById('insertHikeResultMsg');

        if (responseData.success) {
            messageElement.textContent = `Hike "${name}" inserted successfully!`;
            // Clear form
            event.target.reset();
            fetchTableData(); // Refresh table
        } else {
            messageElement.textContent = `Error inserting hike: ${responseData.message || 'Unknown error'}`;
        }
    } catch (err) {
        document.getElementById('insertHikeResultMsg').textContent = `Request failed: ${err.message}`;
        console.error("Insert request failed:", err);
    }
}
