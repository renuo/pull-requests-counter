function openPullRequestPage() {
    chrome.browserAction.onClicked.addListener(function (tab) {
        chrome.tabs.create({'url': 'https://github.com/pulls/assigned'}, function (tab) {
            // Tab opened.
        });
    });
}

setInterval(performCall, 5 * (60 * 1000));  //every five minutes

openPullRequestPage();
performCall();

var successColor = '#5cb85c';
var warningColor = '#f0ad4e';
var errorColor = '#d9534f';

function performCall() {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                var issues = JSON.parse(xhr.responseText);
                var counter = 0;
                for (i = 0; i < issues.length; i++) {
                    var issue = issues[i];
                    if (issue['pull_request']) {
                        counter++;
                    }
                }

                console.log(xhr.responseText);

                chrome.browserAction.setBadgeText({text: '' + counter});

                if (counter == 0) {
                    chrome.browserAction.setBadgeBackgroundColor({color: successColor});
                }
                else if (counter < 3) {
                    chrome.browserAction.setBadgeBackgroundColor({color: warningColor});
                }
                else {
                    chrome.browserAction.setBadgeBackgroundColor({color: errorColor});
                }
            }
            else if (xhr.status == 401) {
                chrome.browserAction.setBadgeText({text: 'X'});
                chrome.browserAction.setBadgeBackgroundColor({color: errorColor});

                chrome.browserAction.onClicked.addListener(function (tab) {
                    chrome.tabs.create({'url': 'chrome://extensions/?options=' + chrome.runtime.id});
                });
            }
        }
    };

    var username, token;
    chrome.storage.sync.get({
        username: null,
        token: null
    }, function (items) {
        username = items.username;
        token = items.token;
        xhr.open("GET", 'https://api.github.com/orgs/renuo/issues', true);
        xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ':' + token));
        xhr.send();
    });
}


