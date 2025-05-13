var macros; // contents of macros.txt
var itemLocations; // contents of itemLocationsAP.yaml
var macrosLoaded = false;
var itemLocationsLoaded = false;
var dataHasChanged = false;
var connectionSuccessful = false;
var roomInfo;

$(document).ready(function () { // loads the tracker with AP when the page has loaded.
  if (APHost) {
    const connector = new WebSocket(`${APHost.startsWith("localhost") || APHost.startsWith("127.0.0.1") ? 'ws' : 'wss'}://${APHost}`);
    connector.addEventListener("error", () => {
      connectionSuccessful = true;
      displayMessage('Connection to AP has failed.', '', {
        className: 'error'
      })
    });
    connector.addEventListener("message", async e => {
      const array = JSON.parse(e.data);
      for (const info2 of array) {
        switch (info2.cmd) {
          case "RoomInfo": {
            info2.cmd = "GetDataPackage";
            roomInfo = info2;
            break;
          } case "DataPackage": {
            const games = info2.data.games;

            /**
             * generates a v4 UUID for archipelago
             * @returns {string}
             */
            function uuidGenV4() {
              const G = [];
              for (let Q = 0; Q < 36; Q++) G.push(Math.floor(Math.random() * 16));
              return G[14] = 4, G[19] = G[19] &= -5, G[19] = G[19] |= 8, G[8] = G[13] = G[18] = G[23] = "-", G.map((Q) => Q.toString(16)).join("")
            }

            for (const game in games) {
              if (game == "Archipelago") continue;
              Object.assign(info2, {
                cmd: "Connect",
                password: APPass,
                name: APUser,
                game,
                slot_data: false,
                items_handling: 7,
                uuid: uuidGenV4(),
                tags: ["Tracker"],
                version: roomInfo.version,
              });
              const itemLocations = await loadItemLocations();
              for (const location in games[game].location_name_to_id) {
                if (itemLocations[location]) itemLocations[location].id = games[game].location_name_to_id[location];
              }
              console.log(itemLocations);
              for (const item in games[game].item_name_to_id) {
                let itemElem = $("#tracker").find(`img[name="${item}"]`)[0];
                if (!itemElem) {
                  if (item.endsWith("Tingle Statue")) itemElem = $("#tracker").find(`img[name="Tingle Statue"]`)[0];
                  else if (item.startsWith("Triforce Shard")) itemElem = $("#tracker").find(`img[name="Triforce Shard"]`)[0];
                  else if (item.endsWith("Capacity Upgrade")) itemElem = $("#tracker").find(`img[name="Progressive ${item.split("Capacity Upgrade")[0].slice(0, -1)}"]`)[0];
                  else if (item.startsWith("Progressive")) switch (item.substring(12)) {
                    case "Magic Meter": {
                      itemElem = $("#tracker").find(`img[name="Magic Meter Upgrade"]`)[0];
                      break;
                    } case "Shield": {
                      itemElem = $("#tracker").find(`img[name="Hero's Shield"]`)[0];
                      break;
                    }
                  } else if (item.endsWith("Small Key") || item.endsWith("Big Key")) {
                    const allElements = document.getElementsByClassName(item.endsWith('Big Key') ? 'boss-key' : 'small-key');
                    for (const elem of allElements) {
                      if (elem.innerText != item) continue;
                      itemElem = elem;
                    }
                  } else if (item.startsWith("Treasure Chart") || item.startsWith("Triforce Chart")) itemElem = document.getElementById(`chart${charts.findIndex(i => i == item)}`)
                  else continue;
                }
                const itemIds = itemElem.getAttribute("data-itemIds") ? JSON.parse(itemElem.getAttribute("data-itemIds")) : [];
                itemIds.push(games[game].item_name_to_id[item]);
                itemElem.setAttribute("data-itemIds", JSON.stringify(itemIds));
              }
            }
            break;
          } case "Connected": {
            connectionSuccessful = true;
            loadMacros();
            break;
          } case "ReceivedItems": {
            for (const archipelagoItemInfo of info2.items) {

            }
            break;
          }
        }
      }
      if (!connectionSuccessful) connector.send(JSON.stringify(array));
    })
    setTimeout(() => {
      if (!connectionSuccessful) {
        displayMessage("Connection to AP was timed out.", '', {
          className: "error"
        });
        connector.close();
      }
    }, 35042);
  } else displayMessage('Please provide a host for AP Server Connection.', '', {
    className: 'error'
  });
});

function loadMacros() {
  $.ajax(
    {
      url: getLogicFilesUrl() + 'macros.txt',
      success: function (data) {
        macros = jsyaml.load(data);
        macrosLoaded = true;
        afterLoad();
      },
      error: function () {
        showLoadingError();
      }
    }
  )
}

function loadItemLocations() {
  return new Promise((res, rej) => {
    $.ajax({
      url: `${location.origin}/${location.pathname}/../itemLocationsAP.yaml`,
      success: function (data) {
        itemLocations = jsyaml.load(data);
        itemLocationsLoaded = true;
        res(itemLocations);
      },
      error: function () {
        rej(showLoadingError);
      }
    });
  });
}

