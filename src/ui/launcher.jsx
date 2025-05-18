import { Client } from 'archipelago.js';
import jQuery from 'jquery';
import _ from 'lodash';
import React from 'react';
import { ToastContainer, toast } from 'react-toastify';

import HEADER_IMAGE from '../images/header.png';
import Permalink from '../services/permalink';

import DropdownOptionInput from './dropdown-option-input';
import OptionsTable from './options-table';
import Storage from './storage';
import ToggleOptionInput from './toggle-option-input';

import 'react-toastify/dist/ReactToastify.css';
import 'react-toggle/style.css';

export default class Launcher extends React.PureComponent {
  static notifyAboutUpdate() {
    const { serviceWorker } = navigator;
    if (_.isNil(serviceWorker) || _.isNil(serviceWorker.controller)) {
      // Don't prompt for update when service worker gets removed
      return;
    }

    toast.warn(
      'A new version of the tracker is available! Click here to reload.',
      {
        autoClose: false,
        closeOnClick: true,
        onClick: () => window.location.reload(),
      },
    );
  }

  static trackerLink(route, query = {}) {
    return `${window.location.origin}${window.location.pathname}?${new URLSearchParams(query).toString()}#/tracker${route}`
  }

  static openTrackerWindow(route, query = {}) {
    const windowWidth = 1797;
    const windowHeight = 585;

    window.open(
      Launcher.trackerLink(route, query),
      '_blank',
      `width=${windowWidth},height=${windowHeight},titlebar=0,menubar=0,toolbar=0`,
    );
  }

  constructor() {
    super();

    const permalink = Permalink.DEFAULT_PERMALINK;
    const options = Permalink.decode(permalink);

    this.state = {
      options,
      permalink,
    };

    this.setOptionValue = this.setOptionValue.bind(this);
  }

  componentDidMount() {
    const { serviceWorker } = navigator;

    if (!_.isNil(serviceWorker) && !_.isNil(serviceWorker.controller)) {
      // Don't prompt for update when there was no service worker previously installed
      serviceWorker.addEventListener('controllerchange', Launcher.notifyAboutUpdate);
    }
  }

  componentWillUnmount() {
    const { serviceWorker } = navigator;

    if (!_.isNil(serviceWorker)) {
      serviceWorker.removeEventListener('controllerchange', Launcher.notifyAboutUpdate);
    }
  }

  getOptionValue(optionName) {
    const { options } = this.state;

    return _.get(options, optionName);
  }

  setOptionValue(optionName, newValue) {
    const { options } = this.state;

    _.set(options, optionName, newValue);

    this.updateOptions(options);
  }

  loadPermalink(permalinkInput) {
    try {
      const options = Permalink.decode(permalinkInput);

      this.updateOptions(options);
    } catch (err) {
      toast.error('Invalid permalink!');
    }
  }

  updateOptions(options) {
    const permalink = Permalink.encode(options);

    this.setState({
      options,
      permalink,
    });
  }

  toggleInput({ labelText, optionName }) {
    const optionValue = this.getOptionValue(optionName);

    return (
      <ToggleOptionInput
        key={optionName}
        labelText={labelText}
        optionName={optionName}
        optionValue={optionValue}
        setOptionValue={this.setOptionValue}
      />
    );
  }

  dropdownInput({ labelText, optionName, isDisabled = false }) {
    const optionValue = this.getOptionValue(optionName);

    return (
      <DropdownOptionInput
        key={optionName}
        labelText={labelText}
        optionName={optionName}
        optionValue={optionValue}
        setOptionValue={this.setOptionValue}
        isDisabled={isDisabled}
      />
    );
  }

