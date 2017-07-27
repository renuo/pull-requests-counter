var successColor = '#5cb85c';
var warningColor = '#f0ad4e';
var errorColor = '#d9534f';
var okLimit = 1;
var warningLimit = 3;
var pollInterval = 1;   //in minutes
var issuesURL = 'https://api.github.com/issues';
var searchReviewsURL = 'https://api.github.com/search/issues?q=type:pr review-requested:coorasse is:open';
var searchAssigneesURL = 'https://api.github.com/search/issues?q=type:pr assignee:coorasse is:open';

var assigneesURL = 'https://github.com/pulls/assigned';
var reviewsURL = 'https://github.com/pulls/review-requested';
var optionsURL = 'chrome://extensions/?options=' + chrome.runtime.id;

var tokenOk = true;
var reviewsCounter = 0;
var assigneesCounter = 0;
var totalCounter = 0;
var pullRequestURL = '';

// open options page on a fresh installation
chrome.runtime.onInstalled.addListener(function (object) {
    if (chrome.runtime.OnInstalledReason.INSTALL === object.reason) {
        chrome.tabs.create({url: optionsURL});
    }
});

setInterval(performCall, pollInterval * (60 * 1000));
init();

function openCurrentURL() {
    if (tokenOk) {
        if (totalCounter === 1) {
            chrome.tabs.create({'url': pullRequestURL});
        }
        else {
            if (totalCounter === 0 || assigneesCounter > 0) {
                chrome.tabs.create({'url': assigneesURL});
            }
            if (reviewsCounter > 0) {
                chrome.tabs.create({'url': reviewsURL});
            }
        }
    }
    else {
        chrome.tabs.create({'url': optionsURL});
    }
}

function init() {
    tokenOk = true;
    chrome.browserAction.onClicked.removeListener(openCurrentURL);
    chrome.browserAction.onClicked.addListener(openCurrentURL);
    performCall();
}


function countPullRequests(issues) {
    return issues.total_count;
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

function elaborateResponse(reviewsResponse, assigneesResponse) {
    reviewsCounter = countPullRequests(reviewsResponse);
    assigneesCounter = countPullRequests(assigneesResponse);
    totalCounter = assigneesCounter + reviewsCounter;
    chrome.browserAction.setBadgeText({text: '' + totalCounter});
    var color = chooseColor(assigneesCounter);
    chrome.browserAction.setBadgeBackgroundColor({color: color});
    if (totalCounter === 1) {
        var response = null;
        if (reviewsCounter === 1) {
            response = reviewsResponse
        }
        else {
            response = assigneesResponse
        }
        pullRequestURL = response.items[0].html_url
    }
}

function executeRequest(url, token, successCallback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                successCallback(xhr.responseText);
            }
            else if (xhr.status === 401) {
                chrome.browserAction.setBadgeText({text: 'X'});
                chrome.browserAction.setBadgeBackgroundColor({color: errorColor});
                tokenOk = false;
            }
        }
    };
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(':' + token));
    xhr.send();
}

function performCall() {
    var reviewsResponse;
    var assigneesResponse;
    var token;

    chrome.storage.sync.get({
        token: null
    }, function (items) {
        token = items.token;
        executeRequest(searchReviewsURL, token, function (responseText) {
            reviewsResponse = JSON.parse(responseText);
            executeRequest(searchAssigneesURL, token, function (responseText) {
                assigneesResponse = JSON.parse(responseText);
                elaborateResponse(reviewsResponse, assigneesResponse);
            });
        });
    });
}


