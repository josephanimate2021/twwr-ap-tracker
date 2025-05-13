// Script for the twwr ap tracker launcher.

/**
 * Takes a word and capitalizes the beginning of it's letter.
 * @param {string} g 
 * @returns {string}
 */
function capWord(g) {
  const rest = g.substring(1);
  const beg = g.slice(0, -rest.length);
  return beg.toUpperCase() + rest;
}

/**
 * Connects to AP and applys the settings from there.
 * @param {HTMLButtonElement} submutBtn 
 */
function applyAPSettings(form) {
  const info = Object.fromEntries(new URLSearchParams($(form).serialize()));
  let connected = false, roomInfo, success = false;
  const submutBtn = $(form).find('button[type="submit"]');
  submutBtn.attr("disabled", "");
  const origText = submutBtn.text();
  submutBtn.text("Connecting to the AP Server...");
  function handleError(e, connector) {
    displayMessage(`${connector ? `Failed to connect to Archipelago's WebSockets. ` : ''}${e.toString()}`, '', {
      className: 'error',
    });
    if (connector) {
      connected = true;
      connector.close();
    }
    submutBtn.removeAttr("disabled");
    submutBtn.text(origText);
  }
  if (info.host) {
    const connector = new WebSocket(`${
      info.host.startsWith('localhost') || info.host.startsWith('127.0.0.1') ? 'ws' : 'wss'
    }://${info.host}`);
    connector.addEventListener("message", g => {
      connected = true;
      try {
        const array = JSON.parse(g.data);
        for (const info2 of array) {
          switch (info2.cmd) {
            case "RoomInfo": {
              roomInfo = info2;
              info2.cmd = "GetDataPackage";
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
                  password: info.pass || '',
                  name: info.user,
                  game,
                  slot_data: true,
                  items_handling: 0,
                  uuid: uuidGenV4(),
                  tags: ["NoText"],
                  version: roomInfo.version,
                });
              }
              break;
            } case "Connected": {
              success = true;
              displayMessage(`Successfuly connected to AP and modified the settings from there. You are safe to either Launch the Tracker for copy the Tracker Link which can be used for a variety of things.`, '', {
                position: 'top left'
              });
              submutBtn.text(origText);
              submutBtn.removeAttr("disabled");
              for (const btn of document.getElementById('launcherButtons').children) {
                $(btn).removeAttr("disabled")
              }
              break;
            } case "ConnectionRefused": {
              handleError(`Errors: ${info2.errors.join(', ')}`, connector);
              break;
            }
          }
        }
        if (!success) connector.send(JSON.stringify(array));
      } catch (e) {
        handleError(e, connector);
      }
    })
    connector.addEventListener("error", g => {
      console.log(g);
      connected = true;
      handleError('AP Connection failed', connector)
    })
    setTimeout(() => {
      if (!connected) handleError('AP Connection timed out', connector);
    }, 38281)
  } else handleError('Please type in a valid AP Server Address');
}

/**
 * Displays a message using the jquery notify option based off of user input
 * @param {string} msg 
 * @param {HTMLElement} element 
 * @param {JSON} options 
 */
function displayMessage(msg, element, options = {}) {
  const je = element ? $(element) : $;
  je.notify(msg, Object.assign({
    autoHideDelay: 5000,
    className: "success",
    position: 'top center'
  }, options));
}

/**
 * Gets a flag string out of all buttons
 * @returns {string}
 */
