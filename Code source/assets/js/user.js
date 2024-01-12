jQuery(document).ready(function() {
    var idPlayers = ['0xFD24', '0xFD25', '0xFD26', '0xFD27'];
    var players = {};

    idPlayers.forEach(function(player) {
        players[player] = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
    });
});

