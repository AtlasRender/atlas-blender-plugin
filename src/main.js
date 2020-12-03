const {exec} = require("child_process");

let timeAll = 0;
console.log(`plugin begin render task for frame ${frame}`);

const script = `from datetime import datetime
from bpy.app import handlers
import bpy.types
import bpy
import os
import json
import sys
import time


print(bpy.context.scene.cycles.samples)

FRAME_START_TIME = None
RENDER_START_TIME = None
outputDir = bpy.context.scene.render.filepath

argv = sys.argv
argv = argv[argv.index("--") + 1:]
frame = int(argv[0])
bpy.context.scene.cycles.samples = int(argv[1])
bpy.context.scene.render.resolution_x = int(argv[2])
bpy.context.scene.render.resolution_y = int(argv[3])
print(argv[1])
print("asd")
bpy.context.scene.render.filepath = "/Projects/" + str(argv[4]).zfill(4)
bpy.context.scene.frame_set(int(frame))
bpy.ops.render.render(write_still=True, use_viewport=True)`;

const command = [
    `${pathToBlender.substr(0, 2)} && cd ${pathToBlender.substr(2)} && blender --verbose 4 ${pathToBlenderScene}`,
    ` --background --python Projects\\script1\\blender_script.py `,
    `-- ${+frame} ${+samples} ${+resolutionX} ${+resolutionY} ${+renumbered}`
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
            console.log(`${(100 - (timeNow / timeAll) * 100).toFixed(2)}%`);
            await sendReport("info", {progress: (100 - (timeNow / timeAll) * 100).toFixed(2)});
        }
    }
    sendReport("info", {message: data});
});
