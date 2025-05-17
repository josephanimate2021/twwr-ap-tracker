# TWW AP Randomizer Tracker

This is a tracker for [The Wind Waker Archipelago Randomizer](https://archipelago.gg/games/The%20Wind%20Waker/info/en). If you want to run the tracker locally, please follow the Build Instructions steps in order to get started. otherwise, you may use the tracker by refering [here](https://josephanimate2021.github.io/twwr-ap-tracker).

## Build Instructions

Building and running the tracker locally requires you to install [Node.JS Version 20 or newer](https://nodejs.org/en/download/) and [Git](https://git-scm.com/downloads).

Clone the repository by running the following in a command prompt:
```bash
git clone https://github.com/josephanimate2021/twwr-ap-tracker.git
```

Navigate to the `twwr-ap-tracker` folder and install dependencies:
```bash
cd twwr-ap-tracker && npm install
```
You can then build and serve the tracker application:
```bash
npm start
```
After the server starts, you can go to [localhost:8080](http://localhost:8080/) to open the tracker. 

## I heard that this source code contains the old branch which contains working AP Support + the old styled tracker. is that true?

Yes, there is an older style tracker that you may use if you wish. Both trackers work in a simmilar structure, but with different code.
If you prefer to use the older style tracker than the newest style one, you may click [here](https://josephanimate2021.github.io/twwr-ap-tracker/old) to get started.
Please keep in mind that the older style tracker supports up to version 1.9.0 of The Wind Waker Randomizer, meaning that the older style tracker may not understand how the WWR logic works in AP.
but it's support still works nonetheless. (Only downside is that you won't be able to copy permalinks from the applied AP Settings as the code for the older tracker has no idea how to create new permalinks.)

## Documentation

Code documentation is available [here](https://josephanimate2021.github.io/twwr-ap-tracker/docs).

## Credits

* Wooferzfg - For mataining the current tracker that is used for The Wind Waker randomizer runs. Source code is [here](https://github.com/wooferzfg/tww-rando-tracker/).
* BigDunka - For making the current tracker most of us use for our Wind Waker Randomizer runs. If it wern't for this person, then this tracker wouldn't exist today.
