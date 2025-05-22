import { Client } from 'archipelago.js';
import jQuery from 'jquery';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Oval } from 'react-loader-spinner';
import { ToastContainer, toast } from 'react-toastify';

import dungeonEntrances from '../data/dungeon-entrances.json';
import islandEntrances from '../data/island-entrances.json';
import stageNames from '../data/stage_names.yaml';
import Locations from '../services/locations';
import LogicHelper from '../services/logic-helper';
import TrackerController from '../services/tracker-controller';

import Buttons from './buttons';
import Images from './images';
import ItemsTable from './items-table';
import LocationsTable from './locations-table';
import SettingsWindow from './settings-window';
import Settings from '../services/settings';
import SphereTracking from './sphere-tracking';
import Statistics from './statistics';
import Storage from './storage';

import 'react-toastify/dist/ReactToastify.css';

class Tracker extends React.PureComponent {
  constructor(props) {
    super(props);
    this.apClient = new Client();
    this.state = {
      chartListOpen: false,
      clearAllIncludesMail: true,
      settingsWindowOpen: false,
      colors: {
        extraLocationsBackground: null,
        itemsTableBackground: null,
        sphereTrackingBackground: null,
        statisticsBackground: null,
      },
      disableLogic: false,
      isLoading: true,
      lastLocation: null,
      onlyProgressLocations: true,
      openedChartForIsland: null,
      openedEntrance: null,
      openedExit: null,
      openedLocation: null,
      openedLocationIsDungeon: null,
      rightClickToClearAll: true,
      trackNonProgressCharts: false,
      trackSpheres: false,
      viewingEntrances: false,
    };
    this.queryInfo = Object.fromEntries(new URLSearchParams(window.location.search.substring(1)));
    this.isAP = this.queryInfo.archipelago && this.queryInfo.user && this.queryInfo.host;
    this.initialize();
    this.apClient.items.on('itemsReceived', (k) => {
      if (this.state.trackerState) this.recievedItems(k);
    });
    this.apClient.socket.on('bounced', (d) => {
      if (d.data?.tww_stage_name) {
        const stageName = stageNames[d.data.tww_stage_name];
        const { options: settings } = Settings.readAll();
        const allEntrances = [...dungeonEntrances, ...islandEntrances];
        const stageInfo = allEntrances.find((i) => stageName.includes(i.internalName) || stageName.includes(i.entranceZoneName));
        if (this.state.openedLocation) this.clearOpenedMenus();
        if (stageInfo) {
          if (stageInfo.isDungeon) {
            let locationName;
            switch (stageName) {
              case "Forest Haven Interior":
              case "Dragon Roost Cavern Entrance": {
                locationName = stageInfo.entranceZoneName;
                break;
              } default: {
                locationName = stageInfo.internalName;
                break;
              }
            }
            this.updateOpenedLocation({
              locationName,
              isDungeon: locationName === stageInfo.internalName,
            });
            if (settings.randomize_dungeon_entrances) {
              if (stageName.endsWith("Entrance")) {
                this.APEntrance = stageInfo;
              } else if (this.APEntrance) {
                this.updateExitForEntrance(this.APEntrance.entranceName, stageInfo.exitName);
                this.APEntrance = stageInfo;
              }
            }
          } else {
            this.updateOpenedLocation({
              locationName: stageInfo.entranceZoneName,
              isDungeon: stageInfo.isBoss === true || stageInfo.isMiniboss === true,
            });
            if (
              (
                (stageInfo.isBoss && settings.randomize_boss_entrances)
                /*
                To be honest, I have no idea on how I will tell AP the caves/fairy fountains a user entered without previous stage info. 
                Am I going to have to assume that the user entered a cave/fairy fountain via an outside vanilla location? 
                I am just going to leave these values that give out a true or false statement here in case anyone has an idea on how this problem can be solved.
                || (stageInfo.isCave && settings.randomize_secret_cave_entrances)
                || (stageInfo.isFairyFountain && settings.randomize_fairy_fountain_entrances)
                || (stageInfo.isInnerCave && settings.randomize_secret_cave_inner_entrances)
                */
                || (stageInfo.isMiniboss && settings.randomize_miniboss_entrances)
              ) && this.APEntrance
            ) this.updateExitForEntrance(this.APEntrance.entranceName, stageInfo.exitName);
          }
        } else if (this.state.trackerState) {
          const generalLocations = Object.keys(this.state.trackerState.locationsChecked);
          const generalLocationName = generalLocations.find((i) => stageName.includes(i) || i.includes(stageName));
          if (generalLocationName) this.showGeneralLocation(generalLocationName, false)
          else generalLocations.forEach((j) => {
            const detailedLocationName = Object.keys(this.state.trackerState.locationsChecked[j]).find((i) => stageName.includes(i) || i.includes(stageName));
            if (detailedLocationName) this.showGeneralLocation(j, true)
          });
        }
      }
    });
    this.clearAllLocations = this.clearAllLocations.bind(this);
    this.clearOpenedMenus = this.clearOpenedMenus.bind(this);
    this.decrementItem = this.decrementItem.bind(this);
    this.incrementItem = this.incrementItem.bind(this);
    this.toggleChartList = this.toggleChartList.bind(this);
    this.toggleSettingsWindow = this.toggleSettingsWindow.bind(this);
    this.toggleEntrances = this.toggleEntrances.bind(this);
    this.toggleLocationChecked = this.toggleLocationChecked.bind(this);
    this.toggleOnlyProgressLocations = this.toggleOnlyProgressLocations.bind(this);
    this.toggleRequiredBoss = this.toggleRequiredBoss.bind(this);
    this.unsetChartMapping = this.unsetChartMapping.bind(this);
    this.unsetEntrance = this.unsetEntrance.bind(this);
    this.unsetExit = this.unsetExit.bind(this);
    this.unsetLastLocation = this.unsetLastLocation.bind(this);
    this.updateChartMapping = this.updateChartMapping.bind(this);
    this.updateExitForEntrance = this.updateExitForEntrance.bind(this);
    this.updateOpenedChartForIsland = this.updateOpenedChartForIsland.bind(this);
    this.updateOpenedEntrance = this.updateOpenedEntrance.bind(this);
    this.updateOpenedExit = this.updateOpenedExit.bind(this);
    this.updateOpenedLocation = this.updateOpenedLocation.bind(this);
    this.updatePreferences = this.updatePreferences.bind(this);
  }

