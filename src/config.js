const ARGV = require('yargs')
    .usage('Usage: $0 -s smarthost -p password [-p <port>]')
    .demand(['s', 'k'])
    .describe('s', 'smarthost to use (defaults to SMART_HOST env)')
    .describe('k', 'password for the private key (defaults to DIGIPASS_KEY)')
    .describe('p', 'run LMTP daemon on <port>')
    .nargs('p', 1)
    .default('s', process.env.SMART_HOST)
    .default('k', process.env.DIGIPASS_KEY)
    .help('h')
    .alias('h', 'help')
    .argv;

export default {
    smart_host: ARGV.s,
    password: ARGV.k,
    lmtp_port: ARGV.p,
}
