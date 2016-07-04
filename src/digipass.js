var MailParser = require("mailparser").MailParser;
var mailparser = new MailParser();
var fs = require("fs");

// TODO: web-scrape these
const STORES = new Map([
    [246967, [47.5491957, 7.588085200000023]], // Basel
    [246970, [46.9474816, 7.434965899999952]], // Bern
    [246971, [47.4195894, 8.394749499999989]], // Dietikon
    [246968, [47.0293225, 8.297715100000005]], // Kriens
    [246965, [46.5266573, 6.604323799999975]], // Lausanne
    [246974, [47.4310149, 9.395604300000059]], // St. Gallen
    [246969, [47.4970772, 8.714906700000029]], // Winterthur
    [246956, [47.3517273, 8.261768399999937]], // Wohlen
    [246938, [47.3901528, 8.51441920000002]]   // Zürich
]);

const PASS_TEMPLATE = require("passbook")("generic", {
    passTypeIdentifier: "pass.me.pilif.digipass",
    teamIdentifier: "R9U6Q6F846",
    backgroundColor: "rgb(255,255,255)",
    organizationName: "Not affiliated with Digitec",
});
PASS_TEMPLATE.keys("keys", process.env.DIGIPASS_KEY);

function getOrderNumber(text){
    const [_, lang, oid]  = text.match(/https?:\/\/www.digitec.ch\/([a-z]{2})\/Order\/(\d+)\s+/);
    return [lang, oid];
}

function getStoreCoords(text){
    const [_, store]  = text.match(/https?:\/\/www.digitec.ch\/[a-z]{2}\/Site\/(\d+)\s+/);
    return STORES.get(parseInt(store, 10));
}

mailparser.on("end", function(mail_object){
    const [lang, oid] = getOrderNumber(mail_object.text);
    const coords = getStoreCoords(mail_object.text);

    let pass = PASS_TEMPLATE.createPass({
        serialNumber: require('node-uuid').v4(),
        description: "Abholung der Bestellung " + oid,
        logoText: "Nearly Digitec",
        barcodes: [{
            message: oid,
            altText: oid,
            format: "PKBarcodeFormatCode128",
            messageEncoding: "iso-8859-1"
        }],
        locations: [
            {"longitude": coords[0], "latitude": coords[1] }
        ],

    });
    pass.backFields.add("url", "Order on the web", "https://www.digitec.ch/de/Order/"+oid);
    pass.loadImagesFrom("art");
    pass.on("error", function(error) {
      console.error(error);
      process.exit(1);
    })
    const file = fs.createWriteStream(process.env.OUTDIR + "/blah.pkpass");
    pass.pipe(file);
});

process.stdin.pipe(mailparser);