  handleError(msg) {
    toast.error(msg);
    this.apClient.socket.disconnect();
  }

  showGeneralLocation(generalLocationName, IamLookingforaDetailedLocation = false) {
    function locationUpdate($this) {
      $this.updateOpenedLocation({
        locationName: generalLocationName,
        isDungeon: generalLocationName === "Ganon's Tower",
      });
    }
    if (!IamLookingforaDetailedLocation) switch (generalLocationName) {
      case "The Great Sea": break;
      default: locationUpdate(this)
    } else locationUpdate(this)
  }


  async initialize() {
    await Images.importImages();

    const preferences = Storage.loadPreferences(); const
      $this = this;
    if (!_.isNil(preferences)) {
      this.updatePreferences(preferences);
    }

    const { loadProgress, permalink } = this.props;

    let initialData;

    async function load(apSettings = {}) {
      if (loadProgress) {
        const saveData = Storage.loadFromStorage();

        if (!_.isNil(saveData)) {
          try {
            initialData = TrackerController.initializeFromSaveData(saveData, $this.isAP, apSettings);

            toast.success('Progress loaded!');
          } catch (err) {
            TrackerController.reset();
          }
        }

        if (_.isNil(initialData)) {
          toast.error('Could not load progress from save data!');
        }
      }

      if (_.isNil(initialData)) {
        try {
          const decodedPermalink = decodeURIComponent(permalink);

          initialData = await TrackerController.initializeFromPermalink(decodedPermalink, $this.isAP, apSettings);
        } catch (err) {
          toast.error('Tracker could not be initialized!');

          throw err;
        }
      }

      const {
        logic,
        saveData,
        spheres,
        trackerState,
      } = initialData;

      $this.setState({
        isLoading: false,
        logic,
        saveData,
        spheres,
        trackerState,
      });
    }

    if (this.isAP) {
      let successfulConnection = false;
      this.apClient.login(this.queryInfo.host, this.queryInfo.user, 'The Wind Waker', {
        password: this.queryInfo.pass || '',
        tags: ['Tracker'],
      }).then(() => {
        successfulConnection = true;
        toast.success('Connected to AP');
      }).catch(toast.error);
      this.apClient.messages.on('message', toast);
      this.apClient.socket.on('disconnected', () => toast.info('Disconnected from AP'));
      this.apClient.socket.on('connectionRefused', (g) => {
        successfulConnection = true;
        this.handleError(`AP Refused connection due to the following errors: ${g.errors.join(', ')}`);
      });
      this.apClient.socket.on('connected', (e) => {
        const interval = setInterval(() => {
          if (this.apClient.authenticated) {
            clearInterval(interval);
            load(e.slot_data).then(() => {
              const interval1 = setInterval(() => {
                if (this.state.trackerState) {
                  clearInterval(interval1);
                  this.recievedItems(this.apClient.items.received);
                }
              });
            });
          }
        }, 1);
      });
      setTimeout(() => {
        if (!successfulConnection) this.handleError('AP Connection Timed Out');
      }, 34321);
    } else load();
  }

