#!/usr/bin/env node

import BodyParser from './body-parser';
import Config from './config';
import createServer from './lmtp-server';

if (!Config.smart_host){
    console.error("Please provide smart host");
    process.exit(0);
}

const MailParser = require("mailparser").MailParser;
const MemoryStream = require("memorystream");

const PASS_TEMPLATE = require("passbook")("generic", {
    passTypeIdentifier: "pass.me.pilif.digipass",
    teamIdentifier: "R9U6Q6F846",
    backgroundColor: "rgb(255,255,255)",
    organizationName: "Not affiliated with Digitec",
});
PASS_TEMPLATE.keys(require("path").dirname(process.mainModule.filename) + "/../keys", Config.password);

if (Config.lmtp_port) {
    const s = createServer(function (recepient, stream) {
        return handleStream(stream);
    });
    console.log(`Listening on ${Config.lmtp_host}:${Config.lmtp_port}`);
    s.listen(Config.lmtp_port, Config.lmtp_host);
}else{
    handleStream(process.stdin).then(function(info){
        process.exit(0);
    }, function(error){
        console.error(error);
        process.exit(1);
    });
}

function handleStream(stream){
    const mailparser = new MailParser();
    const p = new Promise(function(fulfill, reject){
        mailparser.on("end", function(mail_object){
            if (mail_object.from[0].address == Config.service_email_address){
                return reject('refusing to send to myself');
            }
            const parser = new BodyParser(mail_object.text);
            const store = parser.getStore();
            if (!store){
                return reject('unknown mail format or store');
            }
            const coords = store.get("coords");
            const outstream = new MemoryStream(null, {writable: true, readable: false});

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
            pass.loadImagesFrom(require("path").dirname(process.mainModule.filename) + "/../art");
            pass.on("error", function(error) {
                reject(error);
            });

            pass.on("end", function(){
                const t = require('nodemailer').createTransport({
                    host: Config.smart_host,
                    secure: false,
                    ignoreTLS: true,
                    name: 'digipass'
                });


                t.sendMail({
                    from: `pilitec <${Config.service_email_address}>`,
                    to: `${mail_object.from[0].name} <${mail_object.from[0].address}>`,
                    subject: mail_object.subject,
                    text: mail_object.text,
                    html: mail_object.html,
                    attachments: {
                        filename: 'order.pkpass',
                        content: outstream.toBuffer()
                    }
                }, function(error, info){
                    if (error){
                        return reject(error);
                    }
                    fulfill({recipient: mail_object.to[0].address, info: info});
                });
            });
            pass.pipe(outstream);
        });
    });
    stream.pipe(mailparser);
    return p;
}
