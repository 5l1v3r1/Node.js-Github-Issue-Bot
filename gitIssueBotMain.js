var irc = require('irc');

var SETTINGS = {};
SETTINGS.channelname = '#firefly';

var client = new irc.Client('irc.esper.net', 'TicketBot626', {
    port: 6667
    , channels: [SETTINGS.channelname]
    , showErrors: true
    , secure: false
});

client.addListener("join#firefly", function() {
    console.log("connect event");
});

client.addListener("message" + SETTINGS.channelname, function(from, message) {
    console.log("connect event");
});


client.addListener("error", function() {
    console.log("error event");
});
