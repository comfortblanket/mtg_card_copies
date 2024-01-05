
// Called when the user clicks on the browser action button.
browser.browserAction.onClicked.addListener(function(tab) {

    // Create a new window for the config page, instead of a popup which 
    // doesn't play nice with the file input (it closes as soon as you click 
    // 'Browse...', and then the load script stops running)
    browser.windows.create({
        url: 'src/config/popup_config.html',
        width: 550,
        height: 650,
        type: 'popup'
    });
});