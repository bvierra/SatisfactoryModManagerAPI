const path = require('path');
const fs = require('fs');
const assert = require('assert');
const semver = require('semver');
const { SatisfactoryInstall, getManifestFolderPath, UnsolvableDependencyError, DependencyManifestMismatchError, InvalidConfigError } = require('../');
const { modCacheDir, forEachAsync } = require('../lib/utils');
const JSZip = require('jszip');

const dummySfName = 'DummySF';
const dummySfVersion = '117050';
const dummySfPath = path.join(__dirname, 'TestSatisfactoryInstall');
const dummySfExecutable = 'sf.exe';
const dummyMods = [
  {
    mod_id: 'dummyMod1',
    version: '1.0.0',
    dependencies: {
      'SML': '2.0.0',
    }
  },
  {
    mod_id: 'dummyMod1',
    version: '1.0.1',
    dependencies: {
      'SML': '^1.0.0',
    }
  },
  {
    mod_id: 'dummyMod1',
    version: '1.0.2',
    dependencies: {
      'SML': '>=1.0.0',
    }
  },
  {
    mod_id: 'dummyMod2',
    version: '1.0.0',
    dependencies: {
      'SML': '1.0.0',
      'dummyMod1': '^1.0.0'
    }
  },
  {
    mod_id: 'dummyMod2',
    version: '1.0.1',
    dependencies: {
      'SML': '2.0.0',
      'dummyMod1': '^1.0.0'
    }
  },
  {
    mod_id: 'dummyMod2',
    version: '1.0.2',
    dependencies: {
      'SML': '>1.0.0',
      'dummyMod1': '^1.0.1'
    }
  }
];

async function createDummyMods() {
  await forEachAsync(dummyMods, async (mod) => new Promise((resolve) => {
    const filePath = path.join(modCacheDir, `${mod.mod_id}_${mod.version}.smod`);
    const zip = new JSZip();
    zip.file("data.json", JSON.stringify(mod));
    zip
      .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
      .pipe(fs.createWriteStream(filePath))
      .on('finish', function () {
        resolve();
      });
  }));
}

async function removeDummyMods() {
  await forEachAsync(dummyMods, async (mod) => {
    const filePath = path.join(modCacheDir, `${mod.mod_id}_${mod.version}.smod`);
    fs.unlinkSync(filePath);
  });
}

