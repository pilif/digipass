import BodyParser from './body-parser';


const MailParser = require("mailparser").MailParser;
const mailparser = new MailParser();
const fs = require("fs");

const PASS_TEMPLATE = require("passbook")("generic", {
    passTypeIdentifier: "pass.me.pilif.digipass",
    teamIdentifier: "R9U6Q6F846",
    backgroundColor: "rgb(255,255,255)",
    organizationName: "Not affiliated with Digitec",
});
PASS_TEMPLATE.keys("keys", process.env.DIGIPASS_KEY);

mailparser.on("end", function(mail_object){
    const parser = new BodyParser(mail_object.text);
    const store = parser.getStore();
    const coords = store.get("coords");

    let pass = PASS_TEMPLATE.createPass({
        serialNumber: require('node-uuid').v4(),
        description: "Bestellung " + parser.getOid(),
        logoText: "pilitec",
        barcodes: [{
            message: parser.getOid(),
            format: "PKBarcodeFormatCode128",
            messageEncoding: "iso-8859-1"
        }],
        locations: [
            {"longitude": coords[0], "latitude": coords[1] }
        ],

    });
    pass.primaryFields.add("title", null, "Digitec Bestellung");
    pass.secondaryFields.add("oid", "Bestellnummer", parser.getOid());
    pass.secondaryFields.add("store", "Store", store.get("store"));
    pass.backFields.add("url", "Order on the web", parser.getOrderUrl());
    pass.backFields.add("address", "Address", store.get("address"));
    pass.loadImagesFrom("art");
    pass.on("error", function(error) {
      console.error(error);
      process.exit(1);
    });
    const file = fs.createWriteStream(process.env.OUTDIR + "/blah.pkpass");
    pass.pipe(file);
});

process.stdin.pipe(mailparser);
