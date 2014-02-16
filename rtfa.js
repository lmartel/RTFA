
/**
 * The content script. Hides comment links on page load, 
 * reveals them after the article link has been clicked.
 * Requires a page reload to reveal the comments. 
 * This is intentional; opening in a new tab makes it too easy to cheat.
 */

function site(t, c, f){ return { titles: t, comments: c, getArticle: f }; }

var HACKER_NEWS = site(".title a", /[0-9]+ comments?|discuss/, function(){
    return $(this).closest("tr").prev("tr").find(".title a").attr("href");
});
var REDDIT = site("a.title", /[0-9]+ comments?|comment/, function(){
    return $(this).closest(".entry").find("a.title").attr("href");
});

var VISITED = "visited";

switch(document.location.hostname){
    case "news.ycombinator.com":
        initialize(HACKER_NEWS);
        break;

    case "www.reddit.com":
        initialize(REDDIT);
        break;

    default:
        // Do nothing
        break;
}
    
function initialize(site){
    var commentLinks = $("a").filter(function(){
        return this.text.match(site.comments);
    }).hide();
    var articleUrls = $.makeArray(commentLinks.map(site.getArticle));

    chrome.runtime.sendMessage({ 
        init: true,
        urls: articleUrls
    }, function(response){
        var visitedUrls = response[VISITED];

        commentLinks.filter(function(index){
            return visitedUrls.indexOf(articleUrls[index]) !== -1;
        }).show();
    });

    $(site.titles).on("click", function(e){
        chrome.runtime.sendMessage({ url: this.href }, function(){});
    });
}
