#!/usr/bin/env node

import BodyParser from './body-parser';
import Config from './config';

if (!Config.smart_host){
    console.error("Please provide smart host");
    process.exit(0);
}

const MailParser = require("mailparser").MailParser;
const MemoryStream = require("memorystream");
const mailparser = new MailParser();

const PASS_TEMPLATE = require("passbook")("generic", {
    passTypeIdentifier: "pass.me.pilif.digipass",
    teamIdentifier: "R9U6Q6F846",
    backgroundColor: "rgb(255,255,255)",
    organizationName: "Not affiliated with Digitec",
});
PASS_TEMPLATE.keys("keys", Config.password);

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

    const t = require('nodemailer').createTransport({
        host: Config.smart_host,
        secure: false,
        name: 'digipass'
    });

    const s = new MemoryStream(null, {writable: true, readable: false});

    pass.on("end", function(){
        t.sendMail({
            from: "pilitec <digitec-passes@pilif.me>",
            to: `${mail_object.to[0].name} <${mail_object.to[0].address}>`,
            subject: mail_object.subject,
            text: mail_object.text,
            html: mail_object.html,
            attachments: {
                filename: 'order.pkpass',
                content: s.toBuffer()
            }
        }, function(error, info){
            if (error){
                console.error(error);
            }
        });
    });
    pass.pipe(s);
});

process.stdin.pipe(mailparser);
