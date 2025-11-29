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

// LEGACY FUNCTIONS
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


// IMPLEMENTED FUNCTIONS
// Fetches AppUser data from your backend and displays it in the table
async function fetchAndDisplayUsers() {
    const tableBody = document.querySelector('#usertable tbody');

    try {
        const response = await fetch('/usertable', { method: 'GET' });
        const responseData = await response.json(); // { data: [...] }

        console.log('Received data from backend:', responseData); // debugging

        // Clear old rows
        tableBody.innerHTML = '';

        // Loop through each user (array) and populate table
        responseData.data.forEach(user => {
            const row = tableBody.insertRow();

            // Map columns by array index: [USERID, NAME, PREFERENCEID, EMAIL, PHONENUMBER]
            [0, 1, 2, 3, 4].forEach(i => {
                const cell = row.insertCell();
                cell.textContent = user[i] ?? '';
            });
        });
    } catch (err) {
        console.error('Error fetching users:', err);
    }
}

// Run the function once page is loaded
window.addEventListener('DOMContentLoaded', fetchAndDisplayUsers);

async function fetchAndDisplayHikes() {
    const tableElement = document.getElementById('hiketable');
    const tableBody = tableElement.querySelector('tbody');

    try {
        const response = await fetch('/hiketable', { method: 'GET' });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP error ${response.status}: ${text}`);
        }

        const responseData = await response.json();
        const hikes = responseData.data;

        // Clear old rows
        if (tableBody) {
            tableBody.innerHTML = '';
        }

        // Populate table
        hikes.forEach(hike => {
            const row = tableBody.insertRow();
            hike.forEach((field, index) => {
                const cell = row.insertCell(index);
                cell.textContent = field ?? '';
            });
        });

        console.log('Displayed hikes in table:', hikes);

    } catch (err) {
        console.error('Error fetching hikes:', err);
    }
}

// Inserts new records into the AppUser table
async function insertAppUser(event) {
    event.preventDefault();

    const userID = document.getElementById('insertUserID').value;
    const name = document.getElementById('insertName').value;
    const preferenceID = document.getElementById('insertPreferenceID').value || null; // optional
    const email = document.getElementById('insertEmail').value;
    const phoneNumber = document.getElementById('insertPhoneNumber').value;

    try {
        const response = await fetch('/insert-appuser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                UserID: userID,
                Name: name,
                PreferenceID: preferenceID,
                Email: email,
                PhoneNumber: phoneNumber
            })
        });

        const responseData = await response.json();
        const messageElement = document.getElementById('insertUserResultMsg');

        if (responseData.success) {
            messageElement.textContent = "User inserted successfully!";
            fetchTableData(); // refresh tables
        } else {
            messageElement.textContent = "Error inserting user!";
        }
    } catch (err) {
        console.error('Error inserting user:', err);
        const messageElement = document.getElementById('insertUserResultMsg');
        messageElement.textContent = "Error inserting user!";
    }
}

// Update AppUser
async function updateAppUser(event) {
    event.preventDefault();

    const uid = document.getElementById('updateUid').value;
    const newName = document.getElementById('updateName').value || null;
    const email = document.getElementById('updateEmail').value || null;
    const pnum = document.getElementById('updatePhone').value || null;

    const response = await fetch('/update-appuser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, newName, email, pnum })
    });

    const result = await response.json();
    const messageElem = document.getElementById('updateResultMsg');

    if (result.success) {
        messageElem.textContent = "User updated successfully!";
        fetchAndDisplayUsers(); // Refresh table after update
    } else {
        messageElem.textContent = "Error updating user!";
    }
}

// Delete AppUser
async function deleteAppUserHandler(event) {
    event.preventDefault();

    const uid = document.getElementById('deleteUid').value;

    const response = await fetch('/delete-appuser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid })
    });

    const result = await response.json();
    const messageElem = document.getElementById('deleteResultMsg');

    if (result.success) {
        messageElem.textContent = `User ${uid} deleted successfully!`;
        fetchAndDisplayUsers(); // Refresh table after deletion
    } else {
        messageElem.textContent = `Error deleting user: ${result.message || ''}`;
    }
}

// select hikes 
// 4. SELECT with AND/OR support (frontend version)
async function selectHikes(filters) {
    try {
        const response = await fetch('/selectHike', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filters)
        });

        if (!response.ok) {
            await response.text(); 
            throw new Error('Network response was not ok');
        }

        return await response.json();
    } catch (err) {
        return [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('searchHikesBtn');
    const resultsContainer = document.getElementById('hikeResults');

    if (!button || !resultsContainer) return;

    button.addEventListener('click', async () => {
        const filters = [];

        const addFilter = (label, inputId, logicalId, operator = "=") => {
            const inputElement = document.getElementById(inputId);
            const logicalElement = document.getElementById(logicalId);

            if (!inputElement || !logicalElement) return;

            const value = inputElement.value.trim();
            const logical = logicalElement.value;

            if (value !== "") {
                filters.push({
                    attribute: label,
                    operator,
                    value: isNaN(value) ? value : Number(value),
                    logical
                });
            }
        };

        addFilter("Kind", "kindInput", "kindLogical");
        addFilter("Distance", "distanceInput", "distanceLogical");
        addFilter("Elevation", "elevationInput", "elevationLogical");
        addFilter("Duration", "durationInput", "durationLogical");

        const hikes = await selectHikes(filters);

        resultsContainer.innerHTML = hikes.length > 0
            ? hikes.map(h => `<div>${h[0]}</div>`).join('')
            : '<div>No hikes found</div>';
    });
});

// Project Hikes 
async function projectHikes(attributes) {
    try {
        const response = await fetch('/projectHike', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attributes })
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const hikes = await response.json();
        return hikes;
    } catch (err) {
        console.error('Error fetching projected hikes:', err);
        return [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('projectHikesBtn');
    const resultsContainer = document.getElementById('projectedResults');

    button.addEventListener('click', async () => {
        const attributes = document.getElementById('attributesInput').value.trim();

        if (!attributes) {
            resultsContainer.innerHTML = '<div>Please enter at least one attribute to project.</div>';
            return;
        }

        const hikes = await projectHikes(attributes);

        resultsContainer.innerHTML = hikes.length
            ? hikes.map(row => `<div>${row.join(' | ')}</div>`).join('')
            : '<div>No hikes found</div>';
    });
});

// JOIN 
async function getUsersWhoHiked(hid) {
    try {
        const response = await fetch('/findUsersWhoHiked', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hid })
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const users = await response.json();
        return users;
    } catch (err) {
        console.error('Error fetching users:', err);
        return [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('findUsersBtn');
    const resultsContainer = document.getElementById('usersResults');

    button.addEventListener('click', async () => {
        const hid = Number(document.getElementById('hikeIdInput').value);

        if (!hid) {
            resultsContainer.innerHTML = '<div>Please enter a valid HikeID.</div>';
            return;
        }

        const users = await getUsersWhoHiked(hid);

        resultsContainer.innerHTML = users.length
            ? users.map(u => `<div>${u[0]}</div>`).join('')
            : '<div>No users found for this hike.</div>';
    });
});

// 7 aggregation 
async function getAvgDiffPerSeason() {
    try {
        const response = await fetch('/avgDiffPerSeason', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const results = await response.json();
        return results;
    } catch (err) {
        console.error('Error fetching avg difficulty:', err);
        return [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('avgDiffBtn');
    const resultsContainer = document.getElementById('avgDiffResults');

    button.addEventListener('click', async () => {
        const results = await getAvgDiffPerSeason();

        resultsContainer.innerHTML = results.length
            ? results.map(r => `<div>Season: ${r[0]}, Avg Difficulty: ${Number(r[1]).toFixed(2)}</div>`).join('')
            : '<div>No data available</div>';
    });
});


async function getSafeHikes() {
    try {
        const response = await fetch('/safeHikes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const hikes = await response.json();
        return hikes;
    } catch (err) {
        console.error('Error fetching safe hikes:', err);
        return [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('safeHikesBtn');
    const resultsContainer = document.getElementById('safeHikesResults');

    button.addEventListener('click', async () => {
        const hikes = await getSafeHikes();

        resultsContainer.innerHTML = hikes.length
            ? hikes.map(h => `<div>${h[0]}</div>`).join('')
            : '<div>No safe hikes found</div>';
    });
});

// 9 Nested aggregation with GROUP BY
async function getGoodCondHikes() {
    try {
        const response = await fetch('/good-condition-hikes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const results = await response.json();
        return results;
    } catch (err) {
        console.error('Error fetching good condition hikes:', err);
        return [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('goodCondBtn');
    const resultsContainer = document.getElementById('goodCondResults');

    button.addEventListener('click', async () => {
        const results = await getGoodCondHikes();

        resultsContainer.innerHTML = results.length
            ? results.map(r => `<div>Name: ${r[0]}, Season: ${r[1]}, Trail Condition: ${Number(r[2])}</div>`).join('')
            : '<div>No data available</div>';
    });
});

// 10 Division
async function findUsersWhoHikedAllHikes() {
    try {
        const response = await fetch('/users-who-hiked-every-hike', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const results = await response.json();
        return results;
    } catch (err) {
        console.error('Error fetching users who hiked all hikes:', err);
        return [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('hikedAllHikesBtn');
    const resultsContainer = document.getElementById('hikedAllHikesResults');

    button.addEventListener('click', async () => {
        const results = await findUsersWhoHikedAllHikes();

        resultsContainer.innerHTML = results.length
            ? results.map(r => `<div>Name: ${r}</div>`).join('')
            : '<div>No data available</div>';
    });
});

// ---------------------------------------------------------------
// Initializes the webpage functionalities.
// Add or remove event listeners based on the desired functionalities.
window.onload = async function() {
    try {
        await checkDbConnection(); // if this returns a promise
        await fetchAndDisplayUsers();
        await fetchAndDisplayHikes();
    } catch (err) {
        console.error('Error during page load:', err);
    }

    document.getElementById("insertAppUserForm").addEventListener("submit", insertAppUser);
    document.getElementById("deleteAppUserForm").addEventListener("submit", deleteAppUserHandler);
    document.getElementById("updateAppUserForm").addEventListener("submit", updateAppUser);
};
