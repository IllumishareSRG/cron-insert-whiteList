# Repository to Insert new addresses to white list

This Cron is uploaded to a Google Cloud function

The URL of the google function ` https://us-central1-project-chainlink.cloudfunctions.net/function-2 `

Triggering this HTTPS inserts all the new addresses that have been inserted to the WordPress/Veriff DB

There is no special security to trigger this.

This CRON runs every hour The 24 hours of the day 7 days of the week

ENV variables contain:
  - Private key of Gold Access Admin
  - Alchemy API Key for a Node implementation
  - Contract Address for GoldList






