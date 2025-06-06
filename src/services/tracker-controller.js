import Locations from './locations';
import LogicCalculation from './logic-calculation';
import LogicHelper from './logic-helper';
import LogicLoader from './logic-loader';
import LogicTweaks from './logic-tweaks';
import Macros from './macros';
import Settings from './settings';
import Spheres from './spheres';
import TrackerState from './tracker-state';

class TrackerController {
  static async initializeFromPermalink(permalink, isAP = false, apSettings = {}) {
    Settings.initializeFromPermalink(permalink);

    const {
      itemLocationsFile,
      macrosFile,
    } = await LogicLoader.loadLogicFiles();

    Locations.initialize(itemLocationsFile);
    Macros.initialize(macrosFile);

    LogicTweaks.applyTweaks();

    LogicHelper.initialize(isAP, apSettings);

    return this.refreshState(TrackerState.default());
  }

  static initializeFromSaveData(saveData, isAP = false, apSettings = {}) {
    const {
      locations,
      macros,
      settings,
      trackerState,
    } = JSON.parse(saveData);

    Settings.initializeRaw(settings);

    Locations.initializeRaw(locations);
    Macros.initialize(macros);

    LogicHelper.initialize(isAP, apSettings);

    return this.refreshState(TrackerState.createStateRaw(trackerState));
  }

  static reset() {
    Locations.reset();
    LogicHelper.reset();
    Macros.reset();
    Settings.reset();
  }

  static refreshState(newState) {
    const logic = new LogicCalculation(newState);
    const spheres = new Spheres(newState);
    const saveData = this.#getSaveData(newState);

    return {
      logic,
      saveData,
      spheres,
      trackerState: newState,
    };
  }

  static #getSaveData(trackerState) {
    const saveData = {
      locations: Locations.readAll(),
      macros: Macros.readAll(),
      settings: Settings.readAll(),
      trackerState: trackerState.readState(),
    };

    return JSON.stringify(saveData);
  }
}

export default TrackerController;
