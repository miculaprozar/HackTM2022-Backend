const fs = require('fs');

var ConfigurationService = (function() {

    var instance = null;

    function ConfigurationService() {
        //this.config =  JSON.parse(fs.readFileSync('MarkingManager/Backend/config.json', 'utf8'));
        this.config =  JSON.parse(fs.readFileSync('config.json', 'utf8'));
    }

    return {

        getInstance: function() {
            if (instance === null) {
                instance = new ConfigurationService();
                instance.constructor = null;
            }
            return instance;
        }
    };
})();

module.exports = ConfigurationService.getInstance();