function getFlagString() {
  var flagNames = ['D', 'GF', 'PSC', 'CSC', 'SSQ', 'LSQ', 'ST', 'MG', 'FG', 'MAI', 'PR', 'SUB', 'ERC', 'BOG', 'TRI', 'TRE', 'EP', 'MIS', 'TIN', 'KL', 'REN', 'RCH', 'SWO', 'SRB', 'STS', 'RM', 'SAV', 'BSM', 'IP'];
  var buttonNames = ['dungeons', 'great_fairies', 'puzzle_secret_caves', 'combat_secret_caves', 'short_sidequests', 'long_sidequests', 'spoils_trading', 'minigames',
    'free_gifts', 'mail', 'lookout_platforms_and_rafts', 'submarines', 'eye_reef_chests', 'big_octos_and_gunboats', 'Sunken Treasure (From Triforce Charts)', 'Sunken Treasure (From Treasure Charts)',
    'expensive_purchases', 'miscellaneous', 'tingle_chests', 'key_lunacy', 'randomize_entrances', 'randomize_charts', 'sword_mode',
    'skip_boss_rematches', 'triforce_shards_to_start_with', 'race_mode', 'savage_labyrinth', 'battlesquid', 'island_puzzles'];

  var result = '';
  for (var i = 0; i < buttonNames.length; i++) {
    var curButton = document.getElementById(buttonNames[i]);
    console.log(curButton, buttonNames[i])
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

/**
 * Creates a new link for the tracker.
 * @returns {string}
 */
function trackerLink() {
  return `${location.origin}/${location.pathname}/./tracker?f=${getFlagString()}&g=${$("#apConfig").data("startingGear") || '0'}&p=0&v=1.9.0&c=1&${$("#apConfig").serialize()}`
}

/**
 * Loads recent tracker progress by opening the tracker with the provided true boolean
 */
function loadMostRecent() {
  openTracker(true);
}

/**
 * Launches a new tracker while providing the false boolean.
 */
function launch() {
  openTracker(false);
}

/**
 * Loads contents of a file and then opens the tracker with it.
 */
function loadFileContents() {
  try {
    var saveData = this.result;
    localStorage.setItem('saveData', saveData);

    var version = JSON.parse(saveData).version;
    localStorage.setItem('version', version);
  } catch (err) {}
  
  openTracker(true);
}

/**
 * Loads a file after it's been uploaded.
 */
class loadFromFileClicked {
  constructor() {
    var file = this.files[0];
    var reader = new FileReader();
    reader.addEventListener('loadend', loadFileContents);
    reader.readAsText(file);
    this.value = '';
  }
}

/**
 * Loads File Explorer where the user can import their progress.
 */
function loadFromFile() {
  var loadProgressElement = document.getElementById('load-progress');
  loadProgressElement.addEventListener('input', loadFromFileClicked);
  loadProgressElement.click();
}

$(document).ready(() => { // Loads the main page when the document has loaded.
  jQuery.get(`https://josephanimate2021.github.io/twwr-ap-tracker/settings.yaml`, f => {
    const info = jsyaml.load(f);
    let html = '';
    for (const i in info) {
      html += `<fieldset><legend>${i}</legend><table>${(() => {
        let html = '<colgroup>';
        if (
          Object.keys(info[i]).length > 1
        ) html += '<col class="text-col"><col class="slider-col"><col class="text-col"><col class="slider-col"><col class="text-col"><col class="slider-col">'
        else for (let k = 0; k <= Object.keys(info[i]).length; k++) html += '<col class="text-col"><col class="slider-col">'
        return html + '</colgroup>'
      })()}<tbody>`;
      let count = 0;
      for (const g in info[i]) {
        const info2 = info[i][g];
        if (count == 3) {
          html += '</tr>'
          count = 0;
        }
        if (count == 0) html += '<tr>';
        html += `<td class="label-text">${g.split("_").map(capWord).join(' ')}</td><td class="slider-container">`;
        if (info2.true != undefined && info2.false != undefined) html += `<label class="switch">
          <input id="${g}" type="checkbox"${info2.true > 0 ? ' checked' : ''}>
          <span class="slider"></span>
        </label>`;
        else html += `<div class="select-container"><select id="${g}">${Object.keys(info2).map(v => `<option ${info2[v] > 0 ? ' selected' : ''}>${isNaN(parseInt(v)) ? v.split("_").map(capWord).join(' ') : v}</option>`).join('')}</select></div>`;
        html += '</td>'
        count++;
      }
      html += `</tbody></table></fieldset>`
    }
    $("#gameSettings").html(html);
  })
})
