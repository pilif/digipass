import Config from './config';

export default function(process_stream){
    const LMTPServer = require('smtp-server').LMTPServer;
    const server = new LMTPServer({

        logger: false,
        banner: 'digipass LMTP server',
        disabledCommands: ['STARTTLS'],

        authMethods: [],
        authOptional: true,

        // Accept messages up to 10 MB
        size: 10 * 1024 * 1024,

        // Validate RCPT TO envelope address. Example allows all addresses that do not start with 'deny'
        // If this method is not set, all addresses are allowed
        onRcptTo: function (address, session, callback) {
            if (address.address != Config.service_email_address) {
                return callback(new Error('Unknown User'));
            }
            callback();
        },

        // Handle message stream
        onData: function (stream, session, callback) {
            let per_recipient = {};
            stream.resume();
            let promises = [];
            session.envelope.rcptTo.forEach(function(recpipient, idx) {
                promises.push(new Promise(function(fulfill, reject){
                    process_stream(recpipient, stream).then(function(info){
                        fulfill(recpipient.address);
                    }, function(err){
                        reject({rec: recpipient.address, err: err});
                    });
                }));
            });
            let ready = Promise.resolve(null);
            promises.forEach(function(promise){
                ready = ready.then(function(){
                    return promise;
                }).then(function(rec){
                    per_recipient[rec] = [null, '2.0.0 queued'];
                }, function(err){
                    per_recipient[err.rec] = [{responseCode: 550, message: "5.5.0 "+err.err}]
                })
            });
            ready.then(function(){
                callback(null, per_recipient);
            });
        }
    });
    server.on('error', function (err) {
        console.log('Error occurred');
        console.log(err);
    });

    return server;
}
