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
        
        // Save the card quantities to chrome.storage.local
        chrome.storage.local.set({'cardQuantities': cardQuantities}, function() {
            if (chrome.runtime.lastError) {
                console.error('Error storing cardQuantities:', chrome.runtime.lastError);
                return;
            }
        
            console.log('Collection stored in chrome.storage.local');
            document.getElementById('statusMessage').textContent = 'File loaded (you may close this popup now)';
        
            chrome.storage.local.get(['cardQuantities'], function(result) {
                if (chrome.runtime.lastError) {
                    console.error('Error retrieving cardQuantities:', chrome.runtime.lastError);
                    return;
                }
        
                if (result.cardQuantities) {
                    console.log('Retrieved card quantities:', result.cardQuantities);
                } else {
                    console.log('No card quantities in chrome.storage.local');
                }
            });
        });
    }

    reader.readAsText(file);
});

document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get(['filepath'], function(result) {
        if (chrome.runtime.lastError) {
            console.error('Error retrieving filepath:', chrome.runtime.lastError);
            return;
        }
    
        if (result.filepath) {
            console.log('Got filepath:', result.filepath);
            document.getElementById('statusMessage').textContent = 'Loaded file: ' + result.filepath;
        } else {
            console.log('No filepath in chrome.storage.local');
            document.getElementById('statusMessage').textContent = 'No file loaded';
        }
    });
});