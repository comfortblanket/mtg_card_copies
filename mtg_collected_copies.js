
let openRequest = indexedDB.open("MyDatabase", 1);

openRequest.onupgradeneeded = function(e) {
    let db = e.target.result;
    db.createObjectStore("MyStore", {keyPath: "id"});
};

openRequest.onsuccess = function(e) {
    let db = e.target.result;
    let transaction = db.transaction("MyStore", "readonly");
    let store = transaction.objectStore("MyStore");
    let request = store.get("cardQuantities");

    request.onsuccess = function() {
        let cardQuantities = request.result ? request.result.value : null;

        console.log('cardQuantities: ', cardQuantities);

        if (!cardQuantities) {
            console.log('No card quantities found in storage. Make sure to load a collection file from the extension menu.');
            return;
        }

        console.log('window.location.hostname: ', window.location.hostname);
        if (
                    window.location.hostname === 'edhrec.com' || 
                    window.location.hostname === 'www.tcgplayer.com' ||
                    window.location.hostname === 'scryfall.com'
                ) {

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
                        .toLowerCase()
                        .replace('product image for', '')  // Strip out "Product Image for"
                        .replace('- full art', '')  // Strip out "- Full Art"
                        .replace(/-\d+$/, '')  // Strip "-0", "-2", etc. from end
                        .replace(/\(.*?\)/g, '')  // Strip out parentheses
                        .trim();

                    if (cardQuantities.hasOwnProperty(cardName)) {
                        // We have a copy of this card, so add a label to the image
                        // console.log('HAVE ' + cardName + ' (' + cardQuantities[cardName] + ')');
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
        
            // Create a MutationObserver to watch for changes in the DOM
            let observer = new MutationObserver(function(mutations) {
                // If any mutation adds nodes, run processImages
                for (let mutation of mutations) {
                    if (mutation.addedNodes.length) {
                        processImages();
                        break;
                    }
                }
            });
        
            // Start observing the document with the configured parameters
            observer.observe(document, { childList: true, subtree: true });
        }
    };

    request.onerror = function() {
        console.error('Error getting card quantities from IndexedDB:', request.error);
    };
};

openRequest.onerror = function(e) {
    console.error('Error opening IndexedDB:', e.target.error);
};