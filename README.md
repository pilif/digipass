# digipass

Turn [digitec.ch](https://www.digitec.ch) collection notices into iOS Wallet passes.

This is the code that's powering the `digipass@pilif.me` email address.

If you have a digitec collection notice, forward it to `digipass@pilif.me` and you will get the exact same message back, but the PDF has now been replaced with an iOS pass that you can add to your wallet.

The passes are geo-coded to the respective digitec store, so the passes will automatically pop up as you get close to the store.

## screenshot

![screenshot](./screenshot.png?raw=1)

## TODO

* [ ] currently has a hard-coded list of digitec stores. Should probably web-scrape them
* [ ] as digitec has no API and as I don't want your user-data, we can't remove the passes when people fetch their orders
* [ ] authenticated SMTP to the smarthost would be cool
* [ ] web-scraping the store opening hours would be cool too

## running it yourself

In order to run this yourself, you need to have a smart-host available for sending mail. It currently must be configured to not require authentication (as mine doesn't), but I would accept patches to change this. It's quite trivial to do.

You also need a mail server to accept the mails. You can either have your mail server invoke the application and pass the mail in via STDIN, or you run the script with `-l [host:]<port>` which will cause it to run as a local LMTP daemon. Then you just pass your mail to it.

In my case, I'm using exim with the following router:

```
digipass:
  driver = accept
  domains = pilif.me
  local_parts = digipass
  transport = digipass_t
```

and the following transport

```
digipass_t:
  driver = smtp
  protocol = lmtp
  hosts = $INSERT_HOST_HERE
  hosts_override = true
  port = 5959
```

Your mileage may vary.

## License

MIT

## Disclaimer

I'm not affiliated with Digitec. I'm just a good customer and I'm fed up with trying to dig their collection notices out of my mailbox. If they implement this on their own, that would be even better - then I can shut this down again.
