# TWW AP Randomizer Tracker

This is a tracker for [The Wind Waker Archipelago Randomizer](https://archipelago.gg/games/The%20Wind%20Waker/info/en). If you want to run the tracker locally, 
please follow the steps in the <strong>Build Instructions</strong> section in order to get started. 
otherwise, you may use the tracker by refering [here](https://josephanimate2021.github.io/twwr-ap-tracker).

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

## I heard that this source code contains the old branch which has working AP Support and the older styled tracker. is that true?

Yes, there is an older style tracker that you may use if you wish. Both trackers work in a simmilar structure, but with different code.
If you prefer to use the older style tracker than the newest style one, you may click [here](https://josephanimate2021.github.io/twwr-ap-tracker/old) to get started.
Please keep in mind that the older style tracker supports up to version 1.9.0 of The Wind Waker Randomizer, meaning that the older style tracker may not understand how the WWR logic works in AP.
but it's support still works nonetheless. (Only downside is that you won't be able to copy permalinks from the applied AP Settings as the code for the older tracker has no idea how to create new permalinks.)

## Do you have a way to prove that this tracker actually works?

I have a run posted on my [YouTube channel](https://youtu.be/WJswDZkelgs) which demostrates this tracker in action. Despite 3 locations not getting checked on their own, It still shows that this tracker at the very least works. I have since then fixed this bug and you don't have to worry about any locations not getting checked. I have not tested all locations yet as I haven't set the settings to max settings and as YouTube uploads are limited to 12 hours long (even with your account verified), I will not make any videos of me doing long runs like that. I may only do the long runs as a way of testing this tracker to it's maximum to see how much it can handle AP.

## If this tracker does not suit my needs, are there any alternatives?

Yes, there are alternatives to this tracker that you can use. I completely understand if this tracker does not fit your needs. Below is a bulletpoint list which has all of The Wind Waker Archipelago Randomizer trackers that you can use.

* <strong>PopTracker Pack</strong> (Recommended Alternative) - If you have [PopTracker](https://github.com/black-sliver/PopTracker), then you may install this [Wind Waker Archipelago Randomizer PopTracker Pack](https://github.com/Mysteryem/ww-poptracker/archive/refs/tags/v1.1.0.zip) by downloading the zip file, extracting it after download, and then zip the contents of the v1.1.0 folder inside the extracted zip file into the packs folder of the downloaded PopTracker application. It's source code is located [here](https://github.com/Mysteryem/ww-poptracker)

## I am playing The Wind Waker Archipelago Randomizer with Shuffled Entrances turned on. Is there a way for AP to tell the tracker what entrance I went through?
I was able to get that working with only dungeon, miniboss, and boss entrances (mainly because they're given info from a dungeon entrance or dungeon that the user is in (The only method of knowing as of right now)).
There are instances where AP will not check these dungeons despite you being near their entrances (don't worry, this will be getting fixed)
* Forbidden Woods
* Tower Of The Gods
<p>Everything else should check out fine though. Please be aware that with this bug happening, Whenever you have miniboss and boss entrances randomized, some of their entrances may not get checked by AP, meaning that you may still have to check off some boss and miniboss entrances manually (I am quite shcoked to tell you that this is less entrances you would have to manually check off than every entrance a user would have to manually check off before). Please report an issue in the Issues Panel of this GitHub repository if you happen to encounter one or submit a pull request in the Pull Requests panel of this GitHub Repository if you have any code changes that you think should fix any problems you or a user is experiencing.
I encourage you to test your work first before submitting a pull request. To prove that you did test your work, please send in video evidence pointing to this tracker and how your work is supposed
to change some tracker functionality. I will still review code and test things out myself as this is good practice for me, but I want to make sure that your work will truely not affect production use of this tracker.</p> 

## Documentation

Code documentation is available [here](https://josephanimate2021.github.io/twwr-ap-tracker/docs).

## Credits

* Wooferzfg - For mataining the current tracker that is used for The Wind Waker randomizer runs. Source code is [here](https://github.com/wooferzfg/tww-rando-tracker/).
* BigDunka - For making the current tracker most of us use for our Wind Waker Randomizer runs. If it wern't for this person, then this tracker wouldn't exist today.
* mpql - Credited because this project was inspired by this person's attempt of creating an [AP Version of The Wind Waker Randomizer Tracker](https://github.com/mpql/AP_tww-rando-tracker) which does not actually include fully working AP Functionality. The commits and code should prove otherwise.
