// Saves options to chrome.storage
function save_options() {
    var token = document.getElementById('token').value;
    chrome.storage.sync.set({
        token: token
    }, function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);

        chrome.extension.getBackgroundPage().init();
    });
}

function restore_options() {
    chrome.storage.sync.get({
        token: null
    }, function(items) {
        document.getElementById('token').value = items.token;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',save_options);
