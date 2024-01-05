browser.browserAction.onClicked.addListener(function(tab) {
    browser.windows.create({
        url: 'popup_config.html',
        width: 500,
        height: 600,
        type: 'popup'
    });
});