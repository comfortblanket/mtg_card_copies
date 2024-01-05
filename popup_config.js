// Create a new database or open an existing one
let openRequest = indexedDB.open("MyDatabase", 1);

openRequest.onupgradeneeded = function(e) {
    let db = e.target.result;
    db.createObjectStore("MyStore", {keyPath: "id"});
};

openRequest.onsuccess = function(e) {
    let db = e.target.result;

    document.getElementById('loadButton').addEventListener('click', function() {
            
        let fileInput = document.getElementById('fileInput');
        let file = fileInput.files[0];
        let reader = new FileReader();

        document.getElementById('statusMessage').textContent = 'Loading... (don\'t close this popup!)';
        
        reader.onload = function(e) {
            console.log('Loading file...');
            let text = e.target.result;

            // Parse the CSV data
            let cardQuantities = {};
            let lines = text.split('\n');

            // Skip the header row
            lines.shift();

            console.log('Parsing file...');
            for (let line of lines) {
                let commaIndex = line.indexOf(',');

                // Skip lines without a comma
                if (commaIndex === -1) {
                    continue;
                }

                let amount = line.substring(0, commaIndex);
                let remainingRow = line.substring(commaIndex + 1);
                let cardName;

                if (remainingRow) {
                    if (remainingRow.startsWith('"')) {
                        let endQuoteIndex = remainingRow.indexOf('"', 1);
                        cardName = remainingRow.substring(1, endQuoteIndex);
                    } else {
                        let nextCommaIndex = remainingRow.indexOf(',');
                        cardName = remainingRow.substring(0, nextCommaIndex);
                    }

                    cardName = cardName.trim().toLowerCase();

                    let [cardNameFront] = cardName.split('//', 1);
                    if (cardNameFront) {
                        cardNameFront = cardNameFront.trim();
                        if (cardNameFront !== cardName) {
                            if (cardQuantities.hasOwnProperty(cardNameFront)) {
                                cardQuantities[cardNameFront] += parseInt(amount.trim());
                            } else {
                                cardQuantities[cardNameFront] = parseInt(amount.trim());
                            }
                        }
                    }

                    if (cardQuantities.hasOwnProperty(cardName)) {
                        cardQuantities[cardName] += parseInt(amount.trim());
                    } else {
                        cardQuantities[cardName] = parseInt(amount.trim());
                    }
                }
            }
            
            // Save the card quantities to IndexedDB
            let transaction = db.transaction("MyStore", "readwrite");
            let store = transaction.objectStore("MyStore");
            store.put({id: "cardQuantities", value: cardQuantities});
        
            transaction.oncomplete = function() {
                console.log('Collection stored in IndexedDB');
                document.getElementById('statusMessage').textContent = 'File loaded (you may close this popup now)';
                
                // Start a new transaction to retrieve the data
                let retrieveTransaction = db.transaction("MyStore", "readonly");
                let retrieveStore = retrieveTransaction.objectStore("MyStore");
                let retrieveRequest = retrieveStore.get("cardQuantities");

                retrieveRequest.onsuccess = function() {
                    if (retrieveRequest.result) {
                        console.log('Retrieved card quantities:', retrieveRequest.result.value);
                    } else {
                        console.log('No card quantities in IndexedDB');
                    }
                };

                retrieveRequest.onerror = function() {
                    console.error('Error retrieving card quantities:', retrieveRequest.error);
                };
            };
        
            transaction.onerror = function() {
                console.error('Error storing card quantities:', transaction.error);
            };

            
        };

        reader.readAsText(file);
    });

    document.addEventListener('DOMContentLoaded', function() {
        // Get the filepath from IndexedDB
        let transaction = db.transaction("MyStore", "readonly");
        let store = transaction.objectStore("MyStore");
        let request = store.get("filepath");

        request.onsuccess = function() {
            if (request.result) {
                console.log('Got filepath:', request.result.value);
                document.getElementById('statusMessage').textContent = 'Loaded file: ' + request.result.value;
            } else {
                console.log('No filepath in IndexedDB');
                document.getElementById('statusMessage').textContent = 'No file loaded';
            }
        };

        request.onerror = function() {
            console.error('Error getting filepath:', request.error);
        };
    });
};

openRequest.onerror = function(e) {
    console.error('Error opening IndexedDB:', e.target.error);
};