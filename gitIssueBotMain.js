//============================================================================
// Name        : githIssueBotMain.js
// Copyright   : David Clark (PherricOxide) 2012
//	This is free software: you can redistribute it and/or modify
//   it under the terms of the GNU General Public License as published by
//   the Free Software Foundation, either version 3 of the License, or
//   (at your option) any later version.
//
//   This is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//   GNU General Public License for more details.
//
//   You should have received a copy of the GNU General Public License
//   along with this software.  If not, see <http://www.gnu.org/licenses/>.
// Description : Github issue tracker IRC bot. Announces new github issues.
//============================================================================

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
SETTINGS.pollTime = 100000;

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

var polling = false;

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
	    , per_page: 25
	}, function(err, res) {
	    if (err != null) {
		console.log("ERROR when polling git for issues");
		console.log(err);
		return;
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

function SendHelp(to) {
	client.say(to, "!issue user/repo/number");
	client.say(to, "!milestones user/repo/(closed|open)");
	client.say(to, "!milestone user/repo/number");
	client.say(to, "!help");
}

function SendIssueToIRC(issue) {
    client.say(SETTINGS.IRC.channelName, SETTINGS.IRC.prefix + issue.html_url + SETTINGS.IRC.suffix);
    client.say(SETTINGS.IRC.channelName, SETTINGS.IRC.prefix + issue.user.login + ": " + issue.title + SETTINGS.IRC.suffix);
}

function SendIssueDetails(user, repo, number, to) {
	github.issues.getRepoIssue({
		user: user
		, repo: repo
		, number: number
	}, function(err, res) {
		if (err != null) {
			client.say(to, "ERROR when fetching ticket");
			console.log("ERROR when fetching ticket");
			console.log(err);
			return;	
		} else {
			client.say(to, res.html_url);
			client.say(to, number + ": " + res.title);
			client.say(to, res.body);
		}
	});	
}

function SendMilestoneList(user, repo, state, to) {
	console.log(user + " " + repo + " " + to);
	github.issues.getAllMilestones({
		user: user
		, repo: repo
		, state: state
	}, function(err, res) {
		if (err != null) {
			client.say(to, "ERROR when fetching milestones");
			console.log("ERROR when fetching milestones");
			console.log(err);
			return;	
		} else {
			for (var i = 0; i < res.length; i++) {
				client.say(to, res[i].number + ": " + res[i].title);
 
			}
		}
	});	

}

function SendMilestoneDetails(user, repo, milestone, to) {
	github.issues.getMilestone({
		user: user
		, repo: repo
		, number: milestone
	}, function(err, res) {
		if (err != null) {
			client.say(to, "ERROR when fetching milestone");
			console.log("ERROR when fetching milestone");
			console.log(err);
			return;	
		} else {
			client.say(to, "Title: " + res.title);
			client.say(to, "Opened Issues: " + res.open_issues);
			client.say(to, "Closed Issues: " + res.closed_issues);
			client.say(to, "State: " + res.state);
		}
	});	

}


client.addListener("join" + SETTINGS.IRC.channelName, function(nick, message) {
    if (nick == SETTINGS.IRC.botName && !polling) {
	console.log("Joined channel " + SETTINGS.IRC.channelName);
        polling = true;
        var timer = setInterval(poll, SETTINGS.pollTime);
        console.log("Polling github for new issues every " + SETTINGS.pollTime + "ms");
	poll();
    }
});


client.addListener("error", function(err) {
    console.log("Error event!");
    console.log(err);
});


// Use this if we ever want to parse user commands
// TODO: Accept PMs or monitoring multiple channels
client.addListener("message" + SETTINGS.IRC.channelName, function(from, message) {
	var match = message.match(/!issue (.+)\/(.+)\/#?(\d+)/);
	if (match != null) {SendIssueDetails(match[1], match[2], match[3], SETTINGS.IRC.channelName); return}
	
	match = message.match(/!help.*/);
	if (match != null) {SendHelp(SETTINGS.IRC.channelName); return}
	
	match = message.match(/!milestone (.+)\/(.+)\/#?(\d+)/);
	if (match != null) {SendMilestoneDetails(match[1], match[2], match[3], SETTINGS.IRC.channelName); return}
	
	match = message.match(/!milestones (.+)\/(.+)\/(.+)/);
	if (match != null) {SendMilestoneList(match[1], match[2], match[3], SETTINGS.IRC.channelName); return}
	
});

