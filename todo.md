To Do:

- need to register transactions against existing balance
- need to record transaction log (change to data model req there too)
- need to run daily tasks: update balanace, record transaction day in DB
- all the D3 stuff
- add bootrap for niceness
- add readme
- add description of project on page: this is a mini bank/wage within your larger budget framework:
--> i.e. treat this as your actual day-to-day wage and bank, the savings will then acrue outside of that.


- add tabs: main, transaction history (with the ability to delete transactions), and actual accounts.
- all tabs should still retain a D3 analysis portion for their bottom half.
- on "actual account" should show projected savings.
- actual account is like "peeking behind the curtain" at what's actually going on with your money.
- main page should show daily amounts, balance, how good you've been.
- transaction page should be... more detailed maybe? showing your clustering of transactions/day?

- add a bootstrap "x" button to get rid of description

---

Down the line:

- multi-tabbed for different views
- the ability to move from mini bank account/wage to larger picture (savings, actual wage, etc)

- add "planned transactions" for future things needing to buy (separate table). should
make for easier planning of wage vs debits.


---
Metrics;

- get_daily_metrics should take optional start/end params.  We can then grab new data from the DB (only
the stuff that's needed, please), and redraw our chart on the fly.

nice transitions on that? nice start-to date picker instances.
d3 should handle the transforms well.

=====
integrating a calendar would be a great idea... match up expected money with things like shopping 
or going to the bar or a show or date or whatever.

===
be able to filter out transaction types: eg, this is what your week would have looked like if you
didn't buy booze

//////

-> start date and end date should be done on the client side.  all data for each call should be passed from the
server.
-> filters though should be done server side since there's a bunch of re-calculating that needs to get done.


::::
Page Loading Plan:
- flask renders the page with rates
- some ajax calls go and grab data, during this time, input boxes are inactive/unavailable
- ajax calls return and fire a new "draw chart" event
- any time someone hits an input box or whatever, fire that event again.






















