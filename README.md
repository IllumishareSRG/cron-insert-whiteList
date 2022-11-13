# Repository to Insert new addresses to white list

This Cron is uploaded to a Google Cloud function

The URL of the google function ` hhttps://us-central1-project-chainlink.cloudfunctions.net/insert-whitelist `

Triggering this HTTPS inserts all the new addresses that have been inserted into the Orbis and checks that all have been approved by veriff

There is no special security to trigger this.

This CRON runs every minute

ENV variables contain:
  - Private key of Gold Access Admin
  - Alchemy API Key for a Node implementation
  - Contract Address for GoldList






