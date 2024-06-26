chrome.storage.local.get('cardQuantities').then(
    function(result) {
        let cardQuantities = result.cardQuantities;

        console.log('cardQuantities: ', cardQuantities);

        if (!cardQuantities) {
            console.log('No card quantities found in storage. Make sure to load a collection file from the extension menu.');
            return;
        }

        // <img> nodes we've already processed
        let processedImages = new Set();
    
        let processImage = function(img) {

            // Skip images we've already processed
            if (processedImages.has(img)) {
                return;
            }
            
            // Find the parent <div> of the <img>, to deal with split cards
            let parentDiv = img.parentNode;
            while (parentDiv && parentDiv.nodeName !== 'DIV') {
                parentDiv = parentDiv.parentNode;
            }

            // If the parent <div> contains other processed imgs, skip 
            // this <img>. This is to deal with split cards and 
            // partner commanders on EDHREC.
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
                    return;
                }
            } else {
                // Quick-fix: If we didn't find a parent <div>, just use the <img>'s parent
                parentDiv = img.parentNode;
            }

            // Make a note that we've now processed this <img>
            processedImages.add(img);

            // Clean up the card name from the image's alt text
            let cardName = img.alt
                .toLowerCase()
                .replace(/ [-a-z0-9]*[0-9][-a-z0-9]*$/, '')  // Replace trailing combinations of numbers, dashes, and letters
                .replace('product image for', '')  // Strip out "Product Image for"
                .replace('- full art', '')  // Strip out "- Full Art"
                .replace(/-\d+$/, '')  // Strip "-0", "-2", etc. from end
                .replace(/\(.*?\)/g, '')  // Strip out parentheses
                .replace(/\[.*?\]/g, '')  // Strip out square brackets
                .trim();
            
            let useCardNames = [];
            if (cardQuantities.hasOwnProperty(cardName)) {
                useCardNames.push(cardName);
            }

            // Faces of split cards -- actually for partner commanders on EDHREC
            if (cardName.includes('//')) {
                for (let splitPart of cardName.split('//')) {
                    splitPart = splitPart.trim();
                    if (cardQuantities.hasOwnProperty(splitPart)) {
                        useCardNames.push(splitPart);
                    } else {
                        useCardNames.push(null);
                    }
                }
            }

            let quantityString = 'Collected: ';
            if (useCardNames.some(cardName => cardName !== null)) {
                quantityString += useCardNames.map(cardName => cardQuantities[cardName] ? cardQuantities[cardName] : 0).join(' // ');
            } else {
                useCardNames = [];
            }
            
            if (useCardNames.length > 0) {
                // We have a copy of this card, so add a label to the image
                // console.log('HAVE ' + cardName + ' (' + cardQuantities[cardName] + ')');
                let quantityLabel = document.createElement('div');
                quantityLabel.textContent = quantityString;
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
        };

        let processImages = function() {
            let images = document.getElementsByTagName('img');
            // console.log('Found ' + images.length + ' images');
    
            for (let img of images) {
                processImage(img);
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
    });