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


=======
I have two types of data arrays that I need for charts:
- 1) daily balance amount.  this takes daily income into account and graphs out based on filters what that balance is.
- 2) transaction summary. this does not take daily income into account.  it's just a measure of raw spending.

both of these should be delivered in the same call, with filters attached, for all dates.
it will set them as global variables and call the draw chart method.

Our charts should have three separate listeners: changing chart type, changing data, and changing dates


Charts shouldn't care about getting data, they should only listen for new data passively and then deal with it accordingly



====
Sooner or later I need to incorporate a user model.  At least to remember the info text being closed, since that's
annoying that it keeps popping up every refresh.  Probably better to do that sooner rather than later... erp.
Plus it would be nice to push a prod version and not have my entire DB fucked with.
Is it possible to have them sync'd?


Is "metrics" page useful for anything anymore? we now have a daily summary in "transactions metrics" 
This whole thing could be simplified by taking that out...

