  recievedItems(itemsArray) {
    itemsArray.forEach((j) => {
      if (j.locationName !== 'Server') {
        const {
          generalLocation,
          detailedLocation,
        } = Locations.splitLocationName(j.locationName);
        this.state.trackerState.locationsChecked[generalLocation][detailedLocation] = true;
        this.setState({
          lastLocation: {
            generalLocation,
            detailedLocation,
          },
        });
      }
      const correctItem = Object.keys(
        this.state.trackerState.items,
      ).find((i) => {
        if (j.name.endsWith('Capacity Upgrade') && i.startsWith('Progressive')) return j.name === `${i.substring(12)} Capacity Upgrade`;
        return j.name.includes(i);
      });
      if (correctItem) {
        let newItemCount = 1 + this.state.trackerState.getItemValue(correctItem);
        const maxItemCount = LogicHelper.maxItemCount(correctItem);
        if (newItemCount > maxItemCount) newItemCount = 0;
        this.state.trackerState.items[correctItem] = newItemCount;
        if (
          this.state.lastLocation?.generalLocation
          && this.state.lastLocation?.detailedLocation
        ) {
          this.state.trackerState.itemsForLocations[
            this.state.lastLocation.generalLocation
          ][this.state.lastLocation.detailedLocation] = correctItem;
        }
      }
    });
    this.updateTrackerState(this.state.trackerState);
  }

  incrementItem(itemName, onAP = false) {
    const {
      lastLocation,
      trackerState,
    } = this.state;

    let newTrackerState = trackerState.incrementItem(itemName);

    if (!_.isNil(lastLocation)) {
      const {
        generalLocation,
        detailedLocation,
      } = lastLocation;

      newTrackerState = newTrackerState.setItemForLocation(
        itemName,
        generalLocation,
        detailedLocation,
      );
    }
    if (this.isAP && !onAP) return;

    this.updateTrackerState(newTrackerState);
  }

  decrementItem(itemName) {
    const { trackerState } = this.state;

    const newTrackerState = trackerState.decrementItem(itemName);

    if (!this.isAP) this.updateTrackerState(newTrackerState);
  }

