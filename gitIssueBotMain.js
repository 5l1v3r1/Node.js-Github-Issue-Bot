var SETTINGS = {};
SETTINGS.IRC = {};
SETTINGS.GIT = {};
SETTINGS.GIT.user = new Array();
SETTINGS.GIT.repo = new Array();

// ### CONFIGURE IRC BOT HERE ### //
SETTINGS.IRC.serverName = 'irc.esper.net';
SETTINGS.IRC.botName = 'TicketBot';
SETTINGS.IRC.channelName = '#firefly';
SETTINGS.IRC.prefix = "New Ticket *** ";
SETTINGS.IRC.suffix = " ***";

SETTINGS.GIT.version = '3.0.0';
SETTINGS.pollTime = 5000;

// ### Repositories to announce new issues on ### //
SETTINGS.GIT.user.push('PherricOxide');
SETTINGS.GIT.repo.push('Node.js-Github-Issue-Bot');

SETTINGS.GIT.user.push('DataSoft');
SETTINGS.GIT.repo.push('Nova');

SETTINGS.GIT.user.push('DataSoft');
SETTINGS.GIT.repo.push('Honeyd');




// ### Check Configuration ### //
if (SETTINGS.GIT.user.length != SETTINGS.GIT.repo.length) {
    console.log("Each user must also have a repository set.");
}

// ### Code ### //
var irc = require('irc');
var githubAPI = require('github');

var lastSeenTicket = new Array();
for (var i = 0; i < SETTINGS.GIT.user.length; i++) {
    lastSeenTicket[i] = -1; 
}

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



function poll() {
    for (var repoIndex = 0; repoIndex < SETTINGS.GIT.user.length; repoIndex++) {
    (function(repoIndex) {
	github.issues.repoIssues({
	    user: SETTINGS.GIT.user[repoIndex]
	    , repo: SETTINGS.GIT.repo[repoIndex]
	    , state: "open"
	    , sort: "created"
	    , page: 0
	    , per_page: 5
	}, function(err, res) {
	    if (err != null) {
		console.log("ERROR when polling git for issues");
		console.log(err);
	    }
	   
	    if (res.length > 0 && lastSeenTicket[repoIndex] < 0) {
		lastSeenTicket[repoIndex] = res[0].number; 
	    } else {
		for (var i = res.length - 1; i >= 0; i--) {
		    if (res[i].number > lastSeenTicket[repoIndex]) {
			lastSeenTicket[repoIndex] = res[i].number;
			SendIssueToIRC(res[i]);
		    } 
		}	
	    }

	});
    })(repoIndex);
    }
}


function SendIssueToIRC(issue) {
    client.say(SETTINGS.IRC.channelName, SETTINGS.IRC.prefix + issue.url + SETTINGS.IRC.suffix);
    client.say(SETTINGS.IRC.channelName, SETTINGS.IRC.prefix + issue.user.login + ": " + issue.title + SETTINGS.IRC.suffix);
}


client.addListener("join" + SETTINGS.IRC.channelName, function() {
    console.log("Joined channel " + SETTINGS.IRC.channelName);
    var timer = setInterval(poll, SETTINGS.pollTime);
    console.log("Polling github for new issues every " + SETTINGS.pollTime + "ms");
});


client.addListener("error", function(err) {
    console.log("Error event!");
    console.log(err);
});

// Use this if we ever want to parse user commands
//client.addListener("message" + SETTINGS.IRC.channelName, function(from, message) {});

