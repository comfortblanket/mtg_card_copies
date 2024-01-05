// Button listener for the "Browse" button
document.getElementById('loadButton').addEventListener('click', function() {
    let fileInput = document.getElementById('fileInput');
    let file = fileInput.files[0];
    let reader = new FileReader();

    // Called once the file is loaded
    reader.onload = function(e) {
        console.log('Parsing file: ', file.name);
        let text = e.target.result;

        // Parse the CSV data

        // Map from lower-case card name to quantity in collection
        let cardQuantities = {};

        let lines = text.split('\n');
        lines.shift();  // Skip the header row
        
        let lineNum = 1;
        for (let line of lines) {
            try {
                let firstCommaIndex = line.indexOf(',');
        
                // Log a warning and skip lines without a comma
                if (firstCommaIndex === -1) {
                    console.warn(`Warning: Line ${lineNum} does not contain a comma: "${line}"\nSkipping line.`);
                    lineNum++;
                    continue;
                }
        
                let cardAmount = line.substring(0, firstCommaIndex);
                let remainingRow = line.substring(firstCommaIndex + 1);
                let cardName;
        
                if (remainingRow) {
                    if (remainingRow.startsWith('"')) {
                        let endQuoteIndex = remainingRow.indexOf('"', 1);
                        if (endQuoteIndex === -1) {
                            throw new Error(`Line ${lineNum} starts with a double-quote but does not have a closing double-quote:\n\`${line}\`\nSkipping line.`);
                        }
                        cardName = remainingRow.substring(1, endQuoteIndex);
                    } else {
                        let nextCommaIndex = remainingRow.indexOf(',');
                        if (nextCommaIndex === -1) {
                            throw new Error(`Line ${lineNum} does not contain a second comma:\n\`${line}\`\nSkipping line.`);
                        }
                        cardName = remainingRow.substring(0, nextCommaIndex);
                    }
        
                    cardName = cardName.trim().toLowerCase();
        
                    // Handle split cards by storing their front name in addition to the full name
                    let [cardNameFront] = cardName.split('//', 1);
                    if (cardNameFront) {
                        cardNameFront = cardNameFront.trim();
                        if (cardNameFront !== cardName) {
                            if (cardQuantities.hasOwnProperty(cardNameFront)) {
                                cardQuantities[cardNameFront] += parseInt(cardAmount.trim());
                            } else {
                                cardQuantities[cardNameFront] = parseInt(cardAmount.trim());
                            }
                        }
                    }
        
                    if (cardQuantities.hasOwnProperty(cardName)) {
                        cardQuantities[cardName] += parseInt(cardAmount.trim());
                    } else {
                        cardQuantities[cardName] = parseInt(cardAmount.trim());
                    }
                }
            } catch (error) {
                console.error(`Error processing line ${lineNum}: "${line}"\nError:\n`, error);
            }
            lineNum++;
        }
        
        // Save the card quantities to chrome.storage.local
        chrome.storage.local.set({'collectionFilepath': file.name, 'cardQuantities': cardQuantities}, function() {
            if (chrome.runtime.lastError) {
                console.error('Error storing cardQuantities:\n', chrome.runtime.lastError);
                return;
            }
            console.log('Collection stored in chrome.storage.local');
            document.getElementById('statusMessage').textContent = 'Collection file loaded [you may close this config window now]';
        });
    }

    document.getElementById('statusMessage').textContent = 'Loading collection file... [don\'t close this config window yet]';

    // Read the file
    reader.readAsText(file);
});

document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get(['collectionFilepath'], function(result) {
        if (chrome.runtime.lastError) {
            console.error('Error retrieving collection filepath:', chrome.runtime.lastError);
            return;
        }
    
        if (result.collectionFilepath) {
            console.log('Got collection filepath:', result.collectionFilepath);
            document.getElementById('statusMessage').textContent = 'Loaded collection file: ' + result.collectionFilepath;
        } else {
            console.log('No collection filepath in chrome.storage.local');
            document.getElementById('statusMessage').textContent = 'Loaded collection file: None';
        }
    });

    // Load LICENSE text into popup_config.html
    fetch(chrome.runtime.getURL('LICENSE'))
        .then(response => response.text())
        .then(data => {
            document.getElementById('license').textContent = data;
        })
        .catch(error => {
            console.error(`Error loading LICENSE:\n${error}`);
        });

    // Load DISCLAIMER text into popup_config.html
    fetch(chrome.runtime.getURL('DISCLAIMER'))
        .then(response => response.text())
        .then(data => {
            document.getElementById('disclaimer').textContent = data;
        })
        .catch(error => {
            console.error(`Error loading DISCLAIMER:\n${error}`);
        });
});