var successColor = '#5cb85c';
var warningColor = '#f0ad4e';
var errorColor = '#d9534f';
var okLimit = 1;
var warningLimit = 3;
var pollInterval = 1;   //in minutes
var issuesURL = 'https://api.github.com/orgs/renuo/issues';

var pullRequestsURL = 'https://github.com/pulls/assigned';
var optionsURL = 'chrome://extensions/?options=' + chrome.runtime.id;

var currentURL = pullRequestsURL;

setInterval(performCall, pollInterval * (60 * 1000));  //every five minutes
init();

function openCurrentURL() {
    chrome.tabs.create({'url': currentURL}, function (tab) {
        // Tab opened.
    });
}
function init() {
    currentURL = pullRequestsURL;
    chrome.browserAction.onClicked.removeListener(openCurrentURL);
    chrome.browserAction.onClicked.addListener(openCurrentURL);
    performCall();
}

function countPullRequests(issues) {
    var counter = 0;
    for (var i = 0; i < issues.length; i++) {
        var issue = issues[i];
        if (issue['pull_request']) {
            counter++;
        }
    }
    return counter;
}
function elaborateResponse(issues) {
    var counter = countPullRequests(issues);

    chrome.browserAction.setBadgeText({text: '' + counter});

    var color = errorColor;
    if (counter < okLimit) {
        color = successColor;
    }
    else if (counter < warningLimit) {
        color = warningColor;
    }
    else {
        color = errorColor;
    }
    chrome.browserAction.setBadgeBackgroundColor({color: color});
}

function performCall() {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                var issues = JSON.parse(xhr.responseText);
                elaborateResponse(issues);

            }
            else if (xhr.status == 401) {
                chrome.browserAction.setBadgeText({text: 'X'});
                chrome.browserAction.setBadgeBackgroundColor({color: errorColor});
                currentURL = optionsURL;
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
        xhr.open('GET', issuesURL, true);
        xhr.setRequestHeader('Authorization', 'Basic ' + btoa(username + ':' + token));
        xhr.send();
    });
}


