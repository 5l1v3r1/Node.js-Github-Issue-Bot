var SETTINGS = {};
SETTINGS.IRC = {};
SETTINGS.GIT = {};

// ### Configure Here ### //
SETTINGS.IRC.channelName = '#firefly';
SETTINGS.IRC.serverName = 'irc.esper.net';
SETTINGS.IRC.botName = 'TicketBot';
SETTINGS.IRC.prefix = "New Ticket *** ";
SETTINGS.IRC.suffix = " ***";

SETTINGS.GIT.user = 'PherricOxide';
SETTINGS.GIT.repo = 'Node.js-Github-Issue-Bot';
SETTINGS.GIT.version = '3.0.0';

SETTINGS.pollTime = 5000;


// ### Code ### //
var irc = require('irc');
var githubAPI = require('github');

var client = new irc.Client(SETTINGS.IRC.serverName, SETTINGS.IRC.botName, {
    port: 6667
    , channels: [SETTINGS.IRC.channelName]
    , showErrors: true
    , secure: false
    , autoRejoin: true
    , autoConnect: true
});

var github = new githubAPI({
    version: SETTINGS.GIT.version
});

var lastSeenTicket = -1;


function poll() {
    github.issues.repoIssues({
	user: SETTINGS.GIT.user
	, repo: SETTINGS.GIT.repo
	, state: "open"
	, sort: "created"
	, page: 0
	, per_page: 5
    }, function(err, res) {
	for (var i = res.length - 1; i >= 0; i--) {
	    if (res[i].number > lastSeenTicket) {
		lastSeenTicket = res[i].number;
		SendIssueToIRC(res[i]);
	    } 
	}	
    });
}


function SendIssueToIRC(issue) {
    client.say(SETTINGS.IRC.channelName, SETTINGS.IRC.prefix + issue.url + SETTINGS.IRC.suffix);
    client.say(SETTINGS.IRC.channelName, SETTINGS.IRC.prefix + issue.user.login + ": " + issue.title + SETTINGS.IRC.suffix);
}


client.addListener("join" + SETTINGS.IRC.channelName, function() {
    var timer = setInterval(poll, SETTINGS.pollTime);
});


client.addListener("error", function(err) {
    console.log("error event");
    console.log(err);
});

// Use this if we ever want to parse user commands
//client.addListener("message" + SETTINGS.IRC.channelName, function(from, message) {});

