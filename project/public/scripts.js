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

    const response = await fetch('/appuser', {
        method: 'GET'
    });

    const responseData = await response.json();
    const demotableContent = responseData.data || [];

    // Always clear old, already fetched data before new fetching process.
    if (tableBody) {
        tableBody.innerHTML = '';
    }

    demotableContent.forEach((user) => {
        const row = tableBody.insertRow();
        // user = [UserID, Name, PreferenceID, Email, PhoneNumber]
        const ordered = [user[0], user[1], user[3], user[4]];
        ordered.forEach((field, index) => {
            const cell = row.insertCell(index);
            cell.textContent = field;
        });
    });
}

// This function resets or initializes the demotable.
async function resetDemotable() {
    const response = await fetch("/initiate-appuser", {
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

    const response = await fetch('/insert-appuser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            UserID: parseInt(idValue, 10),
            Name: nameValue,
            PreferenceID: null,
            Email: emailValue,
            PhoneNumber: phoneValue
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

    const response = await fetch('/update-appuser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            criteria: { Name: oldNameValue },
            updates: { Name: newNameValue }
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
    const response = await fetch("/appuser", { method: 'GET' });
    const responseData = await response.json();
    const messageElement = document.getElementById('countResultMsg');

    if (responseData.success && Array.isArray(responseData.data)) {
        const tupleCount = responseData.data.length;
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
    fetchAndDisplayHikes();
}


// this is the hiketable implementation 
async function fetchAndDisplayHikes() {
    const hikeTable = document.getElementById('hikeTable');
    if (!hikeTable) {
        return;
    }

    const hikeTableBody = hikeTable.querySelector('tbody');

    // Fetch Hike2 for main details and Hike1 for difficulty, then merge on shared keys.
    const [hike2Response, hike1Response] = await Promise.all([
        fetch('/hike2', { method: 'GET' }),
        fetch('/hike1', { method: 'GET' })
    ]);

    const hike2Data = await hike2Response.json();
    const hike1Data = await hike1Response.json();

    const hikes = hike2Data.data || [];
    const hike1 = hike1Data.data || [];

    // Build lookup for difficulty using composite key (Kind, Distance, Elevation, Duration).
    const difficultyLookup = hike1.reduce((lookup, entry) => {
        const [kind, distance, elevation, duration, difficulty] = entry;
        const key = [kind, distance, elevation, duration].join('|');
        lookup[key] = difficulty;
        return lookup;
    }, {});

    if (hikeTableBody) {
        hikeTableBody.innerHTML = '';
    }

    hikes.forEach((hike) => {
        const row = hikeTableBody.insertRow();
        const key = [hike[3], hike[8], hike[7], hike[6]].join('|'); // Kind, Distance, Elevation, Duration
        const difficulty = difficultyLookup[key] ?? 'N/A';
        const orderedValues = [
            hike[0], // HikeID
            hike[2], // Name
            hike[3], // Kind
            hike[4], // Season
            hike[5], // TrailCondition
            hike[6], // Duration
            hike[7], // Elevation
            hike[8], // Distance
            difficulty, // Difficulty from Hike1
            hike[1]  // LocationID
        ];
        orderedValues.forEach((value, index) => {
            const cell = row.insertCell(index);
            cell.textContent = value;
        });

        const feedbackCell = row.insertCell(orderedValues.length);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'View Feedback';
        btn.onclick = () => {
            window.location.href = `feedback.html?hikeId=${encodeURIComponent(hike[0])}`;
        };
        feedbackCell.appendChild(btn);
    });
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