function getLogicFilesUrl() {
  return 'https://raw.githubusercontent.com/tanjo3/wwrando/' + versionParam + '/logic/';
}

function afterLoad() {
  if (macrosLoaded && itemLocationsLoaded) {
    updateLocations();
    initializeLocationsChecked();
    loadProgress();
    loadFlags();
    loadStartingItems();
    updateMacros();
    setLocationsAreProgress();
    dataChanged();
    $(".loading-spinner").hide();
    $(".tracker-container").show();
  }
}

// tracker should call this after changing 'items', 'keys', or 'locationsChecked'
function dataChanged() {
  setLocationsAreAvailable();
  refreshAllImagesAndCounts();
  refreshLocationColors();
  refreshEntranceColors();
  recreateTooltips();
  updateStatistics();
  saveProgress();
}

function loadStartingItems() {
  startingItems["Hero's Shield"] = 1;
  startingItems['Wind Waker'] = 1;
  startingItems["Boat's Sail"] = 1;
  startingItems["Wind's Requiem"] = 1;
  startingItems['Ballad of Gales'] = 1;
  startingItems['Song of Passing'] = 1;
  startingItems['Triforce Shard'] = options.num_starting_triforce_shards;

  var gearRemaining = options.starting_gear;
  for (var i = 0; i < regularItems.length; i++) {
    var itemName = regularItems[i];
    startingItems[itemName] = gearRemaining % 2;
    gearRemaining = Math.floor(gearRemaining / 2);
  }
  for (var i = 0; i < progressiveItems.length; i++) {
    var itemName = progressiveItems[i];
    startingItems[itemName] = gearRemaining % 4;
    gearRemaining = Math.floor(gearRemaining / 4);
  }

  if (options.sword_mode == 'Start with Sword') {
    startingItems['Progressive Sword'] += 1;
  } else if (options.sword_mode == 'Swordless') {
    impossibleItems.push('Progressive Sword x1');
    impossibleItems.push('Progressive Sword x2');
    impossibleItems.push('Progressive Sword x3');
    impossibleItems.push('Progressive Sword x4');
    impossibleItems.push('Hurricane Spin');
  }

  if (!loadingProgress) {
    Object.keys(startingItems).forEach(function (item) {
      items[item] = startingItems[item];
    });
  }
}

function isMainDungeon(dungeonName) {
  if (dungeonName == 'Forsaken Fortress' || dungeonName == "Ganon's Tower") {
    return false;
  }
  return dungeons.includes(dungeonName);
}

function getNameForItem(itemName) {
  if (isProgressiveRequirement(itemName)) {
    var item = getProgressiveItemName(itemName);
    var numRequired = getProgressiveNumRequired(itemName);
    if (item == 'Progressive Sword') {
      if (numRequired <= 1) {
        return "Hero's Sword";
      }
      if (numRequired == 2) {
        return 'Master Sword';
      }
      if (numRequired == 3) {
        return 'Master Sword (Half Power)';
      }
      if (numRequired == 4) {
        return 'Master Sword (Full Power)';
      }
    } else if (item == 'Progressive Bow') {
      if (numRequired <= 1) {
        return "Hero's Bow";
      }
      if (numRequired == 2) {
        return "Hero's Bow (Fire & Ice Arrows)";
      }
      if (numRequired == 3) {
        return "Hero's Bow (All Arrows)";
      }
    } else if (item == 'Progressive Picto Box') {
      if (numRequired <= 1) {
        return 'Picto Box';
      }
      if (numRequired == 2) {
        return 'Deluxe Picto Box';
      }
    } else if (item == 'Progressive Wallet') {
      if (numRequired <= 1) {
        return 'Wallet (1000 Rupees)';
      }
      if (numRequired == 2) {
        return 'Wallet (5000 Rupees)';
      }
    } else if (item == 'Progressive Quiver') {
      if (numRequired <= 1) {
        return 'Quiver (60 Arrows)'
      }
      if (numRequired == 2) {
        return 'Quiver (99 Arrows)';
      }
    } else if (item == 'Progressive Bomb Bag') {
      if (numRequired <= 1) {
        return 'Bomb Bag (60 Bombs)'
      }
      if (numRequired == 2) {
        return 'Bomb Bag (99 Bombs)';
      }
    } else if (item == 'Triforce Shard') {
      return 'Triforce of Courage';
    }
  } else if (itemName == "Boat's Sail") {
    return 'Swift Sail';
  } else if (options.randomize_charts && (itemName.startsWith('Triforce Chart') || itemName.startsWith('Treasure Chart'))) {
    var islandIndex = charts.indexOf(itemName);
    return 'Chart for ' + islands[islandIndex];
  }
  return itemName;
}

function incrementShield() {
  if (items["Hero's Shield"] == 0) {
    items["Hero's Shield"] = 1;
  } else if (items['Mirror Shield'] == 0) {
    items['Mirror Shield'] = 1;
  } else {
    items["Hero's Shield"] = 0;
    items['Mirror Shield'] = 0;
  }
}
