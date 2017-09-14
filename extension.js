var successColor = '#5cb85c';
var warningColor = '#f0ad4e';
var errorColor = '#d9534f';
var okLimit = 1;
var warningLimit = 3;
var pollInterval = 1;   //in minutes
var username = '';
var usernameURL = 'https://api.github.com/user';
var searchReviewsURL = 'https://api.github.com/search/issues?q=type:pr is:open review-requested:';
var searchAssigneesURL = 'https://api.github.com/search/issues?q=type:pr is:open assignee:';

var assigneesURL = 'https://github.com/pulls/assigned';
var reviewsURL = 'https://github.com/pulls/review-requested';
var optionsURL = 'chrome://extensions/?options=' + chrome.runtime.id;

var tokenOk = true;
var reviewsCounter = 0;
var pullRequestUrls = [];

// open options page on a fresh installation
chrome.runtime.onInstalled.addListener(function (object) {
    if (chrome.runtime.OnInstalledReason.INSTALL === object.reason) {
        chrome.tabs.create({url: optionsURL});
    }
});

setInterval(updateCounter, pollInterval * (60 * 1000));
init();

function openCurrentURL() {
    if (tokenOk) {
        if (pullRequestUrls.length === 1) {
            chrome.tabs.create({'url': pullRequestUrls[0]});
        }
        else {
            if (pullRequestUrls.length === 0 || pullRequestUrls.length !== reviewsCounter) {
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
    updateCounter();
}


function getHtmlUrls(issues) {
    return issues.items.map(function(review) { return review.pull_request.html_url; });
}

function getUniquePullRequestUrls(reviewsResponse, assigneesResponse) {
    var reviewPullRequestUrls = getHtmlUrls(reviewsResponse);
    var assignedPullRequestUrls = getHtmlUrls(assigneesResponse);
    return reviewPullRequestUrls.concat(assignedPullRequestUrls).filter(function(v, i, a){ return a.indexOf(v) === i});
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
    pullRequestUrls = getUniquePullRequestUrls(reviewsResponse, assigneesResponse);
    reviewsCounter = reviewsResponse.total_count;
    chrome.browserAction.setBadgeText({text: '' + pullRequestUrls.length});
    var color = chooseColor(pullRequestUrls.length);
    chrome.browserAction.setBadgeBackgroundColor({color: color});
}

function executeRequest(url, token, successCallback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                successCallback(JSON.parse(xhr.responseText));
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

function updateCounter() {
    var reviewsResponse;
    var assigneesResponse;
    var token;

    chrome.storage.sync.get({
        token: null, username: null
    }, function (items) {
        token = items.token;
        username = items.username;
        if (username === null) {
            executeRequest(usernameURL, token, function (responseJSON) {
                username = responseJSON.login;
                chrome.storage.sync.set({username: username});
            });
        }
        executeRequest(searchReviewsURL + username, token, function (responseJSON) {
            reviewsResponse = responseJSON;
            executeRequest(searchAssigneesURL + username, token, function (responseJSON) {
                assigneesResponse = responseJSON;
                elaborateResponse(reviewsResponse, assigneesResponse);
            });
        });
    });
}