function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file, index) {
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

async function main() {
  return; // Dummy mods no longer work due to manifest changes. Need updated mods with dependencies to test
  fs.mkdirSync(dummySfPath, { recursive: true });
  await createDummyMods()

  let success = true;

  try {
    // TODO: maybe better testing
    const sfInstall = new SatisfactoryInstall(dummySfName, dummySfVersion, dummySfPath, dummySfExecutable);
    let installedMods;

    fs.mkdirSync(sfInstall.modsDir, { recursive: true });
    fs.writeFileSync(path.join(sfInstall.modsDir, 'someFile.randomExt'), '');
    fs.writeFileSync(path.join(sfInstall.modsDir, 'data.json'), '');
    /*fs.mkdirSync(path.join(dummySfPath, 'FactoryGame', 'Binaries', 'Win64', 'mods'), { recursive: true });
    fs.writeFileSync(path.join(dummySfPath, 'FactoryGame', 'Binaries', 'Win64', 'xinput1_3.dll'), '');
    fs.mkdirSync(path.join(dummySfPath, 'FactoryGame', 'Binaries', 'Win64', 'config'), { recursive: true });
    fs.mkdirSync(path.join(dummySfPath, 'FactoryGame', 'Content', 'Paks'), { recursive: true });
    fs.writeFileSync(path.join(dummySfPath, 'FactoryGame', 'Content', 'Paks', 'Test.pak'), '');
    fs.writeFileSync(path.join(dummySfPath, 'FactoryGame', 'Content', 'Paks', 'Test.sig'), '');
    fs.writeFileSync(path.join(dummySfPath, 'FactoryGame', 'Content', 'Paks', 'FactoryGame-WindowsNoEditor.pak'), '');
    fs.writeFileSync(path.join(dummySfPath, 'FactoryGame', 'Content', 'Paks', 'FactoryGame-WindowsNoEditor.sig'), '');*/
    // TODO: This cannot be tested yet

    try {
      await sfInstall.installMod('dummyMod1', '1.0.0');
      installedMods = await sfInstall._getInstalledMods();
      assert.strictEqual(installedMods.length, 1, 'Install without dependency failed');
    } catch (e) {
      if (e instanceof assert.AssertionError) {
        throw e;
      }
      assert.fail(`Unexpected error: ${e}`);
    }

    /*assert.strictEqual(fs.existsSync(path.join(dummySfPath, 'FactoryGame', 'Binaries', 'Win64', 'mods')), false, 'Old mods folder still exists');
    assert.strictEqual(fs.existsSync(path.join(dummySfPath, 'FactoryGame', 'Binaries', 'Win64', 'config')), false, 'Old config folder still exists');
    assert.strictEqual(fs.existsSync(path.join(dummySfPath, 'FactoryGame', 'Content', 'Paks', 'Test.pak')), false, 'Old mod pak still exists');
    assert.strictEqual(fs.existsSync(path.join(dummySfPath, 'FactoryGame', 'Content', 'Paks', 'Test.sig')), false, 'Old mod sig still exists');
    assert.strictEqual(fs.existsSync(path.join(dummySfPath, 'FactoryGame', 'Content', 'Paks', 'FactoryGame-WindowsNoEditor.pak')), true, 'FG pak does not exist');
    assert.strictEqual(fs.existsSync(path.join(dummySfPath, 'FactoryGame', 'Content', 'Paks', 'FactoryGame-WindowsNoEditor.sig')), true, 'FG sig does not exist');*/
    // TODO: This cannot be tested yet

    try {
      await sfInstall.installMod('dummyMod2', '1.0.0');
      installedMods = await sfInstall._getInstalledMods();
      if (installedMods.some((mod) => mod.mod_id === 'dummyMod1' && mod.version === '1.0.0')) {
        assert.fail('Install mod with conflicting SML succeeded');
      }
      assert.strictEqual(installedMods.length, 1, 'Install removed/added a mod');
    } catch (e) {
      if (e instanceof assert.AssertionError) {
        throw e;
      }
      if (!e instanceof UnsolvableDependencyError) {
        assert.fail(`Unexpected error: ${e}`);
      }
    }

    try {
      await sfInstall.installMod('dummyMod2', '1.0.1');
      installedMods = await sfInstall._getInstalledMods();
      if (!installedMods.some((mod) => mod.mod_id === 'dummyMod2' && mod.version === '1.0.1')) {
        assert.fail('Install mod with existing dependency failed');
      }
      assert.strictEqual(installedMods.length, 2, 'Install removed/added a mod');
    } catch (e) {
      if (e instanceof assert.AssertionError) {
        throw e;
      }
      assert.fail(`Unexpected error: ${e}`);
    }

    const testConfigInstalledMods = await sfInstall._getInstalledMods();

    try {

      await sfInstall.saveConfig('testConfig');
    } catch (e) {
      assert.fail(`Unexpected error: ${e}`);
    }
    try {
      await sfInstall.saveConfig('Vanilla');
      assert.fail('Saved vanilla config');
    } catch (e) {
      if (e instanceof assert.AssertionError) {
        throw e;
      }
      if (!(e instanceof InvalidConfigError)) {
        assert.fail(`Unexpected error: ${e}`);
      }
    }

    /*try {
      await sfInstall.uninstallMod('dummyMod2');
      installedMods = await sfInstall._getInstalledMods();
      assert.strictEqual(installedMods.length, 1, 'Uninstall failed');
    } catch (e) {
      if (e instanceof assert.AssertionError) {
        throw e;
      }
      assert.fail(`Unexpected error: ${e}`);
    }

    try {
      await sfInstall.uninstallMod('dummyMod1');
      installedMods = await sfInstall._getInstalledMods();
      assert.strictEqual(installedMods.length, 0, 'Uninstall 2 failed');
    } catch (e) {
      if (e instanceof assert.AssertionError) {
        throw e;
      }
      assert.fail(`Unexpected error: ${e}`);
    }

    try {
      await sfInstall.installMod('dummyMod2', '1.0.2');
      installedMods = await sfInstall._getInstalledMods();
      if (!installedMods.some((mod) => mod.mod_id === 'dummyMod2' && mod.version === '1.0.1') || !installedMods.some((mod) => mod.mod_id === 'dummyMod1' && mod.version === '1.0.2')) {
        assert.fail('Update mod with existing dependency failed');
      }
      assert.strictEqual(installedMods.length, 2, 'Update removed/added a mod');
    } catch (e) {
      if (e instanceof assert.AssertionError) {
        throw e;
      }
      assert.fail(`Unexpected error: ${e}`);
    }*/
    // The mods are not on ficsit.app and that's where lockfile looks 

    try {
      await sfInstall.uninstallMod('dummyMod1');
      installedMods = await sfInstall._getInstalledMods();
      assert.strictEqual(installedMods.length, 2, 'Uninstall dependency succeeded');
      assert.strictEqual(installedMods.some((mod) => mod.mod_id === 'dummyMod1' && mod.version === '1.0.0'), true, 'Uninstall dependency changed version');
    } catch (e) {
      if (e instanceof assert.AssertionError) {
        throw e;
      }
      assert.fail(`Unexpected error: ${e}`);
    }

    try {
      await sfInstall.manifestMutate({});
      assert.deepStrictEqual(installedMods, await sfInstall._getInstalledMods(), 'Empty mutation changed something');
    } catch (e) {
      if (e instanceof assert.AssertionError) {
        throw e;
      }
      assert.fail(`Unexpected error: ${e}`);
    }

    try {
      await sfInstall.loadConfig('testConfig');
    } catch (e) {
      assert.fail(`Unexpected error: ${e}`);
    }

    try {
      await sfInstall.loadConfig('Vanilla');
      installedMods = await sfInstall._getInstalledMods();
      assert.strictEqual(installedMods.length, 0, 'Vanilla is not clean');
      assert.strictEqual(sfInstall.smlVersion, undefined, 'Vanilla is not clean');
      assert.strictEqual(sfInstall.bootstrapperVersion, undefined, 'Vanilla is not clean');
    } catch (e) {
      if (e instanceof assert.AssertionError) {
        throw e;
      }
      assert.fail(`Unexpected error: ${e}`);
    }

    try {
      await sfInstall.loadConfig('testConfig');
      installedMods = await sfInstall._getInstalledMods();
      assert.deepStrictEqual(testConfigInstalledMods, installedMods, 'Config not loaded correctly');
    } catch (e) {
      assert.fail(`Unexpected error: ${e}`);
    }
  } catch (e) {
    console.error(e);
    success = false;
  } finally {
    try {
      fs.rmdirSync(dummySfPath, { recursive: true });
      fs.rmdirSync(getManifestFolderPath(dummySfPath), { recursive: true });
    } catch (e) {
      if (e.code === "ENOTEMPTY") {
        deleteFolderRecursive(dummySfPath);
        deleteFolderRecursive(getManifestFolderPath(dummySfPath));
      } else {
        throw e;
      }
    }
    await removeDummyMods();
  }
  if (!success) {
    process.exit(1);
  }
}

main();