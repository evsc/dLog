#### A node.js application
Simple web interface that allows you to store your dreams to a mongolab database.  
Attention, code is from 2012, and all of this is patched together rather poorly.  

Indexing of dreams via people and keywords: 
* tag people with @ sign
* tag keywords with # sign

![input a new dream](https://raw.githubusercontent.com/evsc/dlog/master/one.PNG)
![select a character](https://raw.githubusercontent.com/evsc/dlog/master/character.PNG)




==========================  

root:     node server.js

access:   http://127.0.0.1:8010/

==========================


TODO

- scroll window with highlights, still issue with padding, sometimes highlights misalign  
https://codersblock.com/blog/highlight-text-inside-a-textarea/ 

- display by type of sleep: night / daytime nap			"sleep_type":"night" "nap"
- display by type of dream: regular / lucid				"dream_type":"regular" "lucid" 

- datepicker, inactive when not in edit mode
- tag write: propose existing tags/characters

- categorize: realistic - unrealistic, positive - negative, innocent - erotic
- sorting features to /all 
- store length of dream as variable, not to calc it on every POST req
- delete characters/tags that don't have dreams attached, or were deleted from text