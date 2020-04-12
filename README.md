#### A node.js application
Simple web interface that allows you to store your dreams to a mongolab database.

Indexing of dreams via people and keywords: 
* tag people with @ sign
* tag keywords with # sign

==========================
root:     node server.js

access:   http://127.0.0.1:8010/

==========================

TODO
- display by type of sleep: night / daytime nap			"sleep_type":"night"   nap
- display by type of dream: regular / lucid				"dream_type":"regular"  lucid 

- scroll windowwith highlights, padding issue 
https://codersblock.com/blog/highlight-text-inside-a-textarea/ 
- datepicker, inactive when not in edit mode
- tag write: propose existing tags/characters

- categorize: realistic - unrealistic, positive - negative, innocent - erotic
- sorting features to /all 
- store length of dream as variable, not to calc it on every POST req
- delete characters/tags that don't have dreams attached