var successColor = '#5cb85c';
var warningColor = '#f0ad4e';
var errorColor = '#d9534f';
var okLimit = 1;
var warningLimit = 3;
var pollInterval = 1;   //in minutes
var issuesURL = 'https://api.github.com/user/issues';

var pullRequestsURL = 'https://github.com/pulls/assigned';
var optionsURL = 'chrome://extensions/?options=' + chrome.runtime.id;

var tokenOk = true;

setInterval(performCall, pollInterval * (60 * 1000));  //every five minutes
init();

function openCurrentURL() {
    var url = tokenOk ? pullRequestsURL : optionsURL;
    chrome.tabs.create({'url': url});
}
function init() {
    tokenOk = true;
    chrome.browserAction.onClicked.removeListener(openCurrentURL);
    chrome.browserAction.onClicked.addListener(openCurrentURL);
    performCall();
}

function isIssue(element) {
    return !!element['pull_request'];
}

function countPullRequests(issues) {
    return issues.filter(isIssue).length;
}

function chooseColor(counter) {
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
    return color;
}

function elaborateResponse(issues) {
    var counter = countPullRequests(issues);

    chrome.browserAction.setBadgeText({text: '' + counter});

    var color = chooseColor(counter);

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
                tokenOk = false;
            }
        }
    };

    var username, token;
    chrome.storage.sync.get({
        token: null
    }, function (items) {
        token = items.token;
        xhr.open('GET', issuesURL, true);
        xhr.setRequestHeader('Authorization', 'Basic ' + btoa(':' + token));
        xhr.send();
    });
}


