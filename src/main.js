const {exec} = require("child_process");
const fs = require("fs");
const os = require("os");

let timeAll = 0;
console.log(`plugin begin render task for frame ${frame}`);

const script = "from datetime import datetime\nfrom bpy.app import handlers\nimport bpy.types\n" +
    "import bpy\nimport os\nimport json\nimport sys\nimport time\n\n\nprint(bpy.context.scene.cycles.samples)\n" +
    "\nFRAME_START_TIME = None\nRENDER_START_TIME = None\noutputDir = bpy.context.scene.render.filepath\n" +
    "\nargv = sys.argv\nargv = argv[argv.index(\"--\") + 1:]\nframe = int(argv[0])\nbpy.context.scene.cycles.samples = int(argv[1])\n" +
    "bpy.context.scene.render.resolution_x = int(argv[2])\nbpy.context.scene.render.resolution_y = int(argv[3])\nprint(argv[1])\n" +
    "print(\"asd\")\nbpy.context.scene.render.filepath = \"/Projects/\" + str(argv[4]).zfill(4)\nbpy.context.scene.frame_set(int(frame))\n" +
    "bpy.ops.render.render(write_still=True, use_viewport=True)"

const scriptName = "Atlas-slave-temp" + Math.floor(Math.random() * (110000 - 100000) + 100000) + `.py`;

console.log(scriptName);

fs.writeFileSync(os.tmpdir() + `\\` + scriptName, script);

const command = [
    `${env.pathToBlender.substr(0, 2)} && cd ${env.pathToBlender.substr(2)} && blender --verbose 4 ${pluginSettings.pathToBlenderScene}`,
    ` --background --python ${os.tmpdir() + `\\` + scriptName} `,
    `-- ${+frame} ${+pluginSettings.samples} ${+pluginSettings.resolutionX} ${+pluginSettings.resolutionY} ${+renumbered}`
].join("");
const cp = exec(command,(error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log("100%\nfinish render");
        finishJob("done", "render finished!");
        fs.unlink(os.tmpdir() + `\\` + scriptName, () => {console.log("Script was deleted")});
        // console.log(`stdout: ${stdout}`);
    });
console.log("Prepare for rendering!");
cp.stdout.on("data", async (data) => {
    // console.log(data);
    const cols = data.split("|");
    // console.log(cols);
    for (let i = 0; i < cols.length; i++) {
        if (cols[i].includes(" Path Tracing Sample 2/")) {
            for (let j = 0; j < cols.length; j++) {
                if (cols[j].includes("Remaining")) {
                    let min1 = +cols[j].substr(11, 2);
                    let sec1 = +cols[j].substr(14, 2);
                    let ms1 = +cols[j].substr(17, 2);
                    timeAll = (min1 * 60000) + (sec1 * 1000) + ms1;
                }
            }
        }
    }
    for (let i = 0; i < cols.length; i++) {
        if (cols[i].includes("Remaining")) {
            let min2 = +cols[i].substr(11, 2);
            let sec2 = +cols[i].substr(14, 2);
            let ms2 = +cols[i].substr(17, 2);
            let timeNow = (min2 * 60000) + (sec2 * 1000) + ms2;
            if(timeAll < timeNow){
                timeAll = timeNow;
            }
            console.log(`${(100 - (timeNow / timeAll) * 100).toFixed(2)}%`);
            await sendReport("info", {progress: (100 - (timeNow / timeAll) * 100).toFixed(2)});
        }
    }
    await sendReport("info", {message: data});
});