  toggleLocationChecked(generalLocation, detailedLocation, onAp = false) {
    const { trackerState } = this.state;

    let newTrackerState = trackerState.toggleLocationChecked(generalLocation, detailedLocation);

    if (newTrackerState.isLocationChecked(generalLocation, detailedLocation)) {
      this.setState({
        lastLocation: {
          generalLocation,
          detailedLocation,
        },
      });
    } else {
      this.setState({ lastLocation: null });

      newTrackerState = newTrackerState.unsetItemForLocation(generalLocation, detailedLocation);
    }

    if (this.isAP && !onAp) return;

    this.updateTrackerState(newTrackerState);
  }

  clearAllLocations(zoneName) {
    const {
      clearAllIncludesMail,
      trackerState,
    } = this.state;

    const newTrackerState = trackerState.clearBannedLocations(
      zoneName,
      { includeAdditionalLocations: clearAllIncludesMail },
    );

    if (!this.isAP) this.updateTrackerState(newTrackerState);
  }

  toggleRequiredBoss(dungeonName) {
    let { trackerState: newTrackerState } = this.state;

    if (LogicHelper.isBossRequired(dungeonName)) {
      newTrackerState = newTrackerState.clearBannedLocations(
        dungeonName,
        { includeAdditionalLocations: true },
      );
      LogicHelper.setBossNotRequired(dungeonName);
    } else {
      LogicHelper.setBossRequired(dungeonName);
    }

    this.updateTrackerState(newTrackerState);
  }

  updateTrackerState(newTrackerState) {
    const {
      logic,
      saveData,
      spheres,
      trackerState,
    } = TrackerController.refreshState(newTrackerState);

    Storage.saveToStorage(saveData);
    this.setState({
      logic,
      saveData,
      spheres,
      trackerState,
    });
  }

  clearOpenedMenus() {
    this.setState({
      chartListOpen: false,
      openedChartForIsland: null,
      openedEntrance: null,
      openedExit: null,
      openedLocation: null,
      openedLocationIsDungeon: null,
    });
  }

  updateOpenedEntrance(entranceName) {
    this.setState({
      chartListOpen: false,
      openedChartForIsland: null,
      openedEntrance: entranceName,
      openedExit: null,
      openedLocation: null,
      openedLocationIsDungeon: null,
    });
  }

  updateOpenedExit(exitName) {
    this.setState({
      chartListOpen: false,
      openedChartForIsland: null,
      openedEntrance: null,
      openedExit: exitName,
      openedLocation: null,
      openedLocationIsDungeon: null,
    });
  }

  unsetEntrance(entranceName) {
    const { trackerState } = this.state;

    const newTrackerState = trackerState.unsetEntrance(entranceName);

    this.updateTrackerState(newTrackerState);
  }

  unsetExit(exitName) {
    const { trackerState } = this.state;

    const newTrackerState = trackerState.unsetExit(exitName);

    this.updateTrackerState(newTrackerState);
  }

  updateExitForEntrance(entranceName, exitName) {
    const { trackerState } = this.state;

    const newTrackerState = trackerState.setExitForEntrance(entranceName, exitName);

    this.updateTrackerState(newTrackerState);
    this.clearOpenedMenus();
  }

  updateOpenedLocation({ locationName, isDungeon }) {
    this.setState({
      chartListOpen: false,
      openedChartForIsland: null,
      openedEntrance: null,
      openedExit: null,
      openedLocation: locationName,
      openedLocationIsDungeon: isDungeon,
    });
  }

