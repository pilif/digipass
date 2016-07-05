const DIGIPASS_ADDRESS = 'digipass@pilif.me';
const ARGV = require('yargs')
    .usage('Usage: $0 -s smarthost -p password [-l <host>:<port>]')
    .demand(['s', 'k'])
    .describe('s', 'smarthost to use (defaults to SMART_HOST env)')
    .describe('k', 'password for the private key (defaults to DIGIPASS_KEY)')
    .describe('l', 'run LMTP daemon on <host>:<port>')
    .nargs('l', 1)
    .default('s', process.env.SMART_HOST)
    .default('k', process.env.DIGIPASS_KEY)
    .help('h')
    .alias('h', 'help')
    .argv;

let host = null;
let port = null;

if (ARGV.l) {
    [host, port] = (""+ARGV.l).split(/:/);
    if (host && !port) {
        port = host;
        host = undefined;
    }
}

export default {
    smart_host: ARGV.s,
    password: ARGV.k,
    lmtp_port: parseInt(port, 10),
    lmtp_host: host,
    service_email_address: DIGIPASS_ADDRESS,
}