  permalinkContainer(ap = true) {
    if (ap) {
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            let successfulConnection = false;
            const submitBtn = jQuery(event.target).find('button[type="submit"]');
            const origText = submitBtn.text();
            submitBtn.text('Connecting to AP...');
            submitBtn.attr('disabled', '');
            const info = Object.fromEntries(new URLSearchParams(jQuery(event.target).serialize()));
            Object.keys(info).forEach((i) => jQuery(event.target).find(`input[name="${i}"]`).attr('readonly', ''));
            const APClient = new Client();
            function handleError(e) {
              toast.error(e);
              submitBtn.removeAttr('disabled');
              submitBtn.text(origText);
              Object.keys(info).forEach((i) => jQuery(event.target).find(`input[name="${i}"]`).removeAttr('readonly'));
              APClient.socket.disconnect();
            }
            APClient.socket.on('connected', (e) => {
              const allDropdownOptions = Permalink.DROPDOWN_OPTIONS;
              const { setOptionValue } = this;
              let trifroceShardsCount = 0;
              [e.slot_data.start_inventory_from_pool, e.slot_data.start_inventory].forEach((k) => {
                const startingTriforceShards = Object.keys(k).filter((j) => j.startsWith('Triforce Shard'));
                if (startingTriforceShards.length > 0) {
                  trifroceShardsCount += startingTriforceShards.length;
                  setOptionValue('num_starting_triforce_shards', trifroceShardsCount > 8 ? 8 : trifroceShardsCount);
                }
              });
              Object.keys(e.slot_data).forEach((i) => {
                const val = this.getOptionValue(i);
                if (val !== undefined) {
                  if (typeof val === 'boolean') {
                    const booleans = [false, true];
                    const apVal = booleans[e.slot_data[i]];
                    if (apVal !== undefined) setOptionValue(i, apVal);
                  } else {
                    const dropdownOptions = allDropdownOptions[i];
                    switch (i) {
                      case 'sword_mode': {
                        const o = e.slot_data.sword_mode === 1 || e.slot_data.sword_mode === 2 ? 1 : e.slot_data.sword_mode === 3 ? 2 : 0;
                        setOptionValue('sword_mode', dropdownOptions[o]);
                        break;
                      } case 'num_required_bosses': {
                        setOptionValue('num_required_bosses', e.slot_data.num_required_bosses);
                        break;
                      } default: {
                        setOptionValue(i, dropdownOptions[e.slot_data[i]]);
                      }
                    }
                  }
                }
              });
            });
            APClient.socket.on('connectionRefused', (e) => {
              successfulConnection = true;
              handleError(`AP Refused connection due to the following errors: ${e.errors.join(', ')}`);
            });
            APClient.login(info.host, info.user, 'The Wind Waker', {
              tags: ['NoText'],
              password: info.pass || '',
            }).then(() => {
              successfulConnection = true;
              submitBtn.text('Connected to AP');
              jQuery('.settings').find('div[data-ap="false"]').hide();
              jQuery('.settings').find('div[data-ap="true"]').show();
            }).catch(toast.error);
            setTimeout(() => {
              if (!successfulConnection) handleError('AP Connection Timed Out');
            }, 34321);
          }}
          id="apConfig"
        >
          <div className="permalink-container">
            <div className="permalink-label">AP Server Address:</div>
            <div className="permalink-input">
              <input
                className="permalink"
                name="host"
                type="text"
                required
              />
            </div>
          </div>
          <div className="permalink-container">
            <div className="permalink-label">Username:</div>
            <div className="permalink-input">
              <input
                className="permalink"
                name="user"
                type="text"
                required
              />
            </div>
          </div>
          <div className="permalink-container">
            <div className="permalink-label">Password:</div>
            <div className="permalink-input">
              <input
                className="permalink"
                name="pass"
                type="password"
              />
            </div>
          </div>
          <div className="launcher-button-container">
            <button className="launcher-button" type="submit">Apply Settings From AP</button>
          </div>
        </form>
      );
    }

    const { permalink } = this.state;

    return (
      <div className="permalink-container" title="While AP does not take advantage of this, you may use the Permalink feature to copy the applied AP settings for usage with the normal Wind Waker Randomizer.">
        <div className="permalink-label">Permalink:</div>
        <div className="permalink-input">
          <input
            placeholder="Permalink"
            className="permalink"
            onChange={(event) => this.loadPermalink(event.target.value)}
            value={permalink}
          />
        </div>
      </div>
    );
  }

  progressItemLocationsTable() {
    return (
      <OptionsTable
        title="Progress Item Locations"
        numColumns={3}
        options={[
          this.toggleInput({
            labelText: 'Dungeons',
            optionName: Permalink.OPTIONS.PROGRESSION_DUNGEONS,
          }),
          this.toggleInput({
            labelText: 'Puzzle Secret Caves',
            optionName: Permalink.OPTIONS.PROGRESSION_PUZZLE_SECRET_CAVES,
          }),
          this.toggleInput({
            labelText: 'Combat Secret Caves',
            optionName: Permalink.OPTIONS.PROGRESSION_COMBAT_SECRET_CAVES,
          }),
          this.toggleInput({
            labelText: 'Savage Labyrinth',
            optionName: Permalink.OPTIONS.PROGRESSION_SAVAGE_LABYRINTH,
          }),
          this.toggleInput({
            labelText: 'Island Puzzles',
            optionName: Permalink.OPTIONS.PROGRESSION_ISLAND_PUZZLES,
          }),
          this.toggleInput({
            labelText: 'Dungeon Secrets',
            optionName: Permalink.OPTIONS.PROGRESSION_DUNGEON_SECRETS,
          }),
          this.toggleInput({
            labelText: 'Tingle Chests',
            optionName: Permalink.OPTIONS.PROGRESSION_TINGLE_CHESTS,
          }),
          this.toggleInput({
            labelText: 'Great Fairies',
            optionName: Permalink.OPTIONS.PROGRESSION_GREAT_FAIRIES,
          }),
          this.toggleInput({
            labelText: 'Submarines',
            optionName: Permalink.OPTIONS.PROGRESSION_SUBMARINES,
          }),
          this.toggleInput({
            labelText: 'Lookout Platforms and Rafts',
            optionName: Permalink.OPTIONS.PROGRESSION_PLATFORMS_RAFTS,
          }),
          this.toggleInput({
            labelText: 'Short Sidequests',
            optionName: Permalink.OPTIONS.PROGRESSION_SHORT_SIDEQUESTS,
          }),
          this.toggleInput({
            labelText: 'Long Sidequests',
            optionName: Permalink.OPTIONS.PROGRESSION_LONG_SIDEQUESTS,
          }),
          this.toggleInput({
            labelText: 'Spoils Trading',
            optionName: Permalink.OPTIONS.PROGRESSION_SPOILS_TRADING,
          }),
          this.toggleInput({
            labelText: 'Eye Reef Chests',
            optionName: Permalink.OPTIONS.PROGRESSION_EYE_REEF_CHESTS,
          }),
          this.toggleInput({
            labelText: 'Big Octos and Gunboats',
            optionName: Permalink.OPTIONS.PROGRESSION_BIG_OCTOS_GUNBOATS,
          }),
          this.toggleInput({
            labelText: 'Miscellaneous',
            optionName: Permalink.OPTIONS.PROGRESSION_MISC,
          }),
          this.toggleInput({
            labelText: 'Minigames',
            optionName: Permalink.OPTIONS.PROGRESSION_MINIGAMES,
          }),
          this.toggleInput({
            labelText: 'Battlesquid Minigame',
            optionName: Permalink.OPTIONS.PROGRESSION_BATTLESQUID,
          }),
          this.toggleInput({
            labelText: 'Free Gifts',
            optionName: Permalink.OPTIONS.PROGRESSION_FREE_GIFTS,
          }),
          this.toggleInput({
            labelText: 'Mail',
            optionName: Permalink.OPTIONS.PROGRESSION_MAIL,
          }),
          this.toggleInput({
            labelText: 'Expensive Purchases',
            optionName: Permalink.OPTIONS.PROGRESSION_EXPENSIVE_PURCHASES,
          }),
          this.toggleInput({
            labelText: 'Sunken Treasure (From Triforce Charts)',
            optionName: Permalink.OPTIONS.PROGRESSION_TRIFORCE_CHARTS,
          }),
          this.toggleInput({
            labelText: 'Sunken Treasure (From Treasure Charts)',
            optionName: Permalink.OPTIONS.PROGRESSION_TREASURE_CHARTS,
          }),
        ]}
      />
    );
  }

  entranceRandomizerOptionsTable() {
    return (
      <OptionsTable
        title="Entrance Randomizer Options"
        numColumns={2}
        options={[
          this.toggleInput({
            labelText: 'Dungeons',
            optionName: Permalink.OPTIONS.RANDOMIZE_DUNGEON_ENTRANCES,
          }),
          this.toggleInput({
            labelText: 'Nested Bosses',
            optionName: Permalink.OPTIONS.RANDOMIZE_BOSS_ENTRANCES,
          }),
          this.toggleInput({
            labelText: 'Nested Minibosses',
            optionName: Permalink.OPTIONS.RANDOMIZE_MINIBOSS_ENTRANCES,
          }),
          this.toggleInput({
            labelText: 'Secret Caves',
            optionName: Permalink.OPTIONS.RANDOMIZE_SECRET_CAVE_ENTRANCES,
          }),
          this.toggleInput({
            labelText: 'Inner Secret Caves',
            optionName: Permalink.OPTIONS.RANDOMIZE_SECRET_CAVE_INNER_ENTRANCES,
          }),
          this.toggleInput({
            labelText: 'Fairy Fountains',
            optionName: Permalink.OPTIONS.RANDOMIZE_FAIRY_FOUNTAIN_ENTRANCES,
          }),
          this.dropdownInput({
            labelText: 'Mixing',
            optionName: Permalink.OPTIONS.MIX_ENTRANCES,
            isDisabled: (
              !this.getOptionValue(Permalink.OPTIONS.RANDOMIZE_DUNGEON_ENTRANCES)
              && !this.getOptionValue(Permalink.OPTIONS.RANDOMIZE_BOSS_ENTRANCES)
              && !this.getOptionValue(Permalink.OPTIONS.RANDOMIZE_MINIBOSS_ENTRANCES)
            ) || (
              !this.getOptionValue(Permalink.OPTIONS.RANDOMIZE_SECRET_CAVE_ENTRANCES)
              && !this.getOptionValue(Permalink.OPTIONS.RANDOMIZE_SECRET_CAVE_INNER_ENTRANCES)
              && !this.getOptionValue(Permalink.OPTIONS.RANDOMIZE_FAIRY_FOUNTAIN_ENTRANCES)
            ),
          }),
        ]}
      />
    );
  }

  additionalOptionsTable() {
    return (
      <OptionsTable
        title="Additional Options"
        numColumns={2}
        options={[
          this.dropdownInput({
            labelText: 'Sword Mode',
            optionName: Permalink.OPTIONS.SWORD_MODE,
          }),
          this.toggleInput({
            labelText: 'Key-Lunacy',
            optionName: Permalink.OPTIONS.KEYLUNACY,
          }),
          this.dropdownInput({
            labelText: 'Triforce Shards to Start With',
            optionName: Permalink.OPTIONS.NUM_STARTING_TRIFORCE_SHARDS,
          }),
          this.toggleInput({
            labelText: 'Randomize Charts',
            optionName: Permalink.OPTIONS.RANDOMIZE_CHARTS,
          }),
          this.toggleInput({
            labelText: 'Required Bosses Mode',
            optionName: Permalink.OPTIONS.REQUIRED_BOSSES,
          }),
          this.dropdownInput({
            labelText: 'Number of Required Bosses',
            optionName: Permalink.OPTIONS.NUM_REQUIRED_BOSSES,
            isDisabled: !this.getOptionValue(Permalink.OPTIONS.REQUIRED_BOSSES),
          }),
          this.toggleInput({
            labelText: 'Skip Boss Rematches',
            optionName: Permalink.OPTIONS.SKIP_REMATCH_BOSSES,
          }),
        ]}
      />
    );
  }

  logicDifficultyTable() {
    return (
      <OptionsTable
        title="Logic Difficulty"
        numColumns={2}
        options={[
          this.dropdownInput({
            labelText: 'Obscure Tricks Required',
            optionName: Permalink.OPTIONS.LOGIC_OBSCURITY,
          }),
          this.dropdownInput({
            labelText: 'Precise Tricks Required',
            optionName: Permalink.OPTIONS.LOGIC_PRECISION,
          }),
        ]}
      />
    );
  }

  openTracker(pathType, query = {}) {
    const { permalink } = this.state;

    Launcher.openTrackerWindow(`/${pathType}/${encodeURIComponent(permalink)}`, query);
  }

  copyTrackerLink(pathType, query = {}) {
    const { permalink } = this.state;

    navigator.clipboard.writeText(Launcher.trackerLink(`/${pathType}/${encodeURIComponent(permalink)}`, query));
    toast.success('Copied the tracker link to the clipboard.')
  }

  async loadFromFile(query = {}) {
    await Storage.loadFileAndStore();

    this.openTracker('load', query);
  }

  launchButtonContainer(ap = true) {
    return (
      <div className="launcher-button-container" style={ap ? { display: 'none' } : {}} data-ap={ap}>
        <button
          className="launcher-button"
          type="button"
          onClick={() => this.openTracker('new', ap ? ({ archipelago: true, ...Object.fromEntries(new URLSearchParams(jQuery('#apConfig').serialize())) }) : {})}
        >
          Launch
          {' '}
          {ap ? 'AP' : 'New'}
          {' '}
          Tracker
        </button>
        <button
          className="launcher-button"
          type="button"
          onClick={() => this.openTracker('load', ap ? ({ archipelago: true, ...Object.fromEntries(new URLSearchParams(jQuery('#apConfig').serialize())) }) : {})}
        >
          Load From Autosave
        </button>
        <button
          className="launcher-button"
          type="button"
          onClick={() => this.loadFromFile(ap ? ({ archipelago: true, ...Object.fromEntries(new URLSearchParams(jQuery('#apConfig').serialize())) }) : {})}
        >
          Load From File
        </button>
        <button
          className="launcher-button"
          type="button"
          title="Useful for recording a run with OBS +  Sharing the tracker in general"
          onClick={() => {
            const loadOrNew = window.confirm('Are you planning on loading your existing tracker progress?\r\n\r\n[Ok] - Yes, i am planning on loading my existing tracker progress.\r\n[Cancel] - No, I am just going to make myself a new tracker instead.');
            this.copyTrackerLink(loadOrNew ? 'load' : 'new', ap ? ({ archipelago: true, ...Object.fromEntries(new URLSearchParams(jQuery('#apConfig').serialize())) }) : {})
          }}
        >
          Copy Tracker Link
        </button>
      </div>
    );
  }

  render() {
    return (
      <div className="full-container">
        <div className="launcher-container">
          <div className="header">
            <img
              src={HEADER_IMAGE}
              alt="The Legend of Zelda: The Wind Waker Archipelago Randomizer Tracker"
              draggable={false}
            />
          </div>
          <div className="settings">
            {this.permalinkContainer()}
            {this.progressItemLocationsTable()}
            {this.entranceRandomizerOptionsTable()}
            {this.additionalOptionsTable()}
            {this.logicDifficultyTable()}
            {this.permalinkContainer(false)}
            {this.launchButtonContainer()}
            {this.launchButtonContainer(false)}
          </div>
          <div className="attribution">
            <span>
              AP Version of this tracker is created by josephanimate2021.
              • Current tracker is maintained by wooferzfg •
            </span>
            <a href={`https://github.com/josephanimate2021/twwr-ap-tracker/commit/${COMMIT_HASH}`} target="_blank" rel="noreferrer">
              Version:
              {' '}
              {COMMIT_HASH}
              {' '}
              (
              {BUILD_DATE}
              )
            </a>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }
}