  updateChartMapping(chart, chartForIsland) {
    const { lastLocation, trackerState } = this.state;

    let newTrackerState = trackerState
      .setChartMapping(chart, chartForIsland);

    if (newTrackerState.getItemValue(chart) === 0) {
      newTrackerState = newTrackerState.incrementItem(chart);

      if (!_.isNil(lastLocation)) {
        const {
          generalLocation,
          detailedLocation,
        } = lastLocation;

        newTrackerState = newTrackerState.setItemForLocation(
          chart,
          generalLocation,
          detailedLocation,
        );
      }
    }

    if (newTrackerState.getItemValue(chartForIsland) === 0) {
      newTrackerState = newTrackerState.incrementItem(chartForIsland);
    }

    this.updateTrackerState(newTrackerState);
    this.clearOpenedMenus();
  }

  // Unset via sector should only remove mapping.
  // Unset via chart-list should remove both mapping and decrement chart.
  unsetChartMapping(chartForIsland, decrementChart) {
    const { trackerState } = this.state;
    let newTrackerState = trackerState;

    if (decrementChart) {
      const island = LogicHelper.islandFromChartForIsland(chartForIsland);
      const chart = trackerState.getChartFromChartMapping(island);

      newTrackerState = newTrackerState
        .decrementItem(chart);
    }

    newTrackerState = newTrackerState
      .decrementItem(chartForIsland)
      .unsetChartMapping(chartForIsland);

    this.updateTrackerState(newTrackerState);
  }

  updateOpenedChartForIsland(openedChartForIsland) {
    this.setState({
      chartListOpen: false,
      openedChartForIsland,
      openedEntrance: null,
      openedExit: null,
      openedLocation: null,
      openedLocationIsDungeon: null,
    });
  }

  toggleChartList() {
    const { chartListOpen } = this.state;

    this.setState({
      chartListOpen: !chartListOpen,
      openedChartForIsland: null,
      openedEntrance: null,
      openedExit: null,
      openedLocation: null,
      openedLocationIsDungeon: null,
    });
  }

  toggleOnlyProgressLocations() {
    const { onlyProgressLocations } = this.state;

    this.updatePreferences({ onlyProgressLocations: !onlyProgressLocations });
  }

  toggleSettingsWindow() {
    const { settingsWindowOpen } = this.state;

    this.setState({
      settingsWindowOpen: !settingsWindowOpen,
    });
  }

  toggleEntrances() {
    const { viewingEntrances } = this.state;

    this.updatePreferences({ viewingEntrances: !viewingEntrances });
  }

  unsetLastLocation() {
    this.setState({ lastLocation: null });
  }

  updatePreferences(preferenceChanges) {
    const {
      clearAllIncludesMail,
      disableLogic,
      onlyProgressLocations,
      colors,
      rightClickToClearAll,
      trackNonProgressCharts,
      trackSpheres,
      viewingEntrances,
    } = this.state;

    const existingPreferences = {
      clearAllIncludesMail,
      colors,
      disableLogic,
      onlyProgressLocations,
      rightClickToClearAll,
      trackNonProgressCharts,
      trackSpheres,
      viewingEntrances,
    };

    const newPreferences = _.merge({}, existingPreferences, preferenceChanges);

    this.setState(newPreferences);
    Storage.savePreferences(newPreferences);
  }

