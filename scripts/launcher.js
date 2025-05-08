/** This code was for permalink inplmentation which is something AP does not support right now. So this will be commented out for now.
const currentVersion = '1.8.0';
var startingGear = 1;

function parseFlags(bits, ids) {
  for (var i = 0; i < ids.length; i++) {
    var element = document.getElementById(ids[i]);
    if (element) {
      element.checked = bits[0];
    }
    bits.shift();
  }
}

function parseComboBox(bits, id) {
  var byteValue = getValueOfBits(bits, 8);
  var element = document.getElementById(id);
  element.selectedIndex = byteValue;
}

function parseSpinBox(bits, id, minVal, maxVal) {
  var numBits = (maxVal - minVal).toString(2).length;
  var byteValue = getValueOfBits(bits, numBits);
  var element = document.getElementById(id);
  if (element) {
    element.value = byteValue;
  }
}

function setStartingGear(bits) {
  var numBits = regularItems.length + progressiveItems.length * 2;
  startingGear = getValueOfBits(bits, numBits);
}

function getValueOfBits(bits, count) {
  var value = 0;
  for (var i = 0; i < count; i++) {
    if (bits[0]) {
      value += Math.pow(2, i);
    }
    bits.shift();
  }
  return value;
}

function getBitString(bits) {
  var bitString = [];
  for (var i = 0; i < bits.length; i++) {
    var curByte = bits.charCodeAt(i);
    for (var j = 0; j < 8; j++) {
      if (curByte % 2 == 1) {
        bitString.push(true);
      } else {
        bitString.push(false);
      }
      curByte = Math.floor(curByte / 2);
    }
  }
  return bitString;
}

function applyflags(element) {
  try {
    var decodedData = atob(document.getElementById('flags').value);
    var version = '';
    var bits = '';

    while (decodedData.charCodeAt(0) != 0 && decodedData.length > 0) {
      version += decodedData[0];
      decodedData = decodedData.substring(1);
    }

    if (/^[0-9a-f._]+$/.test(version) && !version.includes(currentVersion)) {
      showBrokenPermalink(element, true);
      return;
    }

    if (decodedData.length > 0) {
      decodedData = decodedData.substring(1); // space between version and seed
    }

    while (decodedData.charCodeAt(0) != 0 && decodedData.length > 0) {
      decodedData = decodedData.substring(1); // seed
    }

    if (decodedData.length > 0) {
      decodedData = decodedData.substring(1); // space between seed and flags
      bits = getBitString(decodedData);

      parseFlags(bits, ['dungeons', 'great_fairies', 'puzzle_secret_caves', 'combat_secret_caves', 'short_sidequests', 'long_sidequests', 'spoils_trading', 'minigames']);
      parseFlags(bits, ['free_gifts', 'mail', 'platforms_rafts', 'submarines', 'eye_reef_chests', 'big_octos_gunboats', 'triforce_charts', 'treasure_charts']);
      parseFlags(bits, ['expensive_purchases', 'misc', 'tingle_chests', 'battlesquid', 'savage_labyrinth', 'island_puzzles', 'key_lunacy']);
      parseComboBox(bits, 'randomize_entrances');
      parseFlags(bits, ['randomize_charts', '' /* randomize_starting_island *//*, '' /* swift_sail *//*, '' /* instant_text_boxes *//*, '' /* reveal_full_sea_chart *//*]);/*
      parseComboBox(bits, 'num_starting_triforce_shards');
      parseFlags(bits, ['' /* add_shortcut_warps_between_dungeons *//*, '' /* generate_spoiler_log *//*]);/*
      parseComboBox(bits, 'sword_mode');
      parseFlags(bits, ['skip_rematch_bosses', 'race_mode']);
      parseFlags(bits, ['' /* randomize_bgm *//*, '' /* disable_tingle_chests_with_tingle_bombs *//*, '' /* randomize_enemy_palettes *//*, '' /* remove_title_and_ending_videos *//*]);/*
      setStartingGear(bits);
      parseSpinBox(bits, '' /* starting_pohs *//*, 0, 44);/*
      parseSpinBox(bits, '' /* starting_hcs *//*, 0, 6);/*

      $(element).notify('Settings applied from the Permalink.', {
        autoHideDelay: 5000,
        className: 'success',
        position: 'top center'
      });
    } else {
      showBrokenPermalink(element, false);
    }
  }
  catch (err) {
    showBrokenPermalink(element, false);
  }
}

function showBrokenPermalink(element, wrongVersion) {
  if (wrongVersion) {
    var notificationMessage = 'Settings could not be applied. Permalink is not compatible with Wind Waker Randomizer ' + currentVersion + '.';
  } else {
    var notificationMessage = 'Settings could not be applied from the Permalink.';
  }
  $(element).notify(notificationMessage, {
    autoHideDelay: 5000,
    className: 'error',
    position: 'top center'
  });
}

function getFlagString() {
  var flagNames = ['D', 'GF', 'PSC', 'CSC', 'SSQ', 'LSQ', 'ST', 'MG', 'FG', 'MAI', 'PR', 'SUB', 'ERC', 'BOG', 'TRI', 'TRE', 'EP', 'MIS', 'TIN', 'KL', 'REN', 'RCH', 'SWO', 'SRB', 'STS', 'RM', 'SAV', 'BSM', 'IP'];
  var buttonNames = ['dungeons', 'great_fairies', 'puzzle_secret_caves', 'combat_secret_caves', 'short_sidequests', 'long_sidequests', 'spoils_trading', 'minigames',
    'free_gifts', 'mail', 'platforms_rafts', 'submarines', 'eye_reef_chests', 'big_octos_gunboats', 'triforce_charts', 'treasure_charts',
    'expensive_purchases', 'misc', 'tingle_chests', 'key_lunacy', 'randomize_entrances', 'randomize_charts', 'sword_mode',
    'skip_rematch_bosses', 'num_starting_triforce_shards', 'race_mode', 'savage_labyrinth', 'battlesquid', 'island_puzzles'];

  var result = '';
  for (var i = 0; i < buttonNames.length; i++) {
    var curButton = document.getElementById(buttonNames[i]);
    var curFlag = flagNames[i];
    if (curButton.checked) {
      result += curFlag + '1';
    } else if (curButton.selectedIndex) {
      result += curFlag + curButton.selectedIndex;
    } else {
      result += curFlag + '0';
    }
  }
  return result;
}

function openTracker(loadProgress) {
  var flagStr = getFlagString();
  var progressStr = '0';
  var versionStr = currentVersion;
  var isCurrentVersionStr = '1';
  if (loadProgress) {
    var storedVersion = localStorage.getItem('version');
    if (storedVersion && storedVersion != currentVersion) {
      versionStr = storedVersion;
      isCurrentVersionStr = '0';
    }
    progressStr = '1';
  }

  //Chrome defaults
  var h = 912;
  var w = 910;

  open(`tracker.html?f=${flagStr}&g=${startingGear}&p=${progressStr}&v=${versionStr}&c=${isCurrentVersionStr}`,
    '',
    'width=' + w + ',height=' + h + ',titlebar=0,menubar=0,toolbar=0');
}

function loadMostRecent() {
  openTracker(true);
}

function launch() {
  openTracker(false);
}

function loadFileContents() {
  try {
    var saveData = this.result;
    localStorage.setItem('saveData', saveData);

    var version = JSON.parse(saveData).version;
    localStorage.setItem('version', version);
  } catch (err) {}
  
  openTracker(true);
}

function loadFromFileClicked() {
  var file = this.files[0];
  var reader = new FileReader();
  reader.addEventListener('loadend', loadFileContents);
  reader.readAsText(file);
  this.value = '';
}

function loadFromFile() {
  var loadProgressElement = document.getElementById('load-progress');
  loadProgressElement.addEventListener('input', loadFromFileClicked);
  loadProgressElement.click();
}
*/
let connected2archipelago = false;
function APConnection(obj) { // Connects to an Archipelago server
    if (connected2archipelago) { // disconnects from the archipelago server when the user clicks on the Disconnect From Archipelago button.
        if (jQuery(obj).find('button[type="submit"]').data("connected")) jQuery(obj).trigger("archipelagoDisconnect");
        else jQuery("#serverAPMessage").css("color", "red").text('Please wait for the archipelago server to be fully connected before you disconnect.')
    } else { // Starts the connection to the Archipelago server.
        let connectionSuccessful = false;
        connected2archipelago = true;
        const originalText = jQuery(obj).find('button[type="submit"]').text();
        jQuery(obj).find('button[type="submit"]').text('Awaiting Server Connection...').attr("disabled", "");
        function handleError(e) { /// handles an error of one occurs during connection.
            jQuery(obj).find('button[type="submit"]').removeAttr("disabled").text(originalText);
            connected2archipelago = false;
            console.error(e);
            jQuery("#serverAPMessage").css("color", "red")
            jQuery("#serverAPMessage").html(`Failed to connect to Archipelago's WebSockets.<br>${e.toString()}`);
        }
        try {
            const info = Object.fromEntries(new URLSearchParams(jQuery(obj).serialize()));
            const socket = new WebSocket(`${info.host.startsWith("localhost") || info.host.startsWith("127.0.0.1") ? 'ws' : 'wss'}://${info.host}`);
            setTimeout(() => { // added this in case archipelago tries to take forever to connect. You are better off having a fast internet connection.
                if (!connectionSuccessful) {
                    socket.close();
                    handleError("Timeout occured. Please try again later.")
                }
            }, 35042)
            let roomInfo;
            socket.addEventListener("message", async e => {
                const array = JSON.parse(e.data);
                for (const info2 of array) {
                    switch (info2.cmd) {
                        case "RoomInfo": {
                            if (info2.password == false || info.password) {
                                roomInfo = info2;
                                roomInfo.tags.push("Tracker");
                                if (info.password) roomInfo.password = info.password;
                                info2.cmd = "GetDataPackage";
                            } else {
                                handleError("Please enter in the password");
                                //$(obj).append(`<label for="password">Password</label><input class="form-control" type="password" id="password" name="password" required/>`);
                            }
                            break;
                        } case "DataPackage": {
                            const games = info2.data.games;
                            function uuidGenV4() { // generates a v4 UUID for archipelago
                                const G = [];
                                for (let Q = 0; Q < 36; Q++) G.push(Math.floor(Math.random() * 16));
                                return G[14] = 4, G[19] = G[19] &= -5, G[19] = G[19] |= 8, G[8] = G[13] = G[18] = G[23] = "-", G.map((Q) => Q.toString(16)).join("")
                            }
                            for (const game in games) {
                                if (game == "Archipelago") continue;
                                Object.assign(info2, {
                                    cmd: "Connect",
                                    password: roomInfo.password || '',
                                    name: info.user,
                                    game,
                                    slot_data: true,
                                    items_handling: 7,
                                    uuid: uuidGenV4(),
                                    tags: roomInfo.tags,
                                    version: roomInfo.version,
                                });
                                for (const location in games[game].location_name_to_id) {
                                    const locationInfo = trackerStuff.layout.searchFor(location);
                                    if (locationInfo.cat && locationInfo.realLocationName) trackerStuff.layout[locationInfo.cat][locationInfo.realLocationName][location].id = games[game].location_name_to_id[location];
                                }
                                for (const item in games[game].item_name_to_id) {
                                    const itemInfo = trackerStuff.itemLayout.searchFor(item);
                                    if (itemInfo.cat) trackerStuff.itemLayout[itemInfo.cat][itemInfo.realItemName || item].id = games[game].item_name_to_id[item]
                                }
                            }
                            break;
                        } case "Connected": {
                            jQuery(obj).bind("archipelagoDisconnect", () => {
                                jQuery(obj).find('button[type="submit"]').attr("data-connected", false);
                                socket.close();
                                jQuery(obj).find('button[type="submit"]').text(originalText);
                                connected2archipelago = false;
                                connectionSuccessful = false;
                                jQuery("#serverAPMessage").text('Successfully disconnected from the Archipelago Server')
                            })
                            connectionSuccessful = true;
                            jQuery("#serverAPMessage").css("color", "lime");
                            jQuery(obj).find('button[type="submit"]').attr("data-connected", true);
                            jQuery(obj).find('button[type="submit"]').removeAttr("disabled");
                            jQuery(obj).find('button[type="submit"]').text("Disconnect From Archipelago");
                            jQuery("#serverAPMessage").text(`Successfully connected to the Archipelago server!`);
                            break;
                        } case "ReceivedItems": {
                            /*for (const archipelagoItemInfo of info2.items) {
                                const itemInfo = trackerStuff.itemLayout.searchFor(archipelagoItemInfo.item);
                                Object.assign(itemInfo, retrievedItem(itemInfo.realItemName, itemInfo.cat, false));
                                if (itemInfo.data.buyOnRandoDetection) Object.assign(itemInfo, retrievedItem(itemInfo.realItemName, itemInfo.cat, false));
                                const locationInfo = trackerStuff.layout.searchFor(archipelagoItemInfo.location);
                                checkCompleted(`${locationInfo.cat}@${locationInfo.realLocationName}@${locationInfo.realCheckName}`, itemInfo)
                                switchTrackerMode(document.getElementById('tracker').getAttribute("data-mode"), itemInfo.cat);
                            }*/
                            break;
                        }
                    }
                }
                if (!connectionSuccessful) socket.send(JSON.stringify(array));
            })
        } catch (e) {
            handleError(e);
        }
    }
}
