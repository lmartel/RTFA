/**
* Handles requests sent by the content script.
* Tracks visited links, reports whether 
* loaded links have been visited before.
*/
var CAPACITY = 512;
var VISITED = "visited";

function onMessage(request, sender, sendResponse) {
    var response;
    if(request.init){
        onPage(request, sender, sendResponse);
    } else {
        onLink(request, sender, sendResponse);
    }
    return true; // Signals async response
}

// On page load, cross-reference urls against list of links previously visited
function onPage(request, sender, sendResponse){
    var links = request.urls;
    var response = {};
    chrome.storage.sync.get(VISITED, function(r){
        var storedHash = r[VISITED];
        if(storedHash){
            response[VISITED] = links.filter(function(link){
                return link in storedHash;
            });
        } else {
            response[VISITED] = [];
        } 
        sendResponse(response);
    });
}

// On link click, log the url as visited
function onLink(request, sender, sendResponse){
    chrome.storage.sync.get(VISITED, function(r){
        var urls;
        var storedHash = r[VISITED];
        if(storedHash){
            var storedKeys = Object.keys(storedHash);

            // If over capacity, clear out the oldest 50% of stored urls
            if(storedKeys.length > CAPACITY){
                var sorted = storedKeys.sort(function(k1,k2){
                    return storedHash[k1] - storedHash[k2];
                });
                for(var i = 0; i < storedKeys.length / 2; i++){
                    delete storedHash[storedKeys[i]];
                }
            }
            urls = storedHash;
        } else {
            urls = {};
        }

        // Timestamp used for deletion order when at capacity
        urls[request.url] = Date.now();
        var payload = {};
        payload[VISITED] = urls;
        chrome.storage.sync.set(payload, function(){});
        // We do not call sendResponse because the user has navigated away from the page
    });
}

// Listen for the content script to send a message to the background page.
chrome.runtime.onMessage.addListener(onMessage);