  render() {
    const {
      chartListOpen,
      clearAllIncludesMail,
      colors,
      disableLogic,
      isLoading,
      lastLocation,
      logic,
      onlyProgressLocations,
      openedChartForIsland,
      openedEntrance,
      openedExit,
      openedLocation,
      openedLocationIsDungeon,
      rightClickToClearAll,
      saveData,
      settingsWindowOpen,
      spheres,
      trackNonProgressCharts,
      trackSpheres,
      trackerState,
      viewingEntrances,
    } = this.state;

    const {
      extraLocationsBackground,
      itemsTableBackground,
      sphereTrackingBackground,
      statisticsBackground,
    } = colors;

    let content;

    if (isLoading) {
      content = (
        <div className="loading-spinner">
          <Oval color="white" secondaryColor="gray" />
        </div>
      );
    } else {
      content = (
        <div className="tracker-container">
          <div className="tracker">
            <ItemsTable
              backgroundColor={itemsTableBackground}
              decrementItem={this.decrementItem}
              incrementItem={this.incrementItem}
              spheres={spheres}
              trackerState={trackerState}
              trackSpheres={trackSpheres}
            />
            <LocationsTable
              backgroundColor={extraLocationsBackground}
              chartListOpen={chartListOpen}
              clearAllLocations={this.clearAllLocations}
              clearOpenedMenus={this.clearOpenedMenus}
              decrementItem={this.decrementItem}
              disableLogic={disableLogic}
              incrementItem={this.incrementItem}
              logic={logic}
              onlyProgressLocations={onlyProgressLocations}
              openedChartForIsland={openedChartForIsland}
              openedEntrance={openedEntrance}
              openedExit={openedExit}
              openedLocation={openedLocation}
              openedLocationIsDungeon={openedLocationIsDungeon}
              rightClickToClearAll={rightClickToClearAll}
              spheres={spheres}
              toggleLocationChecked={this.toggleLocationChecked}
              toggleRequiredBoss={this.toggleRequiredBoss}
              trackerState={trackerState}
              trackNonProgressCharts={trackNonProgressCharts}
              trackSpheres={trackSpheres}
              updateChartMapping={this.updateChartMapping}
              updateOpenedChartForIsland={this.updateOpenedChartForIsland}
              unsetChartMapping={this.unsetChartMapping}
              unsetEntrance={this.unsetEntrance}
              unsetExit={this.unsetExit}
              updateExitForEntrance={this.updateExitForEntrance}
              updateOpenedEntrance={this.updateOpenedEntrance}
              updateOpenedExit={this.updateOpenedExit}
              updateOpenedLocation={this.updateOpenedLocation}
              viewingEntrances={viewingEntrances}
            />
            <Statistics
              backgroundColor={statisticsBackground}
              disableLogic={disableLogic}
              logic={logic}
              onlyProgressLocations={onlyProgressLocations}
            />
          </div>
          {trackSpheres && (
            <SphereTracking
              backgroundColor={sphereTrackingBackground}
              lastLocation={lastLocation}
              trackerState={trackerState}
              unsetLastLocation={this.unsetLastLocation}
            />
          )}
          {settingsWindowOpen && (
            <SettingsWindow
              clearAllIncludesMail={clearAllIncludesMail}
              disableLogic={disableLogic}
              extraLocationsBackground={extraLocationsBackground}
              itemsTableBackground={itemsTableBackground}
              rightClickToClearAll={rightClickToClearAll}
              sphereTrackingBackground={sphereTrackingBackground}
              statisticsBackground={statisticsBackground}
              toggleSettingsWindow={this.toggleSettingsWindow}
              trackNonProgressCharts={trackNonProgressCharts}
              trackSpheres={trackSpheres}
              updatePreferences={this.updatePreferences}
            />
          )}
          {this.isAP ? (
            <input
              type="text"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  this.apClient.messages.say(event.target.value).then(toast).finally(() => {
                    jQuery(event.target).val('');
                  });
                }
              }}
              placeholder="Enter a command here"
            />
          ) : ''}
          <Buttons
            settingsWindowOpen={settingsWindowOpen}
            chartListOpen={chartListOpen}
            onlyProgressLocations={onlyProgressLocations}
            saveData={saveData}
            toggleChartList={this.toggleChartList}
            toggleSettingsWindow={this.toggleSettingsWindow}
            toggleEntrances={this.toggleEntrances}
            toggleOnlyProgressLocations={this.toggleOnlyProgressLocations}
            trackNonProgressCharts={trackNonProgressCharts}
            viewingEntrances={viewingEntrances}
          />
        </div>
      );
    }
    return (
      <>
        {content}
        <ToastContainer />
      </>
    );
  }
}

Tracker.propTypes = {
  loadProgress: PropTypes.bool.isRequired,
  permalink: PropTypes.string.isRequired,
};

export default Tracker;
