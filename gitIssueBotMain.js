var irc = require('irc');
var githubAPI = require('github');

var SETTINGS = {};
var SETTINGS.IRC = {};
var SETTINGS.GIT = {};

SETTINGS.IRC.channelname = '#firefly';
SETTINGS.IRC.servername = 'irc.esper.net';
SETTINGS.IRC.botname = 'TicketBot';

SETTINGS.GIT.user = 'PherricOxide';
SETTINGS.GIT.user = 'gitIssueBot';

SETTINGS.pollTime = 5000;

var client = new irc.Client(SETTINGS.IRC.servername, SETTINGS.IRC.botname, {
    port: 6667
    , channels: [SETTINGS.channelname]
    , showErrors: true
    , secure: false
});

var github = new githubAPI({
    version: "3.0.0"
});

var lastSeenTicket = 0;

function poll() {
    console.log("connect event");

    github.issues.repoIssues({
	user: "DataSoft"
	, repo: "Nova"
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
    client.say(SETTINGS.channelname, "***" + issue.url + "***");
    client.say(SETTINGS.channelname, "***" + issue.user.login + ": " + issue.title + "***");
}


client.addListener("join" + SETTINGS.channelname, function() {
    var timer = setInterval(poll, SETTINGS.pollTime);
});

client.addListener("message" + SETTINGS.channelname, function(from, message) {
});


client.addListener("error", function(err) {
    console.log("error event");
    console.log(err);
});


