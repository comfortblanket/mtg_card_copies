console.log('contentScript.js loaded');

// collection.csv file is usually from deckstats.net export. Format is:
//     First line is ignored (assumed to be header)
//     Empty lines are ignored
//     Lines are assumed to have values separated by commas
//     Values can be optionally enclosed in double quotes
//     Commas inside double quotes are ignored
//     First value in row is assumed to be the quantity
//     Second value in row is assumed to be the card name
//     Other values are ignored
fetch(chrome.runtime.getURL('collection.csv'))
    .then(response => response.text())
    .then(data => {
        let cardQuantities = {};
        let lines = data.split('\n');

        // Skip the header row
        lines.shift();

        for (let line of lines) {
            // Find the first comma in the line
            let commaIndex = line.indexOf(',');
        
            // Skip lines without a comma
            if (commaIndex === -1) {
                continue;
            }
        
            // Split the line at the first comma to get the amount and the rest of the line
            let amount = line.substring(0, commaIndex);
            let remainingRow = line.substring(commaIndex + 1);
            let cardName;

            // Check if rest is undefined
            if (remainingRow) {
                // Check the first character of the rest of the line
                if (remainingRow.startsWith('"')) {
                    // If it's a double quote, keep going until we reach another double quote
                    let endQuoteIndex = remainingRow.indexOf('"', 1);
                    cardName = remainingRow.substring(1, endQuoteIndex);
                } else {
                    // Otherwise, go until the next comma
                    let nextCommaIndex = remainingRow.indexOf(',');
                    cardName = remainingRow.substring(0, nextCommaIndex);
                }

                // Convert cardName to lowercase before storing
                cardName = cardName.trim().toLowerCase();

                // Also store the front side of split cards, same as the whole card name
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

        // console.log('cardQuantities: ', cardQuantities);

        console.log('Done loading collection.csv');
        
        console.log('window.location.hostname: ', window.location.hostname);
        if (window.location.hostname === 'edhrec.com' || window.location.hostname === 'www.tcgplayer.com') {
            // EDHREC and TCGPlayer

            // <img> nodes we've already processed
            let processedImages = new Set();
        
            let processImages = function() {
                let images = document.getElementsByTagName('img');
                // console.log('Found ' + images.length + ' images');
        
                // Skip images we've already processed
                for (let img of images) {
                    if (processedImages.has(img)) {
                        continue;
                    }
                    
                    // Find the parent <div> of the <img>, to deal with split cards
                    let parentDiv = img.parentNode;
                    while (parentDiv && parentDiv.nodeName !== 'DIV') {
                        parentDiv = parentDiv.parentNode;
                    }

                    // If the parent <div> contains other processed imgs, skip this <img>
                    if (parentDiv) {
                        let foundOtherImg = false;
                        let otherImgs = parentDiv.getElementsByTagName('img');

                        for (let otherImg of otherImgs) {
                            if (processedImages.has(otherImg)) {
                                foundOtherImg = true;
                                break;
                            }
                        }

                        if (foundOtherImg) {
                            continue;
                        }
                    }

                    // Note that we've now processed this <img>
                    processedImages.add(img);

                    // Clean up the card name from the image's alt text
                    let cardName = img.alt
                        .replace(/-\d+$/, '')  // Strip "-0", "-2", etc. from end
                        .replace(/\(.*?\)/g, '')  // Strip out parentheses
                        .trim()
                        .toLowerCase();

                    if (cardQuantities.hasOwnProperty(cardName)) {
                        // We have a copy of this card, so add a label to the image
                        let quantityLabel = document.createElement('div');
                        quantityLabel.textContent = 'Collected: ' + cardQuantities[cardName];
                        quantityLabel.style.position = 'absolute';
                        quantityLabel.style.right = '0';
                        quantityLabel.style.top = '50%';
                        quantityLabel.style.transform = 'translateY(-100%)';
                        quantityLabel.style.backgroundColor = 'gray';
                        quantityLabel.style.color = 'white';
                        quantityLabel.style.fontWeight = 'bold';
                        quantityLabel.style.padding = '5px';
                        quantityLabel.style.opacity = '0.7';
                        quantityLabel.style.display = 'flex';
                        quantityLabel.style.alignItems = 'center';
                        quantityLabel.style.justifyContent = 'center';

                        // Set z-index (mostly for EDHREC) to make sure it's on top of everything
                        //     5 goes behind everything
                        //     6 goes between back and front
                        //     7 goes on top of front but behind back card brought forward
                        //     8 goes on top of everything
                        //     10 should be nice and safe
                        quantityLabel.style.zIndex = '10';

                        parentDiv.style.position = 'relative';
                        parentDiv.appendChild(quantityLabel);
                    }
                }
            };
        
            // Run processImages every 1.5 seconds, mostly for EDHREC, which loads images dynamically
            setInterval(processImages, 1500);
        }

    });